// ============================================
// Admin Routes — Full Admin Panel API
// Dashboard, Users, Shops, Products, Orders,
// Categories, Promo Codes, Delivery Zones,
// Banners, Payouts, Notifications, Reports,
// Logs, Settings
// ============================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, requirePermission } from '../../middleware/auth.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import { setAuthCookies } from '../../utils/cookie.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { checkRateLimit, cacheDelete } from '../../config/redis.js';
import { sendMulticastPush } from '../../config/firebase.js';
import bcrypt from 'bcryptjs';
import { indexProduct, removeProductFromIndex, bulkIndexProducts, clearIndex, initMeilisearch } from '../../services/search.service.js';
import { CacheKeys } from '../../utils/constants.js';

// ============================================
// Analytics date helpers
// ============================================
function getAnalyticsDates(period: string) {
  const now = new Date();
  const startDate = new Date();
  let days = 30;

  if (period === '1d') { days = 1; startDate.setDate(now.getDate() - 1); }
  else if (period === '7d') { days = 7; startDate.setDate(now.getDate() - 7); }
  else if (period === '30d') { days = 30; startDate.setDate(now.getDate() - 30); }
  else if (period === '90d') { days = 90; startDate.setDate(now.getDate() - 90); }
  else if (period === '1y') { days = 365; startDate.setFullYear(now.getFullYear() - 1); }
  else { startDate.setDate(now.getDate() - 30); }

  const prevEndDate = new Date(startDate);
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  // Group format: hourly for 1d, daily for 7d/30d, weekly for 90d, monthly for 1y
  let groupFormat = 'YYYY-MM-DD';
  if (period === '1d') groupFormat = 'YYYY-MM-DD HH24:00';
  else if (period === '1y') groupFormat = 'YYYY-MM';
  else if (period === '90d') groupFormat = 'IYYY-IW'; // ISO week

  return { startDate, prevStartDate, prevEndDate, groupFormat, days };
}

