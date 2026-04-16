/**
 * Admin Catalog Routes — Categories, Brands, Promo Codes, Delivery Zones, Banners,
 * Payouts, Notifications, Reports, Chats, Logs, Settings
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, requirePermission } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { cacheDelete } from '../../config/redis.js';
import { CacheKeys } from '../../utils/constants.js';

export async function adminCatalogRoutes(app: FastifyInstance) {
  // ==========================================
  // CATEGORIES — 3-level self-referencing tree
  // ==========================================
  app.get('/admin/categories', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { parentId, level, tree } = request.query as { parentId?: string; level?: string; tree?: string };

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

    let level = data.level ?? 0;
    if (data.parentId && data.level === undefined) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId }, select: { level: true } });
      if (parent) level = parent.level + 1;
    }

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

    const descendants = await prisma.category.findMany({
      where: { OR: [{ id }, { parentId: id }, { parent: { parentId: id } }] },
      select: { id: true },
    });
    const catIds = descendants.map(d => d.id);

    const productCount = await prisma.product.count({ where: { categoryId: { in: catIds } } });
    if (productCount > 0) {
      throw new AppError(`Bu kategoriya va bolalarida ${productCount} ta mahsulot bor. Avval mahsulotlarni ko'chiring.`, 400);
    }

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
      prisma.promoCode.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
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
      data: { ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined } as any,
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
      data: { ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined },
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
  // BANNERS
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
        where, skip, take: limit,
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
    const { status } = z.object({ status: z.enum(['completed', 'failed']) }).parse(request.body);

    const payout = await prisma.payout.update({
      where: { id },
      data: { status, processedAt: new Date() },
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
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, phone: true } } },
      }),
      prisma.notification.count({ where }),
    ]);

    return { success: true, data: { items: notifications, pagination: paginationMeta(page, limit, total) } };
  });

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

    const users = await prisma.profile.findMany({ where, select: { id: true } });

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

    try {
      const devices = await prisma.userDevice.findMany({
        where: { userId: { in: users.map(u => u.id) }, isActive: true },
        select: { fcmToken: true },
      });
      const tokens = devices.map(d => d.fcmToken).filter(Boolean);
      if (tokens.length > 0) {
        const pushData: Record<string, string> = { type: 'admin_notification', notificationId: id };
        if (notification.imageUrl) pushData.imageUrl = notification.imageUrl;
        if (notification.linkUrl) pushData.linkUrl = notification.linkUrl;
        const { enqueueNotification } = await import('../../services/queue.service.js');
        await enqueueNotification({ type: 'push_multicast', tokens, title: notification.title, body: notification.body, data: pushData });
      }
    } catch (pushErr) {
      request.log.error({ err: pushErr }, 'Push notification yuborishda xatolik');
    }

    await prisma.notification.update({
      where: { id },
      data: { data: { ...data, isDraft: false, sentCount: users.length, sentAt: new Date().toISOString() } },
    });

    return { success: true, message: `${users.length} ta foydalanuvchiga bildirishnoma yuborildi` };
  });

  app.delete('/admin/notifications/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.notification.delete({ where: { id } });
    return { success: true, message: 'Bildirishnoma o\'chirildi' };
  });

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

    const users = await prisma.profile.findMany({ where, select: { id: true } });

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

    let pushSentCount = 0;
    try {
      const devices = await prisma.userDevice.findMany({
        where: { userId: { in: users.map(u => u.id) }, isActive: true },
        select: { fcmToken: true },
      });
      const tokens = devices.map(d => d.fcmToken).filter(Boolean);
      pushSentCount = tokens.length;
      if (tokens.length > 0) {
        const pushData: Record<string, string> = { type: 'admin_broadcast', targetRole };
        if (imageUrl) pushData.imageUrl = imageUrl;
        if (linkUrl) pushData.linkUrl = linkUrl;
        const { enqueueNotification } = await import('../../services/queue.service.js');
        await enqueueNotification({ type: 'push_multicast', tokens, title, body, data: pushData });
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

    return { success: true, message: `${users.length} ta foydalanuvchiga bildirishnoma yuborildi (${pushSentCount} push)` };
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

    const [orderStats, revenueByShopRaw, topProducts, newUsers, newShops, totalUsers] = await Promise.all([
      prisma.order.groupBy({ by: ['status'], _count: true, where: { createdAt: { gte: startDate } } }),
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
        select: { id: true, nameUz: true, price: true, salesCount: true, shop: { select: { name: true } } },
      }),
      prisma.profile.count({ where: { role: 'user', createdAt: { gte: startDate } } }),
      prisma.shop.count({ where: { createdAt: { gte: startDate } } }),
      prisma.profile.count({ where: { role: 'user' } }),
    ]);

    const shopIds = revenueByShopRaw.map((r: any) => r.shopId).filter(Boolean);
    const shops = shopIds.length > 0
      ? await prisma.shop.findMany({ where: { id: { in: shopIds } }, select: { id: true, name: true } })
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
          id: p.id, nameUz: p.nameUz, price: p.price, salesCount: p.salesCount,
          shopName: p.shop?.name || '-',
          revenue: Number(p.price || 0) * Number(p.salesCount || 0),
        })),
        newUsers, newShops, totalUsers,
      },
    };
  });

  // ==========================================
  // CHAT (Admin monitoring)
  // ==========================================
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
        where, skip, take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          customer: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
          shop: { select: { id: true, name: true, logoUrl: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { message: true, senderRole: true, createdAt: true, isRead: true } },
          _count: { select: { messages: { where: { isRead: false } } } },
        },
      }),
      prisma.chatRoom.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: rooms.map(r => ({
          id: r.id, status: r.status, lastMessageAt: r.lastMessageAt, createdAt: r.createdAt,
          customer: r.customer, shop: r.shop,
          lastMessage: r.messages[0] || null,
          unreadCount: r._count.messages,
        })),
        pagination: paginationMeta(page, limit, total),
      },
    };
  });

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

    if (!room) return { success: false, message: 'Chat topilmadi' };

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { roomId: id }, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      prisma.chatMessage.count({ where: { roomId: id } }),
    ]);

    return {
      success: true,
      data: { room, items: messages.reverse(), pagination: paginationMeta(page, limit, total) },
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
      prisma.activityLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.activityLog.count({ where }),
    ]);

    return { success: true, data: { items: logs, pagination: paginationMeta(page, limit, total) } };
  });

  app.delete('/admin/logs/clear', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const days = parseInt(query.days as string) || 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.activityLog.deleteMany({ where: { createdAt: { lt: cutoffDate } } });

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

    await cacheDelete('settings:public');
    return { success: true, message: 'Sozlamalar yangilandi' };
  });
}
