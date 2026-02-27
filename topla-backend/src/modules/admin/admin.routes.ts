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
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
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

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

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
    preHandler: [authMiddleware, requireRole('admin')],
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
    // Agar shop bloklangan bo'lsa, owner'ni user roliga qaytarish
    if (status === 'blocked' && shop.ownerId) {
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
        'pending', 'confirmed', 'processing', 'ready_for_pickup',
        'courier_assigned', 'courier_picked_up', 'shipping',
        'delivered', 'cancelled',
      ]),
      note: z.string().optional(),
    }).parse(request.body);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('Buyurtma');

    // Admin har qanday statusga o'zgartira oladi (veto power)
    const timestampField: Record<string, string> = {
      confirmed: 'confirmedAt',
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
  // CATEGORIES
  // ==========================================
  app.get('/admin/categories', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async () => {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        subcategories: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
    });
    return { success: true, data: categories };
  });

  app.post('/admin/categories', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const data = z.object({
      nameUz: z.string().min(1),
      nameRu: z.string().min(1),
      icon: z.string().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional(),
    }).parse(request.body);

    const category = await prisma.category.create({ data: data as any });
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

    // Tegishli mahsulotlar borligini tekshirish
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new AppError(`Bu kategoriyada ${productCount} ta mahsulot bor. Avval mahsulotlarni ko'chiring.`, 400);
    }

    await prisma.category.delete({ where: { id } });
    await cacheDelete(CacheKeys.CATEGORIES_ALL);
    return { success: true, message: 'Kategoriya o\'chirildi' };
  });

  // Subcategories
  app.post('/admin/subcategories', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const data = z.object({
      categoryId: z.string().uuid(),
      nameUz: z.string().min(1),
      nameRu: z.string().min(1),
      sortOrder: z.number().optional(),
    }).parse(request.body);

    const sub = await prisma.subcategory.create({ data: data as any });
    await cacheDelete(CacheKeys.CATEGORIES_ALL);
    return { success: true, data: sub };
  });

  app.put('/admin/subcategories/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = z.object({
      nameUz: z.string().min(1).optional(),
      nameRu: z.string().min(1).optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }).parse(request.body);

    const sub = await prisma.subcategory.update({ where: { id }, data });
    await cacheDelete(CacheKeys.CATEGORIES_ALL);
    return { success: true, data: sub };
  });

  app.delete('/admin/subcategories/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    // Tegishli mahsulotlar borligini tekshirish
    const productCount = await prisma.product.count({ where: { subcategoryId: id } });
    if (productCount > 0) {
      throw new AppError(`Bu subkategoriyada ${productCount} ta mahsulot bor. Avval mahsulotlarni ko'chiring.`, 400);
    }

    await prisma.subcategory.delete({ where: { id } });
    await cacheDelete(CacheKeys.CATEGORIES_ALL);
    return { success: true, message: 'Subkategoriya o\'chirildi' };
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

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.promoCode.count(),
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
    return { success: true, data: banner };
  });

  app.delete('/admin/banners/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.banner.delete({ where: { id } });
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
      revenueByShop,
      topProducts,
      newUsers,
      newShops,
    ] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: startDate } },
      }),
      prisma.vendorTransaction.groupBy({
        by: ['shopId'],
        _sum: { amount: true, commission: true, netAmount: true },
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
    ]);

    return {
      success: true,
      data: {
        period,
        orderStats,
        revenueByShop,
        topProducts,
        newUsers,
        newShops,
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

    const where: any = {};
    if (action) where.action = { contains: action };
    if (entityType) where.entityType = entityType;

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
    preHandler: [authMiddleware, requireRole('admin')],
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
}
