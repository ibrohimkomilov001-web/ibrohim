/**
 * Admin Core Routes — Dashboard, Users, Demographics, Shops, Contracts, Products, Orders
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, requirePermission } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { indexProduct, removeProductFromIndex } from '../../services/search.service.js';
import { createAndSendContract, getContractStatus, isDidoxConfigured } from '../../services/didox.service.js';

export async function adminCoreRoutes(app: FastifyInstance) {
  // ==========================================
  // DASHBOARD
  // ==========================================
  app.get('/admin/dashboard', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers, totalShops, totalProducts, totalOrders,
      todayOrders, pendingShops, pendingProducts,
      totalRevenue, todayRevenue,
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
          totalUsers, totalShops, totalProducts, totalOrders,
          todayOrders, pendingShops, pendingProducts,
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
        where, skip, take: limit,
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

  app.put('/admin/users/:id/role', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('users.manage')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { role } = z.object({ role: z.enum(['user', 'vendor', 'courier', 'admin']) }).parse(request.body);

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
  // USER DEMOGRAPHICS
  // ==========================================
  app.get('/admin/user-demographics', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async () => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

    const [genderStats, regionStats, allUsersWithAge, monthlyGrowthRaw] = await Promise.all([
      prisma.profile.groupBy({
        by: ['gender'],
        where: { role: 'user' },
        _count: { id: true },
      }),
      prisma.$queryRaw<Array<{ region: string | null; count: bigint }>>`
        SELECT region, COUNT(id)::bigint as count
        FROM profiles
        WHERE role = 'user'
        GROUP BY region
        ORDER BY count DESC
      `,
      prisma.profile.findMany({
        where: { role: 'user', birthDate: { not: null } },
        select: { birthDate: true },
      }),
      prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT TO_CHAR("created_at", 'YYYY-MM') as month, COUNT(id)::bigint as count
        FROM profiles
        WHERE role = 'user' AND "created_at" >= ${twelveMonthsAgo}
        GROUP BY month
        ORDER BY month ASC
      `,
    ]);

    const ageGroups = { '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
    for (const { birthDate } of allUsersWithAge) {
      if (!birthDate) continue;
      const age = Math.floor((now.getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      if (age >= 13 && age <= 17) ageGroups['13-17']++;
      else if (age >= 18 && age <= 24) ageGroups['18-24']++;
      else if (age >= 25 && age <= 34) ageGroups['25-34']++;
      else if (age >= 35 && age <= 44) ageGroups['35-44']++;
      else if (age >= 45 && age <= 54) ageGroups['45-54']++;
      else if (age >= 55) ageGroups['55+']++;
    }

    return {
      success: true,
      data: {
        gender: genderStats.map(g => ({ gender: g.gender, count: g._count.id })),
        regions: regionStats.map(r => ({ region: r.region || 'Noma\'lum', count: Number(r.count) })),
        ageGroups: Object.entries(ageGroups).map(([range, count]) => ({ range, count })),
        monthlyGrowth: monthlyGrowthRaw.map(m => ({ month: m.month, count: Number(m.count) })),
      },
    };
  });

  // ==========================================
  // SHOPS
  // ==========================================
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
        where, skip, take: limit,
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

    if (status === 'active') {
      const existing = await prisma.shop.findUnique({ where: { id }, select: { contractStatus: true } });
      if (existing && existing.contractStatus !== 'signed') {
        throw new AppError('Shartnoma imzolanmaganligi sababli do\'konni faollashtirish mumkin emas. Avval shartnoma yuboring.', 400);
      }
    }

    const shop = await prisma.shop.update({ where: { id }, data: { status } });

    if (status === 'active' && shop.ownerId) {
      await prisma.profile.update({ where: { id: shop.ownerId }, data: { role: 'vendor' } });
    }
    if ((status === 'blocked' || status === 'inactive') && shop.ownerId) {
      await prisma.profile.update({ where: { id: shop.ownerId }, data: { role: 'user' } });
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
    const { commissionRate } = z.object({ commissionRate: z.number().min(0).max(100) }).parse(request.body);

    const shop = await prisma.shop.update({ where: { id }, data: { commissionRate } });

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
  // DELETE SHOP
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

    await prisma.$transaction(async (tx) => {
      await tx.product.deleteMany({ where: { shopId: id } });
      await tx.shopReview.deleteMany({ where: { shopId: id } });
      await tx.shopFollow.deleteMany({ where: { shopId: id } });
      const chatRooms = await tx.chatRoom.findMany({ where: { shopId: id }, select: { id: true } });
      if (chatRooms.length > 0) {
        const chatRoomIds = chatRooms.map(r => r.id);
        await tx.chatMessage.deleteMany({ where: { roomId: { in: chatRoomIds } } });
        await tx.chatRoom.deleteMany({ where: { shopId: id } });
      }
      await tx.vendorDocument.deleteMany({ where: { shopId: id } });
      await tx.vendorTransaction.deleteMany({ where: { shopId: id } });
      await tx.payout.deleteMany({ where: { shopId: id } });
      await tx.shop.delete({ where: { id } });

      if (shop.ownerId) {
        await tx.profile.update({ where: { id: shop.ownerId }, data: { role: 'user' } });
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'shop.deleted',
        entityType: 'shop',
        entityId: id,
        details: { shopName: shop.name, ownerId: shop.ownerId, productsDeleted: shop._count.products },
        ipAddress: request.ip,
      },
    });

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
  // SHOP CONTRACT — Didox
  // ==========================================
  app.post('/admin/shops/:id/send-contract', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: { owner: { select: { email: true, fullName: true } } },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

    if (!shop.inn) throw new AppError('Vendor INN kiritilmagan. Shartnoma yuborish uchun INN talab qilinadi.', 400);
    if (shop.contractStatus === 'signed') throw new AppError('Shartnoma allaqachon imzolangan.', 400);
    if (!isDidoxConfigured()) throw new AppError('Didox API sozlanmagan. DIDOX_API_TOKEN va DIDOX_COMPANY_TIN ni .env ga qo\'shing.', 500);

    const result = await createAndSendContract({
      vendorTin: shop.inn,
      vendorName: shop.owner?.fullName || shop.name,
      vendorEmail: shop.email || shop.owner?.email || undefined,
      shopName: shop.name,
      commissionRate: Number(shop.commissionRate),
    });

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: {
        contractStatus: 'sent',
        contractId: result.contractId,
        contractUrl: result.contractUrl,
        contractSentAt: new Date(),
        contractSentBy: request.user!.userId,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'shop.contract_sent',
        entityType: 'shop',
        entityId: id,
        details: { contractId: result.contractId },
        ipAddress: request.ip,
      },
    });

    if (shop.ownerId) {
      await prisma.notification.create({
        data: {
          userId: shop.ownerId,
          type: 'system',
          title: '📝 Shartnoma yuborildi',
          body: 'Didox orqali shartnoma yuborildi. Iltimos, shartnomani ko\'rib chiqing va imzolang.',
        },
      });
    }

    return { success: true, data: updatedShop };
  });

  app.get('/admin/shops/:id/contract-status', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundError('Do\'kon');

    if (!shop.contractId) {
      return { success: true, data: { contractStatus: shop.contractStatus } };
    }

    if (!isDidoxConfigured()) {
      return { success: true, data: { contractStatus: shop.contractStatus, note: 'Didox API sozlanmagan' } };
    }

    const didoxStatus = await getContractStatus(shop.contractId);

    let newContractStatus = shop.contractStatus;
    const updateData: Record<string, unknown> = {};

    if (didoxStatus.status === 'signed' && shop.contractStatus !== 'signed') {
      newContractStatus = 'signed';
      updateData.contractStatus = 'signed';
      updateData.contractSignedAt = didoxStatus.signedAt ? new Date(didoxStatus.signedAt) : new Date();
    } else if (didoxStatus.status === 'rejected' && shop.contractStatus !== 'rejected') {
      newContractStatus = 'rejected';
      updateData.contractStatus = 'rejected';
      updateData.contractNote = didoxStatus.rejectReason || undefined;
    } else if (didoxStatus.status === 'viewed' && shop.contractStatus === 'sent') {
      newContractStatus = 'pending_signature';
      updateData.contractStatus = 'pending_signature';
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.shop.update({ where: { id }, data: updateData });
    }

    return {
      success: true,
      data: {
        contractStatus: newContractStatus,
        contractId: shop.contractId,
        contractUrl: shop.contractUrl,
        contractSentAt: shop.contractSentAt,
        contractSignedAt: updateData.contractSignedAt || shop.contractSignedAt,
        didoxStatus: didoxStatus.status,
      },
    };
  });

  app.post('/webhooks/didox', async (request) => {
    const body = request.body as { contract_id?: string; status?: string; signed_at?: string; reject_reason?: string };

    if (!body.contract_id || !body.status) {
      throw new AppError('Noto\'g\'ri webhook ma\'lumotlari', 400);
    }

    const shop = await prisma.shop.findFirst({ where: { contractId: body.contract_id } });

    if (!shop) {
      request.log.warn({ contractId: body.contract_id }, 'Didox webhook: shop topilmadi');
      return { success: true };
    }

    if (body.status === 'signed') {
      await prisma.shop.update({
        where: { id: shop.id },
        data: {
          contractStatus: 'signed',
          contractSignedAt: body.signed_at ? new Date(body.signed_at) : new Date(),
        },
      });

      const admins = await prisma.profile.findMany({ where: { role: 'admin' }, select: { id: true } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: 'system' as const,
            title: '✅ Shartnoma imzolandi',
            body: `"${shop.name}" do'koni shartnomani imzoladi. Tasdiqlash mumkin.`,
          })),
        });
      }

      if (shop.ownerId) {
        await prisma.notification.create({
          data: {
            userId: shop.ownerId,
            type: 'system',
            title: '✅ Shartnoma imzolandi',
            body: 'Shartnomangiz muvaffaqiyatli imzolandi. Admin tasdiqlashini kuting.',
          },
        });
      }
    } else if (body.status === 'rejected') {
      await prisma.shop.update({
        where: { id: shop.id },
        data: {
          contractStatus: 'rejected',
          contractNote: body.reject_reason || undefined,
        },
      });

      if (shop.ownerId) {
        await prisma.notification.create({
          data: {
            userId: shop.ownerId,
            type: 'system',
            title: '❌ Shartnoma rad etildi',
            body: body.reject_reason
              ? `Shartnoma rad etildi. Sabab: ${body.reject_reason}`
              : 'Shartnoma rad etildi. Iltimos, admin bilan bog\'laning.',
          },
        });
      }
    }

    return { success: true };
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
        where, skip, take: limit,
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
        stats: { active: stats[0], onReview: stats[1], hasErrors: stats[2], blocked: stats[3], hidden: stats[4], draft: stats[5] },
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
      data: { status: 'blocked', moderatedBy: request.user!.userId, moderatedAt: new Date() },
      include: { shop: { select: { ownerId: true, name: true } } },
    });

    await prisma.productModerationLog.create({
      data: { productId: id, adminId: request.user!.userId, action: 'admin_blocked', reason },
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

    removeProductFromIndex(id).catch(() => {});
    return { success: true, data: product };
  });

  app.put('/admin/products/:id/unblock', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.update({
      where: { id },
      data: { status: 'active', moderatedBy: request.user!.userId, moderatedAt: new Date() },
      include: { shop: { select: { ownerId: true } } },
    });

    await prisma.productModerationLog.create({
      data: { productId: id, adminId: request.user!.userId, action: 'admin_unblocked' },
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

    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, nameUz: true, nameRu: true } },
        brand: { select: { id: true, name: true } },
        shop: { select: { id: true, name: true, ownerId: true } },
      },
    });
    if (fullProduct) indexProduct(fullProduct).catch(() => {});

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

  app.put('/admin/products/:id/approve', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.update({
      where: { id },
      data: { status: 'active', isActive: true, moderatedBy: request.user!.userId, moderatedAt: new Date() },
      include: { shop: { select: { ownerId: true, name: true } } },
    });

    await prisma.productModerationLog.create({
      data: { productId: id, adminId: request.user!.userId, action: 'admin_unblocked', reason: 'Admin tasdiqladi' },
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

  app.post('/admin/products/:id/ai-review', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Mahsulot');

    const { runAiModeration, isAiModerationAvailable } = await import('../../services/ai-moderation.service.js');
    if (!isAiModerationAvailable()) {
      throw new AppError('AI moderation sozlanmagan (GEMINI_API_KEY)', 400);
    }

    const result = await runAiModeration(id);
    return { success: true, data: result };
  });

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
      data: { productId: id, adminId: request.user!.userId, action: 'auto_rejected', reason },
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

    const activeOrders = await prisma.orderItem.count({
      where: {
        productId: id,
        order: { status: { notIn: ['delivered', 'cancelled'] } },
      },
    });

    if (activeOrders > 0) {
      throw new AppError(`Bu mahsulotda ${activeOrders} ta aktiv buyurtma bor. Avval buyurtmalarni yakunlang.`, 400);
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
        where, skip, take: limit,
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
          include: { profile: { select: { fullName: true, phone: true } } },
        },
      },
    });
    if (!order) throw new NotFoundError('Buyurtma');
    return { success: true, data: order };
  });

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

    const timestampField: Record<string, string> = {
      ready_for_pickup: 'readyAt',
      courier_picked_up: 'pickedUpAt',
      shipping: 'shippingAt',
      delivered: 'deliveredAt',
      cancelled: 'cancelledAt',
    };

    const updateData: any = { status };
    if (timestampField[status]) updateData[timestampField[status]] = new Date();
    if (status === 'cancelled' && note) updateData.cancelReason = note;

    const updatedOrder = await prisma.order.update({ where: { id }, data: updateData });

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

    if (status === 'delivered') {
      const deliveredItems = await prisma.orderItem.findMany({ where: { orderId: id } });
      for (const item of deliveredItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { salesCount: { increment: item.quantity } },
        });
      }
    }

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
}