// ============================================
// Admin Auth
// ============================================
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ============================================
// Route Registration
// ============================================
export async function adminRoutes(app: FastifyInstance) {

  // ==========================================
  // AUTH: Admin Login
  // ==========================================
  app.post('/auth/admin/login', async (request, reply) => {
    const { email, password } = adminLoginSchema.parse(request.body);

    // Rate limiting: 5 urinish / 15 daqiqa
    const rateLimitKey = `login:admin:${email}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 5, 900);
    if (!rateCheck.allowed) {
      throw new AppError(
        `Juda ko'p urinish. ${Math.ceil((rateCheck.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    const user = await prisma.profile.findFirst({
      where: { email, role: 'admin' },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Email yoki parol noto\'g\'ri', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Email yoki parol noto\'g\'ri', 401);
    }

    // Fetch admin role/permissions
    const adminRole = await prisma.adminRole.findUnique({
      where: { userId: user.id },
    });

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // httpOnly cookie o'rnatish
    setAuthCookies(reply, token, refreshToken);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'admin.login',
        entityType: 'profile',
        entityId: user.id,
        ipAddress: request.ip,
      },
    });

    return reply.send({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        adminRole: adminRole ? {
          level: adminRole.level,
          permissions: adminRole.permissions,
        } : {
          level: 'super_admin',
          permissions: [],
        },
      },
    });
  });

  // ==========================================
  // ADMIN ME - Get current admin profile + permissions
  // ==========================================
  app.get('/admin/me', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const user = await prisma.profile.findUnique({
      where: { id: request.user!.userId },
      select: { id: true, email: true, fullName: true, role: true, avatarUrl: true, phone: true },
    });

    if (!user) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    const adminRole = await prisma.adminRole.findUnique({
      where: { userId: user.id },
    });

    return reply.send({
      success: true,
      data: {
        user,
        adminRole: adminRole ? {
          level: adminRole.level,
          permissions: adminRole.permissions,
        } : {
          level: 'super_admin',
          permissions: [],
        },
      },
    });
  });

  // ==========================================
  // DASHBOARD
  // ==========================================
  app.get('/admin/dashboard', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalShops,
      totalProducts,
      totalOrders,
      todayOrders,
      pendingShops,
      pendingProducts, // has_errors or on_review
      totalRevenue,
      todayRevenue,
    ] = await Promise.all([
      prisma.profile.count({ where: { role: 'user' } }),
      prisma.shop.count({ where: { status: 'active' } }),
      prisma.product.count({ where: { status: 'active' } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.shop.count({ where: { status: 'pending' } }),
      prisma.product.count({ where: { status: { in: ['on_review', 'has_errors'] } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid', createdAt: { gte: today } } }),
    ]);

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, phone: true } },
        items: { include: { shop: { select: { name: true } } } },
      },
    });

    return {
      success: true,
      data: {
        stats: {
          totalUsers,
          totalShops,
          totalProducts,
          totalOrders,
          todayOrders,
          pendingShops,
          pendingProducts,
          totalRevenue: totalRevenue._sum.total || 0,
          todayRevenue: todayRevenue._sum.total || 0,
        },
        recentOrders,
      },
    };
  });

  // ==========================================
  // USERS
  // ==========================================
  app.get('/admin/users', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const search = query.search as string | undefined;
    const role = query.role as string | undefined;
    const status = query.status as string | undefined;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, phone: true, email: true, fullName: true,
          role: true, status: true, avatarUrl: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    return { success: true, data: { items: users, pagination: paginationMeta(page, limit, total) } };
  });

  app.put('/admin/users/:id/status', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { status } = z.object({ status: z.enum(['active', 'blocked', 'inactive']) }).parse(request.body);

    const user = await prisma.profile.update({ where: { id }, data: { status } });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: `user.${status}`,
        entityType: 'profile',
        entityId: id,
        ipAddress: request.ip,
      },
    });

    return { success: true, data: user };
  });

  // PUT /admin/users/:id/role — foydalanuvchi rolini o'zgartirish
  app.put('/admin/users/:id/role', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('users.manage')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { role } = z.object({ role: z.enum(['user', 'vendor', 'courier', 'admin']) }).parse(request.body);

    // O'zini o'zgartirmaslik
    if (id === request.user!.userId) {
      throw new AppError('O\'z rolingizni o\'zgartira olmaysiz', 400);
    }

    const user = await prisma.profile.update({ where: { id }, data: { role } });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: `user.role_change`,
        entityType: 'profile',
        entityId: id,
        details: { newRole: role },
        ipAddress: request.ip,
      },
    });

    return { success: true, data: user };
  });

  // ==========================================
  // SHOPS
  // ==========================================

  // Shop statistikasi
  app.get('/admin/shops/stats', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async () => {
    const [total, pending, active, blocked, inactive] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { status: 'pending' } }),
      prisma.shop.count({ where: { status: 'active' } }),
      prisma.shop.count({ where: { status: 'blocked' } }),
      prisma.shop.count({ where: { status: 'inactive' } }),
    ]);
    return { success: true, data: { total, pending, active, blocked, inactive } };
  });

  app.get('/admin/shops', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as string | undefined;
    const search = query.search as string | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { fullName: true, phone: true, email: true } },
          _count: { select: { products: true, orderItems: true } },
        },
      }),
      prisma.shop.count({ where }),
    ]);

    return { success: true, data: { items: shops, pagination: paginationMeta(page, limit, total) } };
  });

  app.get('/admin/shops/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        owner: { select: { fullName: true, phone: true, email: true, createdAt: true } },
        _count: { select: { products: true, orderItems: true, reviews: true } },
      },
    });
    if (!shop) throw new NotFoundError('Do\'kon');
    return { success: true, data: shop };
  });

  app.put('/admin/shops/:id/status', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { status, reason } = z.object({
      status: z.enum(['active', 'blocked', 'inactive', 'pending']),
      reason: z.string().optional(),
    }).parse(request.body);

    const shop = await prisma.shop.update({ where: { id }, data: { status } });

    // Agar shop active bo'lsa, owner'ga vendor rolini berish
    if (status === 'active' && shop.ownerId) {
      await prisma.profile.update({
        where: { id: shop.ownerId },
        data: { role: 'vendor' },
      });
    }
    // Agar shop bloklangan yoki nofaol bo'lsa, owner'ni user roliga qaytarish
    if ((status === 'blocked' || status === 'inactive') && shop.ownerId) {
      await prisma.profile.update({
        where: { id: shop.ownerId },
        data: { role: 'user' },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: `shop.${status}`,
        entityType: 'shop',
        entityId: id,
        details: reason ? { reason } : undefined,
        ipAddress: request.ip,
      },
    });

    // Notify shop owner
    if (shop.ownerId) {
      const titleMap: Record<string, string> = {
        active: '✅ Do\'koningiz tasdiqlandi!',
        blocked: '🚫 Do\'koningiz bloklandi',
        inactive: '⏸️ Do\'koningiz to\'xtatildi',
      };
      if (titleMap[status]) {
        await prisma.notification.create({
          data: {
            userId: shop.ownerId,
            type: 'system',
            title: titleMap[status],
            body: reason || `Do'koningiz statusi "${status}" ga o'zgartirildi`,
          },
        });
      }
    }

    return { success: true, data: shop };
  });

  app.put('/admin/shops/:id/commission', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { commissionRate } = z.object({
      commissionRate: z.number().min(0).max(100),
    }).parse(request.body);

    const shop = await prisma.shop.update({
      where: { id },
      data: { commissionRate },
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'shop.commission_change',
        entityType: 'shop',
        entityId: id,
        details: { commissionRate },
        ipAddress: request.ip,
      },
    });

    return { success: true, data: shop };
  });

  // ==========================================
  // DELETE SHOP (Admin)
  // ==========================================
  app.delete('/admin/shops/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, phone: true } },
        _count: { select: { products: true, orderItems: true } },
      },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

    // Faol buyurtmalari bor bo'lsa o'chirishga ruxsat bermaslik
    const activeOrders = await prisma.orderItem.count({
      where: {
        shopId: id,
        order: {
          status: { in: ['pending', 'processing', 'ready_for_pickup', 'courier_assigned', 'courier_picked_up', 'shipping'] },
        },
      },
    });
    if (activeOrders > 0) {
      throw new AppError(`Bu do'konda ${activeOrders} ta faol buyurtma bor. Avval buyurtmalarni yakunlang.`, 400);
    }

    // Transaksiya ichida o'chirish
    await prisma.$transaction(async (tx) => {
      // 1. Mahsulotlarni o'chirish (product images, reviews, views ham cascade delete bo'ladi)
      await tx.product.deleteMany({ where: { shopId: id } });
      // 2. Do'kon reviewlarini o'chirish
      await tx.shopReview.deleteMany({ where: { shopId: id } });
      // 3. Do'kon followlarini o'chirish
      await tx.shopFollow.deleteMany({ where: { shopId: id } });
      // 4. Chat roomlarni o'chirish
      const chatRooms = await tx.chatRoom.findMany({ where: { shopId: id }, select: { id: true } });
      if (chatRooms.length > 0) {
        const chatRoomIds = chatRooms.map(r => r.id);
        await tx.chatMessage.deleteMany({ where: { roomId: { in: chatRoomIds } } });
        await tx.chatRoom.deleteMany({ where: { shopId: id } });
      }
      // 5. Vendor dokumentlarini o'chirish
      await tx.vendorDocument.deleteMany({ where: { shopId: id } });
      // 6. Vendor transaksiyalarini o'chirish
      await tx.vendorTransaction.deleteMany({ where: { shopId: id } });
      // 7. Payoutlarni o'chirish
      await tx.payout.deleteMany({ where: { shopId: id } });
      // 8. Do'konni o'chirish
      await tx.shop.delete({ where: { id } });

      // 9. Owner'ni user roliga qaytarish
      if (shop.ownerId) {
        await tx.profile.update({
          where: { id: shop.ownerId },
          data: { role: 'user' },
        });
      }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'shop.deleted',
        entityType: 'shop',
        entityId: id,
        details: {
          shopName: shop.name,
          ownerId: shop.ownerId,
          productsDeleted: shop._count.products,
        },
        ipAddress: request.ip,
      },
    });

    // Ownerga bildirishnoma
    if (shop.ownerId) {
      await prisma.notification.create({
        data: {
          userId: shop.ownerId,
          type: 'system',
          title: '🗑️ Do\'koningiz o\'chirildi',
          body: `"${shop.name}" do'koningiz admin tomonidan o'chirildi. Savol bo'lsa, qo'llab-quvvatlash xizmatiga murojaat qiling.`,
        },
      });
    }

    return { success: true, message: `"${shop.name}" do'koni muvaffaqiyatli o'chirildi` };
  });

  // ==========================================
  // PRODUCTS (Admin moderation)
  // ==========================================
  app.get('/admin/products', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as string | undefined;
    const search = query.search as string | undefined;
    const shopId = query.shopId as string | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (shopId) where.shopId = shopId;
    if (search) {
      where.OR = [
        { nameUz: { contains: search, mode: 'insensitive' } },
        { nameRu: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total, stats] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: { select: { id: true, name: true } },
          category: { select: { id: true, nameUz: true, nameRu: true } },
          brand: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
      Promise.all([
        prisma.product.count({ where: { status: 'active' } }),
        prisma.product.count({ where: { status: 'on_review' } }),
        prisma.product.count({ where: { status: 'has_errors' } }),
        prisma.product.count({ where: { status: 'blocked' } }),
        prisma.product.count({ where: { status: 'hidden' } }),
        prisma.product.count({ where: { status: 'draft' } }),
      ]),
    ]);

    return {
      success: true,
      data: {
        items: products,
        pagination: paginationMeta(page, limit, total),
        stats: {
          active: stats[0],
          onReview: stats[1],
          hasErrors: stats[2],
          blocked: stats[3],
          hidden: stats[4],
          draft: stats[5],
        },
      },
    };
  });

  app.put('/admin/products/:id/block', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { reason } = z.object({ reason: z.string().min(1) }).parse(request.body);

    const product = await prisma.product.update({
      where: { id },
      data: {
        status: 'blocked',
        moderatedBy: request.user!.userId,
        moderatedAt: new Date(),
      },
      include: { shop: { select: { ownerId: true, name: true } } },
    });

    // Log
    await prisma.productModerationLog.create({
      data: {
        productId: id,
        adminId: request.user!.userId,
        action: 'admin_blocked',
        reason,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'product.block',
        entityType: 'product',
        entityId: id,
        details: { reason, productName: product.nameUz },
        ipAddress: request.ip,
      },
    });

    // Notify vendor
    if (product.shop?.ownerId) {
      await prisma.notification.create({
        data: {
          userId: product.shop.ownerId,
          type: 'system',
          title: '🚫 Mahsulotingiz bloklandi',
          body: `"${product.nameUz}" bloklandi. Sabab: ${reason}`,
          data: { productId: id },
        },
      });
    }

    // Meilisearch'dan o'chirish
    removeProductFromIndex(id).catch(() => {});

    return { success: true, data: product };
  });

  app.put('/admin/products/:id/unblock', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.update({
      where: { id },
      data: {
        status: 'active',
        moderatedBy: request.user!.userId,
        moderatedAt: new Date(),
      },
      include: { shop: { select: { ownerId: true } } },
    });

    await prisma.productModerationLog.create({
      data: {
        productId: id,
        adminId: request.user!.userId,
        action: 'admin_unblocked',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'product.unblock',
        entityType: 'product',
        entityId: id,
        ipAddress: request.ip,
      },
    });

    // Meilisearch'ga qayta qo'shish
    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, nameUz: true, nameRu: true } },
        brand: { select: { id: true, name: true } },
        shop: { select: { id: true, name: true, ownerId: true } },
      },
    });
    if (fullProduct) {
      indexProduct(fullProduct).catch(() => {});
    }

    if (product.shop?.ownerId) {
      await prisma.notification.create({
        data: {
          userId: product.shop.ownerId,
          type: 'system',
          title: '✅ Mahsulotingiz blokdan chiqarildi',
          body: `"${product.nameUz}" endi saytda ko'rinadi`,
          data: { productId: id },
        },
      });
    }

    return { success: true, data: product };
  });

  // PUT /admin/products/:id/approve — mahsulotni tasdiqlash
  app.put('/admin/products/:id/approve', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.update({
      where: { id },
      data: {
        status: 'active',
        isActive: true,
        moderatedBy: request.user!.userId,
        moderatedAt: new Date(),
      },
      include: { shop: { select: { ownerId: true, name: true } } },
    });

    await prisma.productModerationLog.create({
      data: {
        productId: id,
        adminId: request.user!.userId,
        action: 'admin_unblocked', // approved = unblocked
        reason: 'Admin tasdiqladi',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'product.approve',
        entityType: 'product',
        entityId: id,
        details: { productName: product.nameUz },
        ipAddress: request.ip,
      },
    });

    if (product.shop?.ownerId) {
      await prisma.notification.create({
        data: {
          userId: product.shop.ownerId,
          type: 'system',
          title: '✅ Mahsulotingiz tasdiqlandi',
          body: `"${product.nameUz}" tekshiruvdan o'tdi va saytda ko'rinadi`,
          data: { productId: id },
        },
      });
    }

    return { success: true, data: product };
  });

  // PUT /admin/products/:id/reject — mahsulotni rad etish
  app.put('/admin/products/:id/reject', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { reason } = z.object({ reason: z.string().min(1, 'Sabab kiritish kerak') }).parse(request.body);

    const product = await prisma.product.update({
      where: { id },
      data: {
        status: 'has_errors',
        isActive: false,
        moderatedBy: request.user!.userId,
        moderatedAt: new Date(),
        validationErrors: [{ field: 'moderation', message: reason }],
      },
      include: { shop: { select: { ownerId: true, name: true } } },
    });

    await prisma.productModerationLog.create({
      data: {
        productId: id,
        adminId: request.user!.userId,
        action: 'auto_rejected',
        reason,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'product.reject',
        entityType: 'product',
        entityId: id,
        details: { reason, productName: product.nameUz },
        ipAddress: request.ip,
      },
    });

    if (product.shop?.ownerId) {
      await prisma.notification.create({
        data: {
          userId: product.shop.ownerId,
          type: 'system',
          title: '❌ Mahsulotingiz rad etildi',
          body: `"${product.nameUz}" tekshiruvdan o'tmadi. Sabab: ${reason}`,
          data: { productId: id },
        },
      });
    }

    return { success: true, data: product };
  });

  app.delete('/admin/products/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    // Aktiv buyurtmalari borligini tekshirish
    const activeOrders = await prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: { notIn: ['delivered', 'cancelled'] },
        },
      },
    });

    if (activeOrders > 0) {
      throw new AppError(
        `Bu mahsulotda ${activeOrders} ta aktiv buyurtma bor. Avval buyurtmalarni yakunlang.`,
        400
      );
    }

    await prisma.product.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'product.delete',
        entityType: 'product',
        entityId: id,
        ipAddress: request.ip,
      },
    });

    return { success: true, message: 'Mahsulot o\'chirildi' };
  });

  // ==========================================
  // ORDERS
  // ==========================================
  app.get('/admin/orders', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as string | undefined;
    const search = query.search as string | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, phone: true } },
          items: {
            include: {
              shop: { select: { name: true } },
              product: { select: { nameUz: true, images: true } },
            },
          },
          address: { select: { fullAddress: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { success: true, data: { items: orders, pagination: paginationMeta(page, limit, total) } };
  });

  app.get('/admin/orders/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, phone: true, email: true } },
        address: true,
        items: {
          include: {
            shop: { select: { name: true, phone: true } },
            product: { select: { nameUz: true, images: true } },
          },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        courier: {
          include: {
            profile: { select: { fullName: true, phone: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundError('Buyurtma');
    return { success: true, data: order };
  });

  // PUT /admin/orders/:id/status — admin buyurtma statusini o'zgartirish
  app.put('/admin/orders/:id/status', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { status, note } = z.object({
      status: z.enum([
        'pending', 'processing', 'ready_for_pickup',
        'courier_assigned', 'courier_picked_up', 'shipping',
        'at_pickup_point', 'delivered', 'cancelled',
      ]),
      note: z.string().optional(),
    }).parse(request.body);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('Buyurtma');

    // Admin har qanday statusga o'zgartira oladi (veto power)
    const timestampField: Record<string, string> = {
      ready_for_pickup: 'readyAt',
      courier_picked_up: 'pickedUpAt',
      shipping: 'shippingAt',
      delivered: 'deliveredAt',
      cancelled: 'cancelledAt',
    };

    const updateData: any = { status };
    if (timestampField[status]) {
      updateData[timestampField[status]] = new Date();
    }
    if (status === 'cancelled' && note) {
      updateData.cancelReason = note;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        note: note || `Admin tomonidan o'zgartirildi`,
        changedBy: request.user!.userId,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: `order.status_${status}`,
        entityType: 'order',
        entityId: id,
        details: { from: order.status, to: status, note },
        ipAddress: request.ip,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'system',
        title: '📦 Buyurtma statusi yangilandi',
        body: `Buyurtma #${order.orderNumber} statusi: ${status}`,
        data: { orderId: id },
      },
    });

    return { success: true, data: updatedOrder };
  });

  // ==========================================
  // CATEGORIES — 3-level self-referencing tree
  // ==========================================
  app.get('/admin/categories', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { parentId, level, tree } = request.query as { parentId?: string; level?: string; tree?: string };

    // Agar tree=true bo'lsa, to'liq 3 darajali daraxt
    if (tree === 'true') {
      const categories = await prisma.category.findMany({
        where: { level: 0 },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            orderBy: { sortOrder: 'asc' },
            include: {
              children: { orderBy: { sortOrder: 'asc' }, include: { _count: { select: { products: true } } } },
              _count: { select: { products: true } },
            },
          },
          _count: { select: { products: true } },
        },
      });
      return { success: true, data: categories };
    }

    // Agar parentId berilgan bo'lsa, shu kategoriyaning bolalarini qaytarish
    if (parentId) {
      const categories = await prisma.category.findMany({
        where: { parentId },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { products: true } },
        },
      });
      return { success: true, data: categories };
    }

    // Default: faqat L0 kategoriyalar bilan L1 bolalari
    const lvl = level !== undefined ? parseInt(level, 10) : 0;
    const categories = await prisma.category.findMany({
      where: { level: lvl },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
    });
    return { success: true, data: categories };
  });

  app.post('/admin/categories', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const data = z.object({
      parentId: z.string().uuid().optional(),
      nameUz: z.string().min(1),
      nameRu: z.string().min(1),
      slug: z.string().optional(),
      icon: z.string().optional(),
      imageUrl: z.string().optional(),
      level: z.number().int().min(0).max(2).optional(),
      sortOrder: z.number().optional(),
    }).parse(request.body);

    // Auto-calculate level from parent
    let level = data.level ?? 0;
    if (data.parentId && data.level === undefined) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId }, select: { level: true } });
      if (parent) level = parent.level + 1;
    }

    // Auto-generate slug
    const slug = data.slug || data.nameUz.toLowerCase()
      .replace(/['\u2018\u2019\u02BC`]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const category = await prisma.category.create({
      data: {
        nameUz: data.nameUz,
        nameRu: data.nameRu,
        slug,
        icon: data.icon,
        imageUrl: data.imageUrl,
        level,
        sortOrder: data.sortOrder ?? 0,
        ...(data.parentId && { parent: { connect: { id: data.parentId } } }),
      } as any,
    });
    await cacheDelete(CacheKeys.CATEGORIES_ALL);
    return { success: true, data: category };
  });

  app.put('/admin/categories/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = z.object({
      nameUz: z.string().min(1).optional(),
      nameRu: z.string().min(1).optional(),
      slug: z.string().optional(),
      icon: z.string().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }).parse(request.body);

    const category = await prisma.category.update({ where: { id }, data });
    await cacheDelete(CacheKeys.CATEGORIES_ALL);
    return { success: true, data: category };
  });

  app.delete('/admin/categories/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    // Check products in this category OR descendant categories
    const descendants = await prisma.category.findMany({
      where: { OR: [{ id }, { parentId: id }, { parent: { parentId: id } }] },
      select: { id: true },
    });
    const catIds = descendants.map(d => d.id);

    const productCount = await prisma.product.count({ where: { categoryId: { in: catIds } } });
    if (productCount > 0) {
      throw new AppError(`Bu kategoriya va bolalarida ${productCount} ta mahsulot bor. Avval mahsulotlarni ko'chiring.`, 400);
    }

    // Cascade delete handles children
    await prisma.category.delete({ where: { id } });
    await cacheDelete(CacheKeys.CATEGORIES_ALL);
    return { success: true, message: 'Kategoriya o\'chirildi' };
  });

  // ==========================================
  // BRANDS
  // ==========================================
  app.get('/admin/brands', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async () => {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return { success: true, data: brands };
  });

  app.post('/admin/brands', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const data = z.object({
      name: z.string().min(1),
      logoUrl: z.string().optional(),
    }).parse(request.body);
    const brand = await prisma.brand.create({ data: data as any });
    await cacheDelete(CacheKeys.BRANDS_ALL);
    return { success: true, data: brand };
  });

  app.put('/admin/brands/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = z.object({
      name: z.string().min(1).optional(),
      logoUrl: z.string().optional(),
    }).parse(request.body);
    const brand = await prisma.brand.update({ where: { id }, data });
    await cacheDelete(CacheKeys.BRANDS_ALL);
    return { success: true, data: brand };
  });

  app.delete('/admin/brands/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    // Tegishli mahsulotlar borligini tekshirish
    const productCount = await prisma.product.count({ where: { brandId: id } });
    if (productCount > 0) {
      throw new AppError(`Bu brendda ${productCount} ta mahsulot bor. Avval mahsulotlarni ko'chiring.`, 400);
    }

    await prisma.brand.delete({ where: { id } });
    await cacheDelete(CacheKeys.BRANDS_ALL);
    return { success: true, message: 'Brend o\'chirildi' };
  });

  // ==========================================
  // PROMO CODES
  // ==========================================
  app.get('/admin/promo-codes', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const search = query.search as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.promoCode.count({ where }),
    ]);

    return { success: true, data: { items: promoCodes, pagination: paginationMeta(page, limit, total) } };
  });

  app.post('/admin/promo-codes', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const data = z.object({
      code: z.string().min(3).toUpperCase(),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.number().positive(),
      minOrderAmount: z.number().optional(),
      maxUses: z.number().optional(),
      expiresAt: z.string().datetime().optional(),
    }).parse(request.body);

    const promo = await prisma.promoCode.create({
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      } as any,
    });

    return { success: true, data: promo };
  });

  app.put('/admin/promo-codes/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = z.object({
      code: z.string().optional(),
      discountType: z.enum(['percentage', 'fixed']).optional(),
      discountValue: z.number().positive().optional(),
      minOrderAmount: z.number().optional(),
      maxUses: z.number().optional(),
      expiresAt: z.string().datetime().optional(),
      isActive: z.boolean().optional(),
    }).parse(request.body);

    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });

    return { success: true, data: promo };
  });

  app.delete('/admin/promo-codes/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.promoCode.delete({ where: { id } });
    return { success: true, message: 'Promo kod o\'chirildi' };
  });

  // ==========================================
  // DELIVERY ZONES
  // ==========================================
  app.get('/admin/delivery-zones', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async () => {
    const zones = await prisma.deliveryZone.findMany({ orderBy: { name: 'asc' } });
    return { success: true, data: zones };
  });

  app.post('/admin/delivery-zones', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const data = z.object({
      name: z.string().min(1),
      polygon: z.any(),
      deliveryFee: z.number().min(0),
      minOrder: z.number().optional(),
    }).parse(request.body);

    const zone = await prisma.deliveryZone.create({ data: data as any });
    return { success: true, data: zone };
  });

  app.put('/admin/delivery-zones/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = z.object({
      name: z.string().optional(),
      polygon: z.any().optional(),
      deliveryFee: z.number().optional(),
      minOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }).parse(request.body);

    const zone = await prisma.deliveryZone.update({ where: { id }, data });
    return { success: true, data: zone };
  });

  app.delete('/admin/delivery-zones/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.deliveryZone.delete({ where: { id } });
    return { success: true, message: 'Yetkazish zonasi o\'chirildi' };
  });

  // ==========================================
  // BANNERS (extended)
  // ==========================================
  app.get('/admin/banners', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async () => {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
    return { success: true, data: banners };
  });

  app.post('/admin/banners', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const data = z.object({
      imageUrl: z.string(),
      titleUz: z.string().optional(),
      titleRu: z.string().optional(),
      subtitleUz: z.string().optional(),
      subtitleRu: z.string().optional(),
      actionType: z.enum(['none', 'link', 'product', 'category']).optional(),
      actionValue: z.string().optional(),
      sortOrder: z.number().optional(),
    }).parse(request.body);

    const banner = await prisma.banner.create({ data: data as any });
    await cacheDelete('banners:active');
    return { success: true, data: banner };
  });

  app.put('/admin/banners/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = z.object({
      imageUrl: z.string().optional(),
      titleUz: z.string().optional(),
      titleRu: z.string().optional(),
      subtitleUz: z.string().optional(),
      subtitleRu: z.string().optional(),
      actionType: z.enum(['none', 'link', 'product', 'category']).optional(),
      actionValue: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }).parse(request.body);

    const banner = await prisma.banner.update({ where: { id }, data });
    await cacheDelete('banners:active');
    return { success: true, data: banner };
  });

  app.delete('/admin/banners/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.banner.delete({ where: { id } });
    await cacheDelete('banners:active');
    return { success: true, message: 'Banner o\'chirildi' };
  });

  // ==========================================
  // PAYOUTS
  // ==========================================
  app.get('/admin/payouts', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as string | undefined;

    const where: any = {};
    if (status) where.status = status;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { shop: { select: { name: true, balance: true } } },
      }),
      prisma.payout.count({ where }),
    ]);

    return { success: true, data: { items: payouts, pagination: paginationMeta(page, limit, total) } };
  });

  app.put('/admin/payouts/:id/process', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { status } = z.object({
      status: z.enum(['completed', 'failed']),
    }).parse(request.body);

    const payout = await prisma.payout.update({
      where: { id },
      data: {
        status,
        processedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: `payout.${status}`,
        entityType: 'payout',
        entityId: id,
        ipAddress: request.ip,
      },
    });

    return { success: true, data: payout };
  });

  // ==========================================
  // NOTIFICATIONS (Full CRUD + broadcast)
  // ==========================================

  // GET /admin/notifications — bildirishnomalar ro'yxati
  app.get('/admin/notifications', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const type = query.type as string | undefined;

    const where: any = { userId: request.user!.userId };
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, phone: true } } },
      }),
      prisma.notification.count({ where }),
    ]);

    return { success: true, data: { items: notifications, pagination: paginationMeta(page, limit, total) } };
  });

  // POST /admin/notifications — bildirishnoma yaratish (draft)
  app.post('/admin/notifications', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { title, body, targetRole, imageUrl, linkUrl } = z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      targetRole: z.enum(['user', 'vendor', 'courier', 'all']).default('all'),
      imageUrl: z.string().optional(),
      linkUrl: z.string().optional(),
    }).parse(request.body);

    // Admin o'ziga draft sifatida saqlash
    const notification = await prisma.notification.create({
      data: {
        userId: request.user!.userId,
        type: 'system',
        title,
        body,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        data: { targetRole, isDraft: true, sentCount: 0 },
      },
    });

    return { success: true, data: notification };
  });

  // POST /admin/notifications/:id/send — bildirishnomani yuborish
  app.post('/admin/notifications/:id/send', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundError('Bildirishnoma');

    const data = notification.data as any;
    const targetRole = data?.targetRole || 'all';

    const where: any = {};
    if (targetRole !== 'all') where.role = targetRole;

    const users = await prisma.profile.findMany({
      where,
      select: { id: true },
    });

    // Har bir foydalanuvchi uchun bildirishnoma yozuvi yaratish
    const userIds = users.map(u => u.id).filter(uid => uid !== request.user!.userId);
    if (userIds.length > 0) {
      await prisma.notification.createMany({
        data: userIds.map(uid => ({
          userId: uid,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl || null,
          linkUrl: notification.linkUrl || null,
          data: { parentId: id, type: 'admin_notification' },
        })),
      });
    }

    // Push notification yuborish — BullMQ orqali (non-blocking)
    try {
      const devices = await prisma.userDevice.findMany({
        where: {
          userId: { in: users.map(u => u.id) },
          isActive: true,
        },
        select: { fcmToken: true },
      });
      const tokens = devices.map(d => d.fcmToken).filter(Boolean);
      if (tokens.length > 0) {
        const pushData: Record<string, string> = {
          type: 'admin_notification',
          notificationId: id,
        };
        if (notification.imageUrl) pushData.imageUrl = notification.imageUrl;
        if (notification.linkUrl) pushData.linkUrl = notification.linkUrl;
        const { enqueueNotification } = await import('../../services/queue.service.js');
        await enqueueNotification({
          type: 'push_multicast',
          tokens,
          title: notification.title,
          body: notification.body,
          data: pushData,
        });
      }
    } catch (pushErr) {
      request.log.error({ err: pushErr }, 'Push notification yuborishda xatolik');
    }

    // Draft ni sent deb belgilash
    await prisma.notification.update({
      where: { id },
      data: { data: { ...data, isDraft: false, sentCount: users.length, sentAt: new Date().toISOString() } },
    });

    return {
      success: true,
      message: `${users.length} ta foydalanuvchiga bildirishnoma yuborildi`,
    };
  });

  // DELETE /admin/notifications/:id — bildirishnomani o'chirish
  app.delete('/admin/notifications/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.notification.delete({ where: { id } });
    return { success: true, message: 'Bildirishnoma o\'chirildi' };
  });

  // POST /admin/notifications/broadcast — to'g'ridan-to'g'ri broadcast
  app.post('/admin/notifications/broadcast', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { title, body, targetRole, imageUrl, linkUrl } = z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      targetRole: z.enum(['user', 'vendor', 'courier', 'all']).default('all'),
      imageUrl: z.string().optional(),
      linkUrl: z.string().optional(),
    }).parse(request.body);

    const where: any = {};
    if (targetRole !== 'all') where.role = targetRole;

    const users = await prisma.profile.findMany({
      where,
      select: { id: true },
    });

    // DB ga admin uchun asosiy yozuv
    const notification = await prisma.notification.create({
      data: {
        userId: request.user!.userId,
        type: 'system',
        title,
        body,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        data: { targetRole, isBroadcast: true, sentCount: users.length, sentAt: new Date().toISOString() },
      },
    });

    // Har bir foydalanuvchi uchun bildirishnoma yozuvi yaratish
    const userIds = users.map(u => u.id).filter(uid => uid !== request.user!.userId);
    if (userIds.length > 0) {
      await prisma.notification.createMany({
        data: userIds.map(uid => ({
          userId: uid,
          type: 'system' as const,
          title,
          body,
          imageUrl: imageUrl || null,
          linkUrl: linkUrl || null,
          data: { parentId: notification.id, type: 'admin_broadcast' },
        })),
      });
    }

    // Push notification yuborish — BullMQ orqali (non-blocking)
    let pushSentCount = 0;
    try {
      const devices = await prisma.userDevice.findMany({
        where: {
          userId: { in: users.map(u => u.id) },
          isActive: true,
        },
        select: { fcmToken: true },
      });
      const tokens = devices.map(d => d.fcmToken).filter(Boolean);
      pushSentCount = tokens.length;
      if (tokens.length > 0) {
        const pushData: Record<string, string> = {
          type: 'admin_broadcast',
          targetRole,
        };
        if (imageUrl) pushData.imageUrl = imageUrl;
        if (linkUrl) pushData.linkUrl = linkUrl;
        const { enqueueNotification } = await import('../../services/queue.service.js');
        await enqueueNotification({
          type: 'push_multicast',
          tokens,
          title,
          body,
          data: pushData,
        });
      }
    } catch (pushErr) {
      request.log.error({ err: pushErr }, 'Push notification yuborishda xatolik');
    }

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'notification.broadcast',
        entityType: 'notification',
        details: { title, targetRole, sentCount: users.length, pushSentCount },
        ipAddress: request.ip,
      },
    });

    return {
      success: true,
      message: `${users.length} ta foydalanuvchiga bildirishnoma yuborildi (${pushSentCount} push)`,
    };
  });

  // ==========================================
  // REPORTS
  // ==========================================
  app.get('/admin/reports', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';

    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate.setFullYear(startDate.getFullYear() - 1);

    const [
      orderStats,
      revenueByShopRaw,
      topProducts,
      newUsers,
      newShops,
      totalUsers,
    ] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: startDate } },
      }),
      prisma.vendorTransaction.groupBy({
        by: ['shopId'],
        _sum: { amount: true, commission: true, netAmount: true },
        _count: true,
        where: { createdAt: { gte: startDate } },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),
      prisma.product.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { salesCount: 'desc' },
        take: 10,
        select: {
          id: true, nameUz: true, price: true, salesCount: true,
          shop: { select: { name: true } },
        },
      }),
      prisma.profile.count({ where: { role: 'user', createdAt: { gte: startDate } } }),
      prisma.shop.count({ where: { createdAt: { gte: startDate } } }),
      prisma.profile.count({ where: { role: 'user' } }),
    ]);

    // Enrich revenueByShop with shop names
    const shopIds = revenueByShopRaw.map((r: any) => r.shopId).filter(Boolean);
    const shops = shopIds.length > 0
      ? await prisma.shop.findMany({
          where: { id: { in: shopIds } },
          select: { id: true, name: true },
        })
      : [];
    const shopNameMap = new Map(shops.map((s: any) => [s.id, s.name]));

    const revenueByShop = revenueByShopRaw.map((r: any) => ({
      shopId: r.shopId,
      shopName: shopNameMap.get(r.shopId) || '-',
      amount: r._sum?.amount || 0,
      commission: r._sum?.commission || 0,
      netAmount: r._sum?.netAmount || 0,
      orderCount: r._count || 0,
    }));

    return {
      success: true,
      data: {
        period,
        orderStats,
        revenueByShop,
        topProducts: topProducts.map((p: any) => ({
          id: p.id,
          nameUz: p.nameUz,
          price: p.price,
          salesCount: p.salesCount,
          shopName: p.shop?.name || '-',
          revenue: Number(p.price || 0) * Number(p.salesCount || 0),
        })),
        newUsers,
        newShops,
        totalUsers,
      },
    };
  });

  // ==========================================
  // CHAT (Admin monitoring)
  // ==========================================

  // GET /admin/chats — barcha chat roomlarni ko'rish
  app.get('/admin/chats', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const search = query.search as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
        { shop: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [rooms, total] = await Promise.all([
      prisma.chatRoom.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          customer: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
          shop: { select: { id: true, name: true, logoUrl: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { message: true, senderRole: true, createdAt: true, isRead: true },
          },
          _count: { select: { messages: { where: { isRead: false } } } },
        },
      }),
      prisma.chatRoom.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: rooms.map(r => ({
          id: r.id,
          status: r.status,
          lastMessageAt: r.lastMessageAt,
          createdAt: r.createdAt,
          customer: r.customer,
          shop: r.shop,
          lastMessage: r.messages[0] || null,
          unreadCount: r._count.messages,
        })),
        pagination: paginationMeta(page, limit, total),
      },
    };
  });

  // GET /admin/chats/:id/messages — chat xabarlarini ko'rish
  app.get('/admin/chats/:id/messages', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);

    const room = await prisma.chatRoom.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, avatarUrl: true } },
        shop: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    if (!room) {
      return { success: false, message: 'Chat topilmadi' };
    }

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { roomId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.chatMessage.count({ where: { roomId: id } }),
    ]);

    return {
      success: true,
      data: {
        room,
        items: messages.reverse(),
        pagination: paginationMeta(page, limit, total),
      },
    };
  });

  // ==========================================
  // LOGS (Activity)
  // ==========================================
  app.get('/admin/logs', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const action = query.action as string | undefined;
    const entityType = query.entityType as string | undefined;
    const search = query.search as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
      ];
    } else {
      if (action) where.action = { contains: action };
      if (entityType) where.entityType = entityType;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { success: true, data: { items: logs, pagination: paginationMeta(page, limit, total) } };
  });

  // DELETE /admin/logs/clear — eski loglarni tozalash
  app.delete('/admin/logs/clear', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const days = parseInt(query.days as string) || 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'logs.clear',
        entityType: 'system',
        details: { deletedCount: result.count, olderThanDays: days },
        ipAddress: request.ip,
      },
    });

    return { success: true, message: `${result.count} ta log o'chirildi (${days} kundan eski)` };
  });

  // ==========================================
  // SETTINGS
  // ==========================================
  app.get('/admin/settings', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async () => {
    const settings = await prisma.adminSetting.findMany();
    // Convert to key-value map
    const map: Record<string, any> = {};
    for (const s of settings) {
      if (s.type === 'number') map[s.key] = parseFloat(s.value);
      else if (s.type === 'boolean') map[s.key] = s.value === 'true';
      else if (s.type === 'json') map[s.key] = JSON.parse(s.value);
      else map[s.key] = s.value;
    }
    return { success: true, data: map };
  });

  app.put('/admin/settings', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('settings.manage')],
  }, async (request) => {
    // Validate that body is an object
    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      throw new AppError('Sozlamalar object formatida bo\'lishi kerak', 400);
    }
    const settings = request.body as Record<string, any>;

    for (const [key, value] of Object.entries(settings)) {
      const type = typeof value === 'number' ? 'number'
        : typeof value === 'boolean' ? 'boolean'
        : typeof value === 'object' ? 'json'
        : 'string';

      await prisma.adminSetting.upsert({
        where: { key },
        create: { key, value: String(value), type },
        update: { value: String(value), type },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'settings.update',
        entityType: 'settings',
        details: settings,
        ipAddress: request.ip,
      },
    });

    return { success: true, message: 'Sozlamalar yangilandi' };
  });

  // ==========================================
  // ANALYTICS — Time-series & breakdown data
  // ==========================================

  // Revenue time-series
  app.get('/admin/analytics/revenue', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const compare = query.compare === 'true';

    const { startDate, prevStartDate, prevEndDate, groupFormat } = getAnalyticsDates(period);

    // Validate groupFormat to prevent SQL injection
    const revenueAllowedFormats: Record<string, string> = {
      'YYYY-MM-DD': 'YYYY-MM-DD',
      'YYYY-MM-DD HH24:00': 'YYYY-MM-DD HH24:00',
      'YYYY-MM': 'YYYY-MM',
      'IYYY-IW': 'IYYY-IW',
    };
    const safeRevGroupFormat = revenueAllowedFormats[groupFormat] || 'YYYY-MM-DD';

    // Current period revenue by date
    const currentRevenue = await prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>(
      Prisma.sql`SELECT TO_CHAR(created_at, ${safeRevGroupFormat}) as date,
              COALESCE(SUM(total::numeric), 0) as revenue,
              COUNT(*)::int as orders
       FROM orders
       WHERE created_at >= ${startDate} AND payment_status = 'paid'
       GROUP BY date ORDER BY date`
    );

    let previousRevenue: Array<{ date: string; revenue: number; orders: number }> = [];
    if (compare) {
      previousRevenue = await prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>(
        Prisma.sql`SELECT TO_CHAR(created_at, ${safeRevGroupFormat}) as date,
                COALESCE(SUM(total::numeric), 0) as revenue,
                COUNT(*)::int as orders
         FROM orders
         WHERE created_at >= ${prevStartDate} AND created_at < ${prevEndDate} AND payment_status = 'paid'
         GROUP BY date ORDER BY date`
      );
    }

    // Summary
    const totalRevenue = currentRevenue.reduce((s, r) => s + Number(r.revenue), 0);
    const totalOrders = currentRevenue.reduce((s, r) => s + Number(r.orders), 0);
    const prevTotal = previousRevenue.reduce((s, r) => s + Number(r.revenue), 0);
    const growthPercent = prevTotal > 0 ? ((totalRevenue - prevTotal) / prevTotal * 100) : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      success: true,
      data: {
        current: currentRevenue.map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) })),
        previous: previousRevenue.map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) })),
        summary: { totalRevenue, totalOrders, growthPercent: Math.round(growthPercent * 100) / 100, avgOrderValue: Math.round(avgOrderValue) },
      },
    };
  });

  // Orders time-series with status breakdown
  app.get('/admin/analytics/orders', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const { startDate, groupFormat } = getAnalyticsDates(period);

    // Validate groupFormat to prevent SQL injection
    const allowedFormats: Record<string, string> = {
      'YYYY-MM-DD': 'YYYY-MM-DD',
      'YYYY-MM-DD HH24:00': 'YYYY-MM-DD HH24:00',
      'YYYY-MM': 'YYYY-MM',
      'IYYY-IW': 'IYYY-IW',
    };
    const safeGroupFormat = allowedFormats[groupFormat] || 'YYYY-MM-DD';

    const ordersByDate = await prisma.$queryRaw<Array<{ date: string; count: number }>>(
      Prisma.sql`SELECT TO_CHAR(created_at, ${safeGroupFormat}) as date, COUNT(*)::int as count
       FROM orders WHERE created_at >= ${startDate}
       GROUP BY date ORDER BY date`
    );

    const statusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
      where: { createdAt: { gte: startDate } },
    });

    const paymentBreakdown = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: true,
      _sum: { total: true },
      where: { createdAt: { gte: startDate } },
    });

    return {
      success: true,
      data: {
        timeSeries: ordersByDate.map(o => ({ date: o.date, count: Number(o.count) })),
        statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: s._count })),
        paymentBreakdown: paymentBreakdown.map(p => ({
          method: p.paymentMethod,
          count: p._count,
          total: Number(p._sum.total || 0),
        })),
      },
    };
  });

  // New users time-series
  app.get('/admin/analytics/users', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const compare = query.compare === 'true';
    const { startDate, prevStartDate, prevEndDate, groupFormat } = getAnalyticsDates(period);

    const usersAllowedFormats: Record<string, string> = {
      'YYYY-MM-DD': 'YYYY-MM-DD',
      'YYYY-MM-DD HH24:00': 'YYYY-MM-DD HH24:00',
      'YYYY-MM': 'YYYY-MM',
      'IYYY-IW': 'IYYY-IW',
    };
    const safeUserGroupFormat = usersAllowedFormats[groupFormat] || 'YYYY-MM-DD';

    const currentUsers = await prisma.$queryRaw<Array<{ date: string; count: number }>>(
      Prisma.sql`SELECT TO_CHAR(created_at, ${safeUserGroupFormat}) as date, COUNT(*)::int as count
       FROM profiles WHERE created_at >= ${startDate} AND role = 'user'
       GROUP BY date ORDER BY date`
    );

    let previousUsers: Array<{ date: string; count: number }> = [];
    if (compare) {
      previousUsers = await prisma.$queryRaw<Array<{ date: string; count: number }>>(
        Prisma.sql`SELECT TO_CHAR(created_at, ${safeUserGroupFormat}) as date, COUNT(*)::int as count
         FROM profiles WHERE created_at >= ${prevStartDate} AND created_at < ${prevEndDate} AND role = 'user'
         GROUP BY date ORDER BY date`
      );
    }

    const totalNew = currentUsers.reduce((s, u) => s + Number(u.count), 0);
    const prevNew = previousUsers.reduce((s, u) => s + Number(u.count), 0);
    const growthPercent = prevNew > 0 ? ((totalNew - prevNew) / prevNew * 100) : 0;

    return {
      success: true,
      data: {
        current: currentUsers.map(u => ({ date: u.date, count: Number(u.count) })),
        previous: previousUsers.map(u => ({ date: u.date, count: Number(u.count) })),
        summary: { totalNew, growthPercent: Math.round(growthPercent * 100) / 100 },
      },
    };
  });

  // Category sales breakdown
  app.get('/admin/analytics/categories', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const { startDate } = getAnalyticsDates(period);

    const categorySales = await prisma.$queryRaw<Array<{ category_id: string; name: string; count: number; revenue: number }>>(
      Prisma.sql`SELECT c.id as category_id, c.name_uz as name,
              COUNT(oi.id)::int as count,
              COALESCE(SUM(oi.price * oi.quantity), 0)::numeric as revenue
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN categories c ON c.id = p.category_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= ${startDate} AND o.payment_status = 'paid'
       GROUP BY c.id, c.name_uz
       ORDER BY revenue DESC
       LIMIT 10`
    );

    return {
      success: true,
      data: categorySales.map(c => ({
        id: c.category_id,
        name: c.name,
        count: Number(c.count),
        revenue: Number(c.revenue),
      })),
    };
  });

  // Region statistics
  app.get('/admin/analytics/regions', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const { startDate } = getAnalyticsDates(period);

    // Get orders with address coordinates, then map to regions
    const regionData = await prisma.$queryRaw<Array<{ region: string; count: number; revenue: number }>>(
      Prisma.sql`SELECT
         CASE
           WHEN a.latitude BETWEEN 41.2 AND 41.4 AND a.longitude BETWEEN 69.1 AND 69.4 THEN 'tashkent_city'
           WHEN a.latitude BETWEEN 40.8 AND 41.6 AND a.longitude BETWEEN 68.6 AND 70.2 THEN 'tashkent'
           WHEN a.latitude BETWEEN 39.5 AND 40.5 AND a.longitude BETWEEN 66.0 AND 68.0 THEN 'samarkand'
           WHEN a.latitude BETWEEN 40.8 AND 41.8 AND a.longitude BETWEEN 60.0 AND 62.0 THEN 'khorezm'
           WHEN a.latitude BETWEEN 39.5 AND 40.2 AND a.longitude BETWEEN 64.0 AND 66.5 THEN 'bukhara'
           WHEN a.latitude BETWEEN 40.5 AND 41.5 AND a.longitude BETWEEN 64.5 AND 66.5 THEN 'navoiy'
           WHEN a.latitude BETWEEN 40.0 AND 41.0 AND a.longitude BETWEEN 70.0 AND 72.0 THEN 'fergana'
           WHEN a.latitude BETWEEN 40.5 AND 41.5 AND a.longitude BETWEEN 70.5 AND 72.5 THEN 'namangan'
           WHEN a.latitude BETWEEN 40.5 AND 41.5 AND a.longitude BETWEEN 69.5 AND 71.5 THEN 'andijon'
           WHEN a.latitude BETWEEN 38.5 AND 39.5 AND a.longitude BETWEEN 65.5 AND 67.5 THEN 'qashqadaryo'
           WHEN a.latitude BETWEEN 37.5 AND 39.0 AND a.longitude BETWEEN 66.0 AND 68.0 THEN 'surxondaryo'
           WHEN a.latitude BETWEEN 39.5 AND 41.0 AND a.longitude BETWEEN 68.0 AND 70.5 THEN 'jizzax'
           WHEN a.latitude BETWEEN 40.0 AND 42.0 AND a.longitude BETWEEN 67.0 AND 69.0 THEN 'sirdaryo'
           WHEN a.latitude BETWEEN 41.5 AND 46.0 AND a.longitude BETWEEN 56.0 AND 62.0 THEN 'karakalpakstan'
           ELSE 'other'
         END as region,
         COUNT(o.id)::int as count,
         COALESCE(SUM(o.total::numeric), 0) as revenue
       FROM orders o
       JOIN addresses a ON a.id = o.address_id
       WHERE o.created_at >= ${startDate} AND a.latitude IS NOT NULL
       GROUP BY region
       ORDER BY revenue DESC`
    );

    return {
      success: true,
      data: regionData.map(r => ({
        region: r.region,
        count: Number(r.count),
        revenue: Number(r.revenue),
      })),
    };
  });

  // ==========================================
  // COURIERS (existing, moved here for completeness)
  // ==========================================
  app.get('/admin/couriers', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as string | undefined;

    const where: any = {};
    if (status) where.status = status;

    const [couriers, total] = await Promise.all([
      prisma.courier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: { select: { fullName: true, phone: true, avatarUrl: true } },
        },
      }),
      prisma.courier.count({ where }),
    ]);

    return { success: true, data: { items: couriers, pagination: paginationMeta(page, limit, total) } };
  });

  // ==========================================
  // COLORS (admin CRUD)
  // ==========================================
  app.get('/admin/colors', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async () => {
    const colors = await prisma.color.findMany({
      orderBy: { nameUz: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return { success: true, data: colors };
  });

  app.post('/admin/colors', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const data = z.object({
      nameUz: z.string().min(1),
      nameRu: z.string().min(1),
      hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Noto\'g\'ri rang formati (#RRGGBB)'),
    }).parse(request.body);

    const color = await prisma.color.create({ data });
    return { success: true, data: color };
  });

  app.put('/admin/colors/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = z.object({
      nameUz: z.string().min(1).optional(),
      nameRu: z.string().min(1).optional(),
      hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Noto\'g\'ri rang formati').optional(),
    }).parse(request.body);

    const color = await prisma.color.update({ where: { id }, data });
    return { success: true, data: color };
  });

  app.delete('/admin/colors/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    // Mahsulotlarga bog'langan bo'lsa xato
    const productCount = await prisma.product.count({ where: { colorId: id } });
    if (productCount > 0) {
      throw new AppError(`Bu rang ${productCount} ta mahsulotda ishlatilmoqda. Avval rangni almashtirib o'chirishingiz kerak.`, 400);
    }
    await prisma.color.delete({ where: { id } });
    return { success: true, message: 'Rang o\'chirildi' };
  });

  // ============================================
  // Meilisearch: Bulk Re-index
  // ============================================

  /**
   * POST /admin/search/reindex
   * Barcha aktiv mahsulotlarni Meilisearch'ga qayta indekslash
   */
  app.post('/admin/search/reindex', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    // Re-initialize Meilisearch settings
    await initMeilisearch();

    // Clear existing index
    await clearIndex();

    // Enqueue bulk reindex via BullMQ (non-blocking)
    const { enqueueSearchIndex } = await import('../../services/queue.service.js');
    await enqueueSearchIndex({ type: 'bulk_reindex' });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'search.reindex',
        entityType: 'system',
        entityId: 'meilisearch',
        details: { message: 'Bulk reindex queued via BullMQ' },
        ipAddress: request.ip,
      },
    });

    return reply.send({
      success: true,
      data: { message: 'Re-index jarayoni BullMQ orqali boshlandi. Bir necha daqiqada tugaydi.' },
    });
  });

  // ============================================
  // LUCKY WHEEL ADMIN
  // ============================================

  /**
   * GET /admin/lucky-wheel — barcha sovg'alar + statistika
   */
  app.get('/admin/lucky-wheel', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const prizes = await prisma.luckyWheelPrize.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSpins, todaySpins, totalWinners] = await Promise.all([
      prisma.luckyWheelSpin.count(),
      prisma.luckyWheelSpin.count({ where: { spinDate: today } }),
      prisma.luckyWheelSpin.count({ where: { prizeType: { not: 'nothing' } } }),
    ]);

    return reply.send({
      success: true,
      data: {
        prizes,
        stats: {
          totalSpins,
          todaySpins,
          totalWinners,
          totalPrizes: prizes.length,
          activePrizes: prizes.filter(p => p.isActive).length,
        },
      },
    });
  });

  /**
   * POST /admin/lucky-wheel — yangi sovg'a
   */
  app.post('/admin/lucky-wheel', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const schema = z.object({
      nameUz: z.string().min(1),
      nameRu: z.string().min(1),
      type: z.enum(['discount_percent', 'discount_fixed', 'free_delivery', 'physical_gift', 'nothing']),
      value: z.number().nullable().optional(),
      probability: z.number().min(0).max(1),
      color: z.string().default('#FF6B35'),
      imageUrl: z.string().nullable().optional(),
      promoCodePrefix: z.string().nullable().optional(),
      stock: z.number().int().nullable().optional(),
      sortOrder: z.number().int().default(0),
      isActive: z.boolean().default(true),
    });

    const data = schema.parse(request.body);

    const prize = await prisma.luckyWheelPrize.create({
      data: {
        nameUz: data.nameUz,
        nameRu: data.nameRu,
        type: data.type,
        value: data.value ?? null,
        probability: data.probability,
        color: data.color,
        imageUrl: data.imageUrl ?? null,
        promoCodePrefix: data.promoCodePrefix ?? null,
        stock: data.stock ?? null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    return reply.status(201).send({
      success: true,
      data: prize,
    });
  });

  /**
   * PUT /admin/lucky-wheel/:id — sovg'ani tahrirlash
   */
  app.put('/admin/lucky-wheel/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const schema = z.object({
      nameUz: z.string().min(1).optional(),
      nameRu: z.string().min(1).optional(),
      type: z.enum(['discount_percent', 'discount_fixed', 'free_delivery', 'physical_gift', 'nothing']).optional(),
      value: z.number().nullable().optional(),
      probability: z.number().min(0).max(1).optional(),
      color: z.string().optional(),
      imageUrl: z.string().nullable().optional(),
      promoCodePrefix: z.string().nullable().optional(),
      stock: z.number().int().nullable().optional(),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    });

    const data = schema.parse(request.body);

    const prize = await prisma.luckyWheelPrize.update({
      where: { id },
      data,
    });

    return reply.send({
      success: true,
      data: prize,
    });
  });

  /**
   * DELETE /admin/lucky-wheel/:id — sovg'a o'chirish
   */
  app.delete('/admin/lucky-wheel/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    await prisma.luckyWheelPrize.delete({ where: { id } });

    return reply.send({ success: true });
  });

  /**
   * GET /admin/lucky-wheel/spins — barcha spinlar tarixi
   */
  app.get('/admin/lucky-wheel/spins', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const querySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    });
    const { page, limit } = querySchema.parse(request.query);
    const skip = (page - 1) * limit;

    const [spins, total] = await Promise.all([
      prisma.luckyWheelSpin.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, fullName: true, phone: true, avatarUrl: true },
          },
          prize: {
            select: { nameUz: true, nameRu: true, type: true, value: true, color: true },
          },
        },
      }),
      prisma.luckyWheelSpin.count(),
    ]);

    return reply.send({
      success: true,
      data: {
        spins,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  });

  // ============================================
  // REFERRAL ADMIN (Do'stlarni taklif qilish boshqaruvi)
  // ============================================

  /**
   * GET /admin/referrals — barcha referrallar + statistika
   */
  app.get('/admin/referrals', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const querySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    });
    const { page, limit } = querySchema.parse(request.query);
    const skip = (page - 1) * limit;

    const [referrals, total, totalPaid, totalBonusSum] = await Promise.all([
      prisma.referral.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          referrer: {
            select: { id: true, fullName: true, phone: true, avatarUrl: true },
          },
          referred: {
            select: { id: true, fullName: true, phone: true, avatarUrl: true },
          },
        },
      }),
      prisma.referral.count(),
      prisma.referral.count({ where: { referrerPaid: true } }),
      prisma.referral.aggregate({
        where: { referrerPaid: true },
        _sum: { bonusAmount: true },
      }),
    ]);

    // Bonus sozlamasini olish
    let bonusAmount = 50000;
    try {
      const setting = await prisma.adminSetting.findUnique({
        where: { key: 'referral_bonus_amount' },
      });
      if (setting) bonusAmount = parseFloat(setting.value) || 50000;
    } catch {}

    return reply.send({
      success: true,
      data: {
        referrals,
        stats: {
          totalReferrals: total,
          totalPaidBonuses: totalPaid,
          totalBonusAmount: totalBonusSum._sum.bonusAmount || 0,
          currentBonusAmount: bonusAmount,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  });

  /**
   * PUT /admin/referral-settings — bonus sozlamalarini o'zgartirish
   */
  app.put('/admin/referral-settings', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const settingsSchema = z.object({
      bonusAmount: z.number().min(0).max(10000000).optional(),
    });
    const body = settingsSchema.parse(request.body);

    if (body.bonusAmount !== undefined) {
      await prisma.adminSetting.upsert({
        where: { key: 'referral_bonus_amount' },
        update: { value: body.bonusAmount.toString() },
        create: { key: 'referral_bonus_amount', value: body.bonusAmount.toString() },
      });
    }

    return reply.send({
      success: true,
      message: 'Referral sozlamalari yangilandi',
    });
  });

  /**
   * PUT /admin/referrals/:id — referral holatini o'zgartirish
   */
  app.put('/admin/referrals/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const updateSchema = z.object({
      referrerPaid: z.boolean().optional(),
      referredPaid: z.boolean().optional(),
      bonusAmount: z.number().min(0).optional(),
    });
    const body = updateSchema.parse(request.body);

    const referral = await prisma.referral.update({
      where: { id },
      data: body,
    });

    return reply.send({
      success: true,
      data: referral,
    });
  });

  // ============================================
  // REFERRAL REWARDS (Sovg'alar katalogi boshqaruvi)
  // ============================================

  /**
   * GET /admin/referral-rewards — barcha sovg'alar
   */
  app.get('/admin/referral-rewards', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const rewards = await prisma.referralReward.findMany({
      orderBy: { pointsCost: 'asc' },
    });

    return reply.send({
      success: true,
      data: rewards,
    });
  });

  /**
   * POST /admin/referral-rewards — yangi sovg'a yaratish
   */
  app.post('/admin/referral-rewards', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const schema = z.object({
      nameUz: z.string().min(1),
      nameRu: z.string().min(1),
      description: z.string().optional().nullable(),
      pointsCost: z.number().int().min(1),
      type: z.enum(['promo_fixed', 'promo_percent', 'free_delivery', 'physical_gift']),
      value: z.number().optional(),
      imageUrl: z.string().optional(),
      stock: z.number().int().min(0).optional().nullable(),
      isActive: z.boolean().default(true),
    });
    const body = schema.parse(request.body);

    const reward = await prisma.referralReward.create({
      data: body as any,
    });

    return reply.status(201).send({
      success: true,
      data: reward,
    });
  });

  /**
   * PUT /admin/referral-rewards/:id — sovg'ani yangilash
   */
  app.put('/admin/referral-rewards/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const schema = z.object({
      nameUz: z.string().min(1).optional(),
      nameRu: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      pointsCost: z.number().int().min(1).optional(),
      type: z.enum(['promo_fixed', 'promo_percent', 'free_delivery', 'physical_gift']).optional(),
      value: z.number().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      stock: z.number().int().min(0).optional().nullable(),
      isActive: z.boolean().optional(),
    });
    const body = schema.parse(request.body);

    const reward = await prisma.referralReward.update({
      where: { id },
      data: body as any,
    });

    return reply.send({
      success: true,
      data: reward,
    });
  });

  /**
   * DELETE /admin/referral-rewards/:id — sovg'ani o'chirish
   */
  app.delete('/admin/referral-rewards/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    await prisma.referralReward.delete({ where: { id } });

    return reply.send({
      success: true,
      message: 'Sovg\'a o\'chirildi',
    });
  });

  // ============================================
  // REFERRAL CLAIMS (Sovg'a so'rovlari boshqaruvi)
  // ============================================

  /**
   * GET /admin/referral-claims — barcha so'rovlar
   */
  app.get('/admin/referral-claims', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const querySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(['pending', 'fulfilled', 'cancelled']).optional(),
    });
    const { page, limit, status } = querySchema.parse(request.query);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [claims, total] = await Promise.all([
      prisma.referralRewardClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          profile: {
            select: { id: true, fullName: true, phone: true, avatarUrl: true },
          },
          reward: {
            select: { id: true, nameUz: true, type: true, value: true, pointsCost: true },
          },
        },
      }),
      prisma.referralRewardClaim.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        claims,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  });

  /**
   * PUT /admin/referral-claims/:id — so'rov holatini o'zgartirish (tasdiqlash/rad)
   */
  app.put('/admin/referral-claims/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const schema = z.object({
      status: z.enum(['fulfilled', 'cancelled']),
      adminNote: z.string().optional(),
    });
    const body = schema.parse(request.body);

    const claim = await prisma.referralRewardClaim.findUnique({
      where: { id },
      include: { reward: true },
    });

    if (!claim) throw new AppError('So\'rov topilmadi');
    if (claim.status !== 'pending') throw new AppError('Faqat kutilayotgan so\'rovlarni o\'zgartirish mumkin');

    if (body.status === 'cancelled') {
      // Ballarni qaytarish
      await prisma.$transaction(async (tx) => {
        await tx.referralRewardClaim.update({
          where: { id },
          data: { status: 'cancelled' },
        });

        // Ballarni qaytarish
        await tx.profile.update({
          where: { id: claim.profileId },
          data: { referralPoints: { increment: claim.pointsSpent } },
        });

        // Stockni qaytarish
        if (claim.reward.stock !== null) {
          await tx.referralReward.update({
            where: { id: claim.rewardId },
            data: { stock: { increment: 1 } },
          });
        }

        // Ball log
        await tx.referralPointLog.create({
          data: {
            profileId: claim.profileId,
            amount: claim.pointsSpent,
            type: 'admin_adjustment',
            description: `Sovg'a so'rovi rad etildi, ballar qaytarildi: ${claim.reward.nameUz}`,
            claimId: claim.id,
          },
        });
      });
    } else {
      // Tasdiqlash
      await prisma.referralRewardClaim.update({
        where: { id },
        data: { status: 'fulfilled' },
      });
    }

    // Foydalanuvchiga bildirishnoma
    const { createNotification } = await import('../../modules/notifications/notification.service.js');
    const statusText = body.status === 'fulfilled' ? 'tasdiqlandi ✅' : 'rad etildi ❌';
    createNotification(
      claim.profileId,
      'referral_bonus' as any,
      'Sovg\'a so\'rovi',
      `${claim.reward.nameUz} uchun so'rovingiz ${statusText}`,
    ).catch(() => {});

    return reply.send({
      success: true,
      message: `So'rov ${body.status === 'fulfilled' ? 'tasdiqlandi' : 'rad etildi'}`,
    });
  });

  /**
   * PUT /admin/referral-point-settings — ball sozlamalarini o'zgartirish
   */
  app.put('/admin/referral-point-settings', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const schema = z.object({
      registrationPoints: z.number().int().min(0).max(1000).optional(),
      purchasePoints: z.number().int().min(0).max(1000).optional(),
      minPurchaseAmount: z.number().min(0).max(100000000).optional(),
    });
    const body = schema.parse(request.body);

    const updates: Promise<any>[] = [];

    if (body.registrationPoints !== undefined) {
      updates.push(prisma.adminSetting.upsert({
        where: { key: 'referral_registration_points' },
        update: { value: body.registrationPoints.toString() },
        create: { key: 'referral_registration_points', value: body.registrationPoints.toString() },
      }));
    }
    if (body.purchasePoints !== undefined) {
      updates.push(prisma.adminSetting.upsert({
        where: { key: 'referral_purchase_points' },
        update: { value: body.purchasePoints.toString() },
        create: { key: 'referral_purchase_points', value: body.purchasePoints.toString() },
      }));
    }
    if (body.minPurchaseAmount !== undefined) {
      updates.push(prisma.adminSetting.upsert({
        where: { key: 'referral_min_purchase' },
        update: { value: body.minPurchaseAmount.toString() },
        create: { key: 'referral_min_purchase', value: body.minPurchaseAmount.toString() },
      }));
    }

    await Promise.all(updates);

    return reply.send({
      success: true,
      message: 'Referral ball sozlamalari yangilandi',
    });
  });

  // ============================================
  // COMPETE-003: CATEGORY COMMISSIONS
  // Kategoriya bo'yicha dinamik komissiya
  // ============================================

  app.get('/admin/category-commissions', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const commissions = await prisma.categoryCommission.findMany({
      include: { category: { select: { id: true, nameUz: true, nameRu: true } } },
      orderBy: { category: { nameUz: 'asc' } },
    });

    // Also get all categories for the management UI
    const categories = await prisma.category.findMany({
      select: { id: true, nameUz: true, nameRu: true },
      orderBy: { nameUz: 'asc' },
    });

    return reply.send({ success: true, data: { commissions, categories } });
  });

  app.put('/admin/category-commissions/:categoryId', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { categoryId } = request.params as { categoryId: string };
    const { rate } = z.object({ rate: z.number().min(0).max(100) }).parse(request.body);

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundError('Kategoriya');

    const commission = await prisma.categoryCommission.upsert({
      where: { categoryId },
      update: { rate },
      create: { categoryId, rate },
      include: { category: { select: { id: true, nameUz: true, nameRu: true } } },
    });

    return reply.send({ success: true, data: commission });
  });

  app.delete('/admin/category-commissions/:categoryId', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { categoryId } = request.params as { categoryId: string };

    await prisma.categoryCommission.deleteMany({ where: { categoryId } });
    return reply.send({ success: true, message: 'Kategoriya komissiyasi o\'chirildi' });
  });

  // ============================================
  // COMPETE-004: PROMOTIONS / CAMPAIGNS
  // Aksiya va chegirmalar boshqaruvi
  // ============================================

  const promotionSchema = z.object({
    nameUz: z.string().min(2),
    nameRu: z.string().min(2),
    descriptionUz: z.string().optional(),
    descriptionRu: z.string().optional(),
    type: z.enum(['flash_sale', 'category_discount', 'shop_discount', 'free_delivery', 'bundle_deal']),
    discountPercent: z.number().min(0).max(100).optional(),
    discountFixed: z.number().min(0).optional(),
    minOrderAmount: z.number().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    bannerUrl: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    categoryIds: z.array(z.string().uuid()).optional(),
    shopIds: z.array(z.string().uuid()).optional(),
    productIds: z.array(z.string().uuid()).optional(),
    totalBudget: z.number().min(0).optional(),
    maxUsage: z.number().int().min(1).optional(),
  });

  app.get('/admin/promotions', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status, type } = request.query as { status?: string; type?: string };

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promotion.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: { promotions, meta: paginationMeta(page, limit, total) },
    });
  });

  app.get('/admin/promotions/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const promotion = await prisma.promotion.findUnique({ where: { id } });
    if (!promotion) throw new NotFoundError('Aksiya');
    return reply.send({ success: true, data: promotion });
  });

  app.post('/admin/promotions', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const body = promotionSchema.parse(request.body);

    const promotion = await prisma.promotion.create({
      data: {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        categoryIds: body.categoryIds || [],
        shopIds: body.shopIds || [],
        productIds: body.productIds || [],
        status: new Date(body.startDate) <= new Date() ? 'active' : 'scheduled',
      },
    });

    return reply.status(201).send({ success: true, data: promotion });
  });

  app.put('/admin/promotions/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = promotionSchema.partial().parse(request.body);

    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Aksiya');

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    });

    return reply.send({ success: true, data: promotion });
  });

  app.patch('/admin/promotions/:id/status', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = z.object({
      status: z.enum(['draft', 'active', 'scheduled', 'ended', 'cancelled']),
    }).parse(request.body);

    const promotion = await prisma.promotion.update({
      where: { id },
      data: { status },
    });

    return reply.send({ success: true, data: promotion });
  });

  app.delete('/admin/promotions/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.promotion.delete({ where: { id } });
    return reply.send({ success: true, message: 'Aksiya o\'chirildi' });
  });

  // ============================================
  // COMPETE-009: PENALTIES (Admin jarima boshqaruvi)
  // ============================================

  app.get('/admin/penalties', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status, shopId, type } = request.query as { status?: string; shopId?: string; type?: string };

    const where: any = {};
    if (status) where.status = status;
    if (shopId) where.shopId = shopId;
    if (type) where.type = type;

    const [penalties, total, totalApplied] = await Promise.all([
      prisma.penalty.findMany({
        where,
        include: {
          shop: { select: { id: true, name: true, logoUrl: true } },
          order: { select: { id: true, orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.penalty.count({ where }),
      prisma.penalty.aggregate({
        where: { status: 'applied' },
        _sum: { amount: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        penalties,
        totalApplied: Number(totalApplied._sum.amount || 0),
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  app.post('/admin/penalties', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const body = z.object({
      shopId: z.string().uuid(),
      orderId: z.string().uuid().optional(),
      type: z.enum(['late_shipment', 'order_cancellation', 'quality_issue', 'policy_violation', 'fake_product', 'other']),
      amount: z.number().min(0),
      reason: z.string().min(5),
      description: z.string().optional(),
    }).parse(request.body);

    const penalty = await prisma.penalty.create({
      data: {
        shopId: body.shopId,
        orderId: body.orderId,
        type: body.type,
        amount: body.amount,
        reason: body.reason,
        description: body.description,
        status: 'pending',
      },
      include: {
        shop: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    });

    return reply.status(201).send({ success: true, data: penalty });
  });

  app.patch('/admin/penalties/:id/status', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = z.object({
      status: z.enum(['applied', 'cancelled']),
    }).parse(request.body);

    const penalty = await prisma.penalty.findUnique({ where: { id } });
    if (!penalty) throw new NotFoundError('Jarima');

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.penalty.update({
        where: { id },
        data: {
          status,
          resolvedBy: request.user!.userId,
          resolvedAt: new Date(),
        },
      });

      // Jarimani qo'llash — balansdan yechish
      if (status === 'applied') {
        await tx.shop.update({
          where: { id: penalty.shopId },
          data: { balance: { decrement: Number(penalty.amount) } },
        });
      }

      return p;
    });

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // COMPETE-010: MODERATION QUEUE
  // Mahsulot moderatsiya navbati
  // ============================================

  app.get('/admin/moderation-queue', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status, search } = request.query as { status?: string; search?: string };

    const where: any = {};
    // Default: on_review
    if (status) {
      where.status = status;
    } else {
      where.status = 'on_review';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shop: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [products, total, pendingCount, allCounts] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          shop: { select: { id: true, name: true, logoUrl: true } },
          category: { select: { id: true, nameUz: true, nameRu: true, parent: { select: { id: true, nameUz: true, nameRu: true } } } },
          moderationLogs: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'asc' }, // FIFO — oldest first
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
      prisma.product.count({ where: { status: 'on_review' } }),
      prisma.product.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    allCounts.forEach(c => { statusCounts[c.status] = c._count; });

    return reply.send({
      success: true,
      data: {
        products,
        pendingCount,
        statusCounts,
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  // ============================================
  // COMPETE-002: ADMIN PRODUCT BOOST MANAGEMENT
  // ============================================

  app.get('/admin/boosts', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status } = request.query as { status?: string };

    const where: any = {};
    if (status) where.status = status;

    const [boosts, total] = await Promise.all([
      prisma.productBoost.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, images: true } },
          shop: { select: { id: true, name: true, logoUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productBoost.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: { boosts, meta: paginationMeta(page, limit, total) },
    });
  });

  app.patch('/admin/boosts/:id/approve', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const boost = await prisma.productBoost.findUnique({ where: { id } });
    if (!boost) throw new NotFoundError('Reklama');

    const updated = await prisma.productBoost.update({
      where: { id },
      data: { status: 'active' },
    });

    return reply.send({ success: true, data: updated });
  });

  app.patch('/admin/boosts/:id/reject', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const boost = await prisma.productBoost.findUnique({ where: { id } });
    if (!boost) throw new NotFoundError('Reklama');

    // Refund
    const remaining = Number(boost.totalBudget) - Number(boost.spentAmount);
    await prisma.$transaction(async (tx) => {
      if (remaining > 0) {
        await tx.shop.update({
          where: { id: boost.shopId },
          data: { balance: { increment: remaining } },
        });
      }
      await tx.productBoost.update({
        where: { id },
        data: { status: 'cancelled' },
      });
    });

    return reply.send({ success: true, message: 'Reklama rad etildi, mablag\' qaytarildi' });
  });

  // ============================================
  // SECURE-002: ADMIN RBAC
  // Admin rollari va ruxsatlar boshqaruvi
  // ============================================

  app.get('/admin/roles', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('roles.manage')],
  }, async (request, reply) => {
    const roles = await prisma.adminRole.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: roles });
  });

  app.put('/admin/roles/:userId', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('roles.manage')],
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = z.object({
      level: z.enum(['super_admin', 'manager', 'moderator', 'support', 'viewer']),
      permissions: z.array(z.string()).optional(),
    }).parse(request.body);

    // Can't change own super_admin role
    const currentRole = await prisma.adminRole.findUnique({
      where: { userId: request.user!.userId },
    });
    if (userId === request.user!.userId && currentRole?.level === 'super_admin' && body.level !== 'super_admin') {
      throw new AppError('O\'z super_admin rolingizni o\'zgartira olmaysiz', 400);
    }

    const role = await prisma.adminRole.upsert({
      where: { userId },
      update: { level: body.level, permissions: body.permissions || [] },
      create: { userId, level: body.level, permissions: body.permissions || [] },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
    });

    return reply.send({ success: true, data: role });
  });

  app.delete('/admin/roles/:userId', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('roles.manage')],
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };

    if (userId === request.user!.userId) {
      throw new AppError('O\'z rolingizni o\'chira olmaysiz', 400);
    }

    await prisma.adminRole.deleteMany({ where: { userId } });
    return reply.send({ success: true, message: 'Admin roli o\'chirildi' });
  });

  // ============================================
  // ADVANCED-003: KENGAYTIRILGAN ANALITIKA
  // Heatmap, Funnel, Cohort, A/B Testing
  // ============================================

  /**
   * GET /admin/analytics/heatmap
   * Qaysi mahsulotlar ko'p ko'riladi (heatmap data)
   */
  app.get('/admin/analytics/heatmap', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { period } = z.object({ period: z.enum(['week', 'month', 'quarter']).default('month') }).parse(request.query);

    const now = new Date();
    const startDate = new Date(now);
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else startDate.setMonth(now.getMonth() - 3);

    // Top viewed products with category info
    const topViewed = await prisma.productView.groupBy({
      by: ['productId'],
      where: { createdAt: { gte: startDate } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 50,
    });

    const productIds = topViewed.map(v => v.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true, name: true, price: true, viewCount: true, salesCount: true,
        category: { select: { nameUz: true, parent: { select: { nameUz: true } } } },
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));
    const heatmapData = topViewed.map(v => {
      const p = productMap.get(v.productId);
      return {
        productId: v.productId,
        name: p?.name ?? 'Unknown',
        category: p?.category?.parent?.nameUz ?? p?.category?.nameUz ?? '',
        subcategory: p?.category?.nameUz ?? '',
        views: v._count.productId,
        totalViews: p?.viewCount ?? 0,
        soldCount: p?.salesCount ?? 0,
        conversionRate: p?.viewCount ? Math.round(((p.salesCount ?? 0) / p.viewCount) * 10000) / 100 : 0,
      };
    });

    // Category aggregation
    const categoryMap = new Map<string, { views: number; sales: number }>();
    for (const item of heatmapData) {
      const cat = item.category || 'Boshqa';
      const entry = categoryMap.get(cat) || { views: 0, sales: 0 };
      entry.views += item.views;
      entry.sales += item.soldCount;
      categoryMap.set(cat, entry);
    }

    return reply.send({
      success: true,
      data: {
        products: heatmapData,
        categories: Array.from(categoryMap.entries()).map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.views - a.views),
      },
    });
  });

  /**
   * GET /admin/analytics/funnel
   * Ko'rish → Sevimli/Savat → Buyurtma → To'lov funnel
   */
  app.get('/admin/analytics/funnel', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { period } = z.object({ period: z.enum(['week', 'month', 'quarter']).default('month') }).parse(request.query);

    const now = new Date();
    const startDate = new Date(now);
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else startDate.setMonth(now.getMonth() - 3);

    const [views, carts, orders, delivered] = await Promise.all([
      prisma.productView.count({ where: { createdAt: { gte: startDate } } }),
      prisma.cartItem.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { createdAt: { gte: startDate }, status: 'delivered' } }),
    ]);

    return reply.send({
      success: true,
      data: {
        stages: [
          { name: 'Ko\'rish', count: views, percentage: 100 },
          { name: 'Savatga qo\'shish', count: carts, percentage: views > 0 ? Math.round((carts / views) * 10000) / 100 : 0 },
          { name: 'Buyurtma', count: orders, percentage: views > 0 ? Math.round((orders / views) * 10000) / 100 : 0 },
          { name: 'Yetkazilgan', count: delivered, percentage: views > 0 ? Math.round((delivered / views) * 10000) / 100 : 0 },
        ],
      },
    });
  });

  /**
   * GET /admin/analytics/cohort
   * Qayta xaridorlar cohort tahlili
   */
  app.get('/admin/analytics/cohort', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    // Last 6 months cohort
    const months = 6;
    const cohorts = [];

    for (let i = months - 1; i >= 0; i--) {
      const cohortStart = new Date();
      cohortStart.setMonth(cohortStart.getMonth() - i, 1);
      cohortStart.setHours(0, 0, 0, 0);
      const cohortEnd = new Date(cohortStart);
      cohortEnd.setMonth(cohortEnd.getMonth() + 1);

      // Users who made first order in this month
      const firstOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: cohortStart, lt: cohortEnd },
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      const userIds = firstOrders.map(o => o.userId);
      // Exclude users who ordered before this month
      const previousBuyers = userIds.length > 0
        ? await prisma.order.findMany({
            where: { userId: { in: userIds }, createdAt: { lt: cohortStart } },
            select: { userId: true },
            distinct: ['userId'],
          })
        : [];
      const previousSet = new Set(previousBuyers.map(p => p.userId));
      const newUsers = userIds.filter(id => !previousSet.has(id));

      // Check retention for subsequent months
      const retention: number[] = [];
      for (let j = 1; j <= months - i - 1 && j <= 5; j++) {
        const retStart = new Date(cohortStart);
        retStart.setMonth(retStart.getMonth() + j);
        const retEnd = new Date(retStart);
        retEnd.setMonth(retEnd.getMonth() + 1);

        if (newUsers.length === 0) {
          retention.push(0);
          continue;
        }

        const returned = await prisma.order.findMany({
          where: { userId: { in: newUsers }, createdAt: { gte: retStart, lt: retEnd } },
          select: { userId: true },
          distinct: ['userId'],
        });
        retention.push(Math.round((returned.length / newUsers.length) * 100));
      }

      cohorts.push({
        month: cohortStart.toISOString().slice(0, 7),
        newUsers: newUsers.length,
        retention,
      });
    }

    return reply.send({ success: true, data: cohorts });
  });

  /**
   * CRUD /admin/ab-tests
   * A/B test management
   */
  app.get('/admin/ab-tests', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const tests = await prisma.aBTest.findMany({ orderBy: { createdAt: 'desc' } });
    return reply.send({ success: true, data: tests });
  });

  app.post('/admin/ab-tests', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const body = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      testType: z.enum(['price', 'image', 'title', 'layout']),
      variants: z.any(),
      targetPercent: z.number().min(1).max(100).default(50),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }).parse(request.body);

    const test = await prisma.aBTest.create({
      data: {
        name: body.name,
        description: body.description,
        testType: body.testType,
        variants: body.variants as any,
        targetPercent: body.targetPercent,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return reply.send({ success: true, data: test });
  });

  app.patch('/admin/ab-tests/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({
      status: z.enum(['draft', 'running', 'paused', 'completed']).optional(),
      results: z.any().optional(),
    }).parse(request.body);

    const test = await prisma.aBTest.update({
      where: { id },
      data: body as any,
    });

    return reply.send({ success: true, data: test });
  });

  // ============================================
  // ADVANCED-004: MUKOFOT TIZIMI (LOYALTY)
  // Ball to'plash, darajalar, kuponlar
  // ============================================

  /**
   * GET /admin/loyalty/accounts
   * Barcha foydalanuvchilarning loyalty hisobri
   */
  app.get('/admin/loyalty/accounts', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { tier, search } = request.query as { tier?: string; search?: string };

    const where: any = {};
    if (tier) where.tier = tier;
    if (search) {
      where.user = { OR: [{ fullName: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] };
    }

    const [accounts, total] = await Promise.all([
      prisma.loyaltyAccount.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } } },
        orderBy: { lifetimePoints: 'desc' },
        skip,
        take: limit,
      }),
      prisma.loyaltyAccount.count({ where }),
    ]);

    return reply.send({ success: true, data: accounts, meta: paginationMeta(total, page, limit) });
  });

  /**
   * POST /admin/loyalty/adjust
   * Admin tomonidan ball qo'shish/ayirish
   */
  app.post('/admin/loyalty/adjust', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const body = z.object({
      userId: z.string().uuid(),
      points: z.number().int(),
      description: z.string().min(1),
    }).parse(request.body);

    let account = await prisma.loyaltyAccount.findUnique({ where: { userId: body.userId } });
    if (!account) {
      account = await prisma.loyaltyAccount.create({ data: { userId: body.userId } });
    }

    const newAvailable = Math.max(0, account.availablePoints + body.points);
    const newTotal = account.totalPoints + (body.points > 0 ? body.points : 0);
    const newLifetime = account.lifetimePoints + (body.points > 0 ? body.points : 0);

    // Calculate tier
    const tier = newLifetime >= 50000 ? 'platinum' : newLifetime >= 20000 ? 'gold' : newLifetime >= 5000 ? 'silver' : 'bronze';

    const [updated] = await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { availablePoints: newAvailable, totalPoints: newTotal, lifetimePoints: newLifetime, tier: tier as any },
      }),
      prisma.loyaltyPointLog.create({
        data: { accountId: account.id, action: 'admin_adjust', points: body.points, description: body.description },
      }),
    ]);

    return reply.send({ success: true, data: updated });
  });

  /**
   * GET /admin/loyalty/stats
   * Loyalty statistika
   */
  app.get('/admin/loyalty/stats', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const [total, byTier, totalPoints] = await Promise.all([
      prisma.loyaltyAccount.count(),
      prisma.loyaltyAccount.groupBy({
        by: ['tier'],
        _count: true,
      }),
      prisma.loyaltyAccount.aggregate({
        _sum: { availablePoints: true, lifetimePoints: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        totalAccounts: total,
        byTier: Object.fromEntries(byTier.map(t => [t.tier, t._count])),
        totalAvailablePoints: totalPoints._sum.availablePoints ?? 0,
        totalLifetimePoints: totalPoints._sum.lifetimePoints ?? 0,
      },
    });
  });

  // ============================================
  // ADVANCED-007: API MARKETPLACE
  // API kalitlari va webhook boshqaruvi
  // ============================================

  /**
   * CRUD /admin/api-keys
   */
  app.get('/admin/api-keys', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const keys = await prisma.apiKey.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        webhooks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask secrets
    const masked = keys.map(k => ({
      ...k,
      secret: k.secret.slice(0, 8) + '...',
      key: k.key.slice(0, 12) + '...',
    }));

    return reply.send({ success: true, data: masked });
  });

  app.post('/admin/api-keys', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const body = z.object({
      userId: z.string().uuid(),
      name: z.string().min(2),
      permissions: z.array(z.string()),
      rateLimit: z.number().min(100).max(10000).default(1000),
    }).parse(request.body);

    const crypto = await import('crypto');
    const key = 'tpk_' + crypto.randomBytes(24).toString('hex');
    const secret = 'tps_' + crypto.randomBytes(32).toString('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: body.userId,
        name: body.name,
        key,
        secret,
        permissions: body.permissions,
        rateLimit: body.rateLimit,
      },
    });

    return reply.send({ success: true, data: { ...apiKey, key, secret } }); // Show full key only on creation
  });

  app.delete('/admin/api-keys/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.apiKey.delete({ where: { id } });
    return reply.send({ success: true, message: 'API kalit o\'chirildi' });
  });

  /**
   * CRUD /admin/webhooks
   */
  app.post('/admin/webhooks', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const body = z.object({
      apiKeyId: z.string().uuid(),
      url: z.string().url(),
      events: z.array(z.string()),
    }).parse(request.body);

    const crypto = await import('crypto');
    const webhook = await prisma.webhook.create({
      data: {
        apiKeyId: body.apiKeyId,
        url: body.url,
        events: body.events,
        secret: 'whs_' + crypto.randomBytes(16).toString('hex'),
      },
    });

    return reply.send({ success: true, data: webhook });
  });

  app.delete('/admin/webhooks/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.webhook.delete({ where: { id } });
    return reply.send({ success: true, message: 'Webhook o\'chirildi' });
  });

  // ============================================
  // ADVANCED-008: FAQ BOT MANAGEMENT
  // ============================================

  app.get('/admin/faq', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const entries = await prisma.faqEntry.findMany({ orderBy: { sortOrder: 'asc' } });
    return reply.send({ success: true, data: entries });
  });

  app.post('/admin/faq', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const body = z.object({
      question: z.string().min(5),
      answer: z.string().min(5),
      keywords: z.array(z.string()).default([]),
      category: z.enum(['shipping', 'payment', 'returns', 'general']).optional(),
      sortOrder: z.number().int().default(0),
    }).parse(request.body);

    const entry = await prisma.faqEntry.create({ data: body });
    return reply.send({ success: true, data: entry });
  });

  app.patch('/admin/faq/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({
      question: z.string().min(5).optional(),
      answer: z.string().min(5).optional(),
      keywords: z.array(z.string()).optional(),
      category: z.enum(['shipping', 'payment', 'returns', 'general']).optional(),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    }).parse(request.body);

    const entry = await prisma.faqEntry.update({ where: { id }, data: body });
    return reply.send({ success: true, data: entry });
  });

  app.delete('/admin/faq/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.faqEntry.delete({ where: { id } });
    return reply.send({ success: true, message: 'FAQ o\'chirildi' });
  });

  // ============================================
  // COMPETE-007: ADMIN REVIEW MODERATION
  // Product & Shop reviews management
  // ============================================

  /**
   * GET /admin/reviews/products — List all product reviews with filters
   */
  app.get('/admin/reviews/products', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('moderation.manage')],
  }, async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      rating: z.coerce.number().min(1).max(5).optional(),
      search: z.string().optional(),
    }).parse(request.query);

    const { page, limit, skip } = parsePagination(request.query as any);

    const where: any = {};
    if (query.rating) where.rating = query.rating;
    if (query.search) {
      where.OR = [
        { comment: { contains: query.search, mode: 'insensitive' } },
        { product: { nameUz: { contains: query.search, mode: 'insensitive' } } },
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, nameUz: true, nameRu: true, images: true } },
          user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
        },
      }),
      prisma.productReview.count({ where }),
    ]);

    // Stats
    const [totalReviews, avgRating] = await Promise.all([
      prisma.productReview.count(),
      prisma.productReview.aggregate({ _avg: { rating: true } }),
    ]);

    return reply.send({
      success: true,
      data: reviews,
      meta: { ...paginationMeta(total, query.page, query.limit), totalReviews, avgRating: avgRating._avg.rating || 0 },
    });
  });

  /**
   * GET /admin/reviews/shops — List all shop reviews with filters
   */
  app.get('/admin/reviews/shops', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('moderation.manage')],
  }, async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      rating: z.coerce.number().min(1).max(5).optional(),
      search: z.string().optional(),
    }).parse(request.query);

    const { page, limit, skip } = parsePagination(request.query as any);

    const where: any = {};
    if (query.rating) where.rating = query.rating;
    if (query.search) {
      where.OR = [
        { comment: { contains: query.search, mode: 'insensitive' } },
        { shop: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.shopReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: { select: { id: true, name: true, logoUrl: true } },
          user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
        },
      }),
      prisma.shopReview.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: reviews,
      meta: paginationMeta(total, query.page, query.limit),
    });
  });

  /**
   * DELETE /admin/reviews/products/:id — Delete a product review
   */
  app.delete('/admin/reviews/products/:id', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('moderation.manage')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const review = await prisma.productReview.findUnique({
      where: { id },
      include: { product: { select: { id: true } } },
    });
    if (!review) throw new NotFoundError('Sharh topilmadi');

    await prisma.productReview.delete({ where: { id } });

    // Recalculate product rating
    const stats = await prisma.productReview.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: review.productId },
      data: { rating: stats._avg.rating || 0 },
    });

    return reply.send({ success: true, message: 'Sharh o\'chirildi' });
  });

  /**
   * DELETE /admin/reviews/shops/:id — Delete a shop review
   */
  app.delete('/admin/reviews/shops/:id', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('moderation.manage')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const review = await prisma.shopReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundError('Sharh topilmadi');

    await prisma.shopReview.delete({ where: { id } });

    // Recalculate shop rating
    const stats = await prisma.shopReview.aggregate({
      where: { shopId: review.shopId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.shop.update({
      where: { id: review.shopId },
      data: { rating: stats._avg.rating || 0, reviewCount: stats._count },
    });

    return reply.send({ success: true, message: 'Sharh o\'chirildi' });
  });
}
