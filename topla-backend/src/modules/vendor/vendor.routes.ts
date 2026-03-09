import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { getVendorShop } from '../../utils/shop.js';

// ============================================
// Validation Schemas
// ============================================

const payoutRequestSchema = z.object({
  amount: z.number().min(10000, 'Minimal summa 10,000 so\'m'),
  cardNumber: z.string().min(16).max(19),
});

const analyticsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year']).default('month'),
});

// ============================================
// Routes
// ============================================

export async function vendorRoutes(app: FastifyInstance): Promise<void> {
  // All vendor routes require auth + vendor/admin role
  const vendorAuth = [authMiddleware, requireRole('vendor', 'admin')];

  // ============================================
  // GET /vendor/profile
  // Vendor profil ma'lumotlari
  // ============================================
  app.get('/vendor/profile', { preHandler: vendorAuth }, async (request, reply) => {
    const profile = await prisma.profile.findUnique({
      where: { id: request.user!.userId },
      include: { shop: true },
    });

    if (!profile) throw new NotFoundError('Profil');

    return reply.send({
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phone,
      role: profile.role,
      avatarUrl: profile.avatarUrl,
      shop: profile.shop ? {
        id: profile.shop.id,
        name: profile.shop.name,
        status: profile.shop.status,
      } : undefined,
    });
  });

  // ============================================
  // GET /vendor/shop
  // Vendor do'kon ma'lumotlari
  // ============================================
  app.get('/vendor/shop', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
      include: {
        _count: { select: { products: true, reviews: true, orderItems: true } },
      },
    });

    if (!shop) throw new NotFoundError('Do\'kon');

    return reply.send({ success: true, data: shop });
  });

  // ============================================
  // GET /vendor/products
  // Vendor mahsulotlar ro'yxati
  // ============================================
  app.get('/vendor/products', { preHandler: vendorAuth }, async (request, reply) => {
    const { page = '1', limit = '20', search, isActive } = request.query as {
      page?: string;
      limit?: string;
      search?: string;
      isActive?: string;
    };

    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { page: pg, limit: lim, skip } = parsePagination({ page, limit });

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, nameUz: true, nameRu: true } },
          subcategory: { select: { id: true, nameUz: true, nameRu: true } },
          brand: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: lim,
      }),
      prisma.product.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        products,
        pagination: paginationMeta(pg, lim, total),
      },
    });
  });

  // ============================================
  // GET /vendor/products/:id
  // Vendor o'z mahsulotini ID bo'yicha ko'rish
  // ============================================
  app.get('/vendor/products/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const shop = await getVendorShop(request.user!.userId);

    const product = await prisma.product.findFirst({
      where: { id, shopId: shop.id },
      include: {
        category: { select: { id: true, nameUz: true, nameRu: true } },
        subcategory: { select: { id: true, nameUz: true, nameRu: true } },
        brand: { select: { id: true, name: true } },
        color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
        variants: {
          include: {
            color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
            size: { select: { id: true, nameUz: true, nameRu: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) throw new NotFoundError('Mahsulot');

    return reply.send({ success: true, data: product });
  });

  // ============================================
  // PATCH /vendor/products/:id
  // Mahsulotni active/inactive qilish (toggle)
  // ============================================
  app.patch('/vendor/products/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    }).parse(request.body);

    const shop = await getVendorShop(request.user!.userId);

    // Ownership tekshiruvi
    const existing = await prisma.product.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) throw new NotFoundError('Mahsulot');

    const product = await prisma.product.update({
      where: { id },
      data: body,
    });

    return reply.send({ success: true, data: product });
  });

  // ============================================
  // GET /vendor/stats
  // Kengaytirilgan statistika
  // ============================================
  app.get('/vendor/stats', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const shopFilter = { items: { some: { shopId: shop.id } } };

    const [
      totalOrders,
      todayOrders,
      monthOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      productsCount,
      activeProducts,
      totalRevenue,
      monthRevenue,
      todayRevenue,
      totalCommission,
    ] = await Promise.all([
      prisma.order.count({ where: shopFilter }),
      prisma.order.count({ where: { ...shopFilter, createdAt: { gte: today } } }),
      prisma.order.count({ where: { ...shopFilter, createdAt: { gte: monthStart } } }),
      prisma.order.count({ where: { ...shopFilter, status: 'pending' } }),
      prisma.order.count({ where: { ...shopFilter, status: 'delivered' } }),
      prisma.order.count({ where: { ...shopFilter, status: 'cancelled' } }),
      prisma.product.count({ where: { shopId: shop.id } }),
      prisma.product.count({ where: { shopId: shop.id, isActive: true } }),
      prisma.vendorTransaction.aggregate({
        where: { shopId: shop.id, type: 'sale' },
        _sum: { netAmount: true },
      }),
      prisma.vendorTransaction.aggregate({
        where: { shopId: shop.id, type: 'sale', createdAt: { gte: monthStart } },
        _sum: { netAmount: true },
      }),
      prisma.vendorTransaction.aggregate({
        where: { shopId: shop.id, type: 'sale', createdAt: { gte: today } },
        _sum: { netAmount: true },
      }),
      prisma.vendorTransaction.aggregate({
        where: { shopId: shop.id, type: 'sale' },
        _sum: { commission: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        balance: Number(shop.balance),
        rating: shop.rating,
        reviewCount: shop.reviewCount,
        commissionRate: Number(shop.commissionRate),
        orders: {
          total: totalOrders,
          today: todayOrders,
          month: monthOrders,
          pending: pendingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        products: {
          total: productsCount,
          active: activeProducts,
          inactive: productsCount - activeProducts,
        },
        revenue: {
          total: Number(totalRevenue._sum.netAmount || 0),
          month: Number(monthRevenue._sum.netAmount || 0),
          today: Number(todayRevenue._sum.netAmount || 0),
        },
        totalCommission: Number(totalCommission._sum.commission || 0),
      },
    });
  });

  // ============================================
  // GET /vendor/analytics
  // Analitika (davr bo'yicha)
  // ============================================
  app.get('/vendor/analytics', { preHandler: vendorAuth }, async (request, reply) => {
    const { period = 'month' } = request.query as { period?: string };

    const shop = await getVendorShop(request.user!.userId);

    // Davr boshini aniqlash
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Davrlik ma'lumotlar
    const [transactions, topProducts, ordersByStatus] = await Promise.all([
      // Kunlik tranzaksiyalar
      prisma.vendorTransaction.findMany({
        where: { shopId: shop.id, type: 'sale', createdAt: { gte: startDate } },
        orderBy: { createdAt: 'asc' },
        select: {
          amount: true,
          commission: true,
          netAmount: true,
          createdAt: true,
        },
      }),

      // Top mahsulotlar
      prisma.orderItem.groupBy({
        by: ['productId', 'name'],
        where: {
          shopId: shop.id,
          order: { createdAt: { gte: startDate }, status: { not: 'cancelled' } },
        },
        _sum: { quantity: true },
        _count: true,
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),

      // Status bo'yicha buyurtmalar soni
      prisma.order.groupBy({
        by: ['status'],
        where: {
          items: { some: { shopId: shop.id } },
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
    ]);

    // Kunlik taqsimot
    const dailyRevenue: Record<string, { revenue: number; orders: number; commission: number }> = {};
    for (const tx of transactions) {
      const dateKey = tx.createdAt.toISOString().slice(0, 10);
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = { revenue: 0, orders: 0, commission: 0 };
      }
      dailyRevenue[dateKey].revenue += Number(tx.netAmount);
      dailyRevenue[dateKey].orders += 1;
      dailyRevenue[dateKey].commission += Number(tx.commission);
    }

    return reply.send({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
          date,
          ...data,
        })),
        topProducts: topProducts.map((p) => ({
          productId: p.productId,
          name: p.name,
          totalSold: p._sum.quantity || 0,
          orderCount: p._count,
        })),
        ordersByStatus: ordersByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        summary: {
          totalRevenue: transactions.reduce((sum, tx) => sum + Number(tx.netAmount), 0),
          totalCommission: transactions.reduce((sum, tx) => sum + Number(tx.commission), 0),
          totalOrders: transactions.length,
          averageOrderValue:
            transactions.length > 0
              ? transactions.reduce((sum, tx) => sum + Number(tx.amount), 0) / transactions.length
              : 0,
        },
      },
    });
  });

  // ============================================
  // GET /vendor/payouts
  // To'lovlar tarixi
  // ============================================
  app.get('/vendor/payouts', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status } = request.query as { status?: string };

    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        payouts,
        balance: Number(shop.balance),
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  // ============================================
  // POST /vendor/payouts
  // Pul yechish so'rovi
  // ============================================
  app.post('/vendor/payouts', { preHandler: vendorAuth }, async (request, reply) => {
    const body = payoutRequestSchema.parse(request.body);

    const shop = await getVendorShop(request.user!.userId);

    if (Number(shop.balance) < body.amount) {
      throw new AppError(`Balans yetarli emas. Joriy balans: ${shop.balance} so'm`);
    }

    // Pending payout bormi?
    const pendingPayout = await prisma.payout.findFirst({
      where: { shopId: shop.id, status: 'pending' },
    });
    if (pendingPayout) {
      throw new AppError('Sizda kutilayotgan to\'lov mavjud. Iltimos uni kuting.');
    }

    const payout = await prisma.$transaction(async (tx) => {
      // Balansdan yechish
      await tx.shop.update({
        where: { id: shop.id },
        data: { balance: { decrement: body.amount } },
      });

      // Payout yaratish
      const newPayout = await tx.payout.create({
        data: {
          shopId: shop.id,
          amount: body.amount,
          cardNumber: body.cardNumber,
          status: 'pending',
        },
      });

      // Vendor transaction
      await tx.vendorTransaction.create({
        data: {
          shopId: shop.id,
          amount: body.amount,
          commission: 0,
          netAmount: body.amount,
          type: 'payout',
        },
      });

      return newPayout;
    });

    return reply.status(201).send({ success: true, data: payout });
  });

  // ============================================
  // GET /vendor/commissions
  // Komissiya tarixi
  // ============================================
  app.get('/vendor/commissions', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);

    const shop = await getVendorShop(request.user!.userId);

    const [transactions, total, totalCommission] = await Promise.all([
      prisma.vendorTransaction.findMany({
        where: { shopId: shop.id, type: 'sale' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vendorTransaction.count({
        where: { shopId: shop.id, type: 'sale' },
      }),
      prisma.vendorTransaction.aggregate({
        where: { shopId: shop.id, type: 'sale' },
        _sum: { commission: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        transactions,
        commissionRate: Number(shop.commissionRate),
        totalCommission: Number(totalCommission._sum.commission || 0),
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  // ============================================
  // GET /vendor/transactions
  // Barcha tranzaksiyalar
  // ============================================
  app.get('/vendor/transactions', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { type } = request.query as { type?: string };

    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.vendorTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vendorTransaction.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        transactions,
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  /**
   * GET /vendor/reviews
   * Vendor do'koniga yozilgan sharhlar
   */
  app.get('/vendor/reviews', { preHandler: [authMiddleware, requireRole('vendor')] }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);

    // Vendor do'konini topish
    const shop = await getVendorShop(request.user!.userId);

    const [reviews, total] = await Promise.all([
      prisma.shopReview.findMany({
        where: { shopId: shop.id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.shopReview.count({ where: { shopId: shop.id } }),
    ]);

    return reply.send({
      success: true,
      data: {
        reviews,
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  // ============================================
  // POST /vendor/reviews/:id/reply
  // Vendor sharhga javob berish
  // ============================================
  app.post('/vendor/reviews/:id/reply', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reply: replyText } = z.object({
      reply: z.string().min(1, 'Javob matnini kiriting'),
    }).parse(request.body);

    const shop = await getVendorShop(request.user!.userId);

    // Sharh vendor do'konigami tekshirish
    const review = await prisma.shopReview.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!review) throw new NotFoundError('Sharh');

    // vendorReply maydoniga saqlash (original comment saqlanadi)
    const updatedReview = await prisma.shopReview.update({
      where: { id },
      data: {
        vendorReply: replyText,
        vendorRepliedAt: new Date(),
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: review.userId,
        type: 'system',
        title: '💬 Sharhingizga javob keldi',
        body: `${shop.name}: ${replyText.substring(0, 100)}`,
        data: { shopId: shop.id, reviewId: id },
      },
    });

    return reply.send({ success: true, data: updatedReview });
  });

  // ============================================
  // VENDOR CHAT ALIASES (frontend /vendor/chats chaqiradi)
  // Asl chat route'lari /chat/rooms da — bu alias'lar
  // ============================================

  app.get('/vendor/chats', { preHandler: vendorAuth }, async (request, reply) => {
    const userId = request.user!.userId;
    const shop = await prisma.shop.findUnique({ where: { ownerId: userId } });
    if (!shop) return reply.send({ success: true, data: [] });

    const rooms = await prisma.chatRoom.findMany({
      where: { shopId: shop.id },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      include: {
        customer: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
        shop: { select: { id: true, name: true, logoUrl: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { message: true, createdAt: true, senderRole: true, isRead: true },
        },
      },
    });

    const roomIds = rooms.map(r => r.id);
    const unreadCounts = roomIds.length > 0
      ? await prisma.chatMessage.groupBy({
          by: ['roomId'],
          where: { roomId: { in: roomIds }, isRead: false, senderRole: 'user' },
          _count: { id: true },
        })
      : [];

    const unreadMap = new Map(unreadCounts.map(u => [u.roomId, u._count.id]));
    const roomsWithUnread = rooms.map(room => ({
      ...room,
      unreadCount: unreadMap.get(room.id) || 0,
    }));

    return reply.send({ success: true, data: roomsWithUnread });
  });

  app.get('/vendor/chats/:id/messages', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as any;
    const limit = Math.min(parseInt(query.limit || '50') || 50, 100);
    const skip = ((parseInt(query.page || '1') - 1) * limit);
    const userId = request.user!.userId;

    const room = await prisma.chatRoom.findUnique({
      where: { id },
      include: { shop: { select: { ownerId: true } } },
    });
    if (!room) throw new NotFoundError('Chat xonasi');
    if (room.shop.ownerId !== userId) throw new AppError('Ruxsat yo\'q', 403);

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { roomId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      prisma.chatMessage.count({ where: { roomId: id } }),
    ]);

    return reply.send({
      success: true,
      data: {
        items: messages.reverse(),
        pagination: { total, page: Math.floor(skip / limit) + 1, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  });

  app.post('/vendor/chats/:id/messages', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const { message, imageUrl } = z.object({
      message: z.string().optional(),
      imageUrl: z.string().optional(),
    }).parse(request.body);

    if (!message && !imageUrl) throw new AppError('Xabar yoki rasm kerak', 400);

    const room = await prisma.chatRoom.findUnique({
      where: { id },
      include: { shop: { select: { ownerId: true } } },
    });
    if (!room) throw new NotFoundError('Chat xonasi');
    if (room.shop.ownerId !== userId) throw new AppError('Ruxsat yo\'q', 403);

    const chatMessage = await prisma.chatMessage.create({
      data: {
        roomId: id,
        senderId: userId,
        senderRole: 'vendor',
        message: message || null,
        imageUrl: imageUrl || null,
      },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    await prisma.chatRoom.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    return reply.send({ success: true, data: chatMessage });
  });

  // ============================================
  // VENDOR RETURNS (Qaytarishlar)
  // ============================================

  /**
   * GET /vendor/returns
   * Vendor do'koniga tegishli buyurtmalar qaytarishlari
   */
  app.get('/vendor/returns', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status } = request.query as Record<string, string>;
    const userId = request.user!.userId;

    const shop = await getVendorShop(userId);

    const where: any = {
      order: { items: { some: { shopId: shop.id } } },
    };
    if (status) where.status = status;

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              createdAt: true,
              items: {
                where: { shopId: shop.id },
                select: { name: true, quantity: true, price: true, imageUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.return.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: returns,
      meta: paginationMeta(page, limit, total),
    });
  });

  // ============================================
  // VENDOR PROMO CODES
  // ============================================

  const vendorPromoSchema = z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minOrderAmount: z.number().min(0).optional(),
    maxUses: z.number().int().min(1).optional(),
    expiresAt: z.string().datetime().optional(),
  });

  /**
   * GET /vendor/promo-codes
   */
  app.get('/vendor/promo-codes', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const userId = request.user!.userId;

    const shop = await getVendorShop(userId);

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where: { shopId: shop.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promoCode.count({ where: { shopId: shop.id } }),
    ]);

    return reply.send({
      success: true,
      data: promoCodes,
      meta: paginationMeta(page, limit, total),
    });
  });

  /**
   * POST /vendor/promo-codes
   */
  app.post('/vendor/promo-codes', { preHandler: vendorAuth }, async (request, reply) => {
    const userId = request.user!.userId;
    const data = vendorPromoSchema.parse(request.body);

    const shop = await getVendorShop(userId);

    // Max 20 promo codes per vendor
    const count = await prisma.promoCode.count({ where: { shopId: shop.id } });
    if (count >= 20) throw new AppError('Maksimal 20 ta promo kod yaratish mumkin', 400);

    // Check code uniqueness
    const existing = await prisma.promoCode.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Bu kod allaqachon mavjud', 409);

    const promo = await prisma.promoCode.create({
      data: {
        shopId: shop.id,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount ?? 0,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });

    return reply.send({ success: true, data: promo });
  });

  /**
   * PUT /vendor/promo-codes/:id
   */
  app.put('/vendor/promo-codes/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const data = vendorPromoSchema.partial().extend({
      isActive: z.boolean().optional(),
    }).parse(request.body);

    const shop = await getVendorShop(userId);

    const promo = await prisma.promoCode.findFirst({ where: { id, shopId: shop.id } });
    if (!promo) throw new NotFoundError('Promo kod');

    const updated = await prisma.promoCode.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });

    return reply.send({ success: true, data: updated });
  });

  /**
   * DELETE /vendor/promo-codes/:id
   */
  app.delete('/vendor/promo-codes/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const shop = await getVendorShop(userId);

    const promo = await prisma.promoCode.findFirst({ where: { id, shopId: shop.id } });
    if (!promo) throw new NotFoundError('Promo kod');

    await prisma.promoCode.delete({ where: { id } });
    return reply.send({ success: true, message: 'Promo kod o\'chirildi' });
  });

  // ============================================
  // COMPETE-001: FUNNEL ANALYTICS
  // Ko'rishlar → Savatga → Buyurtma konversiya
  // ============================================

  app.get('/vendor/analytics/funnel', { preHandler: vendorAuth }, async (request, reply) => {
    const { period = 'month' } = request.query as { period?: string };
    const shop = await getVendorShop(request.user!.userId);

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
    }

    const [totalViews, uniqueViewers, cartAdds, orders, deliveredOrders] = await Promise.all([
      // Umumiy ko'rishlar
      prisma.productView.count({
        where: { product: { shopId: shop.id }, createdAt: { gte: startDate } },
      }),
      // Unikal ko'ruvchilar
      prisma.productView.groupBy({
        by: ['userId'],
        where: { product: { shopId: shop.id }, createdAt: { gte: startDate } },
      }).then(r => r.length),
      // Savatga qo'shilganlar
      prisma.cartItem.count({
        where: { product: { shopId: shop.id }, createdAt: { gte: startDate } },
      }),
      // Buyurtmalar
      prisma.order.count({
        where: { items: { some: { shopId: shop.id } }, createdAt: { gte: startDate }, status: { not: 'cancelled' } },
      }),
      // Yetkazilgan buyurtmalar
      prisma.order.count({
        where: { items: { some: { shopId: shop.id } }, createdAt: { gte: startDate }, status: 'delivered' },
      }),
    ]);

    // Kunlik trend
    const dailyViews = await prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(`
      SELECT DATE(pv."created_at") as date, COUNT(*) as count
      FROM product_views pv
      JOIN products p ON pv."product_id" = p.id
      WHERE p."shop_id" = $1::uuid AND pv."created_at" >= $2
      GROUP BY DATE(pv."created_at")
      ORDER BY date ASC
    `, shop.id, startDate);

    const dailyOrders = await prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(`
      SELECT DATE(o."created_at") as date, COUNT(DISTINCT o.id) as count
      FROM orders o
      JOIN order_items oi ON o.id = oi."order_id"
      WHERE oi."shop_id" = $1::uuid AND o."created_at" >= $2 AND o.status != 'cancelled'
      GROUP BY DATE(o."created_at")
      ORDER BY date ASC
    `, shop.id, startDate);

    return reply.send({
      success: true,
      data: {
        funnel: {
          views: totalViews,
          uniqueViewers,
          cartAdds,
          orders,
          delivered: deliveredOrders,
        },
        conversionRates: {
          viewToCart: totalViews > 0 ? ((cartAdds / totalViews) * 100).toFixed(1) : '0.0',
          cartToOrder: cartAdds > 0 ? ((orders / cartAdds) * 100).toFixed(1) : '0.0',
          orderToDelivered: orders > 0 ? ((deliveredOrders / orders) * 100).toFixed(1) : '0.0',
          overall: totalViews > 0 ? ((deliveredOrders / totalViews) * 100).toFixed(2) : '0.00',
        },
        dailyViews: dailyViews.map(d => ({ date: String(d.date).slice(0, 10), count: Number(d.count) })),
        dailyOrders: dailyOrders.map(d => ({ date: String(d.date).slice(0, 10), count: Number(d.count) })),
      },
    });
  });

  // ============================================
  // COMPETE-007: PRODUCT REVIEWS (mahsulot sharhlari)
  // ============================================

  app.get('/vendor/product-reviews', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { rating, productId } = request.query as { rating?: string; productId?: string };
    const shop = await getVendorShop(request.user!.userId);

    const where: any = { product: { shopId: shop.id } };
    if (rating) where.rating = parseInt(rating);
    if (productId) where.productId = productId;

    const [reviews, total, avgRating, ratingDist] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          product: { select: { id: true, name: true, images: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where }),
      prisma.productReview.aggregate({ where: { product: { shopId: shop.id } }, _avg: { rating: true } }),
      prisma.productReview.groupBy({
        by: ['rating'],
        where: { product: { shopId: shop.id } },
        _count: true,
      }),
    ]);

    const distribution: Record<number, number> = {};
    ratingDist.forEach(r => { distribution[r.rating] = r._count; });

    return reply.send({
      success: true,
      data: {
        reviews,
        averageRating: avgRating._avg.rating || 0,
        ratingDistribution: distribution,
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  // ============================================
  // COMPETE-002: PRODUCT BOOST (Mahsulot reklama)
  // ============================================

  const boostSchema = z.object({
    productId: z.string().uuid(),
    dailyBudget: z.number().min(5000),
    totalBudget: z.number().min(10000),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  });

  app.get('/vendor/boosts', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status } = request.query as { status?: string };
    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const [boosts, total] = await Promise.all([
      prisma.productBoost.findMany({
        where,
        include: { product: { select: { id: true, name: true, images: true, price: true } } },
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

  app.post('/vendor/boosts', { preHandler: vendorAuth }, async (request, reply) => {
    const body = boostSchema.parse(request.body);
    const shop = await getVendorShop(request.user!.userId);

    // Ownership check
    const product = await prisma.product.findFirst({
      where: { id: body.productId, shopId: shop.id },
    });
    if (!product) throw new NotFoundError('Mahsulot');

    // Active boost check
    const activeBoost = await prisma.productBoost.findFirst({
      where: { productId: body.productId, status: { in: ['active', 'pending'] } },
    });
    if (activeBoost) throw new AppError('Bu mahsulot uchun allaqachon faol reklama mavjud', 400);

    // Balance check
    if (Number(shop.balance) < body.totalBudget) {
      throw new AppError(`Balans yetarli emas. Joriy balans: ${shop.balance} so'm`, 400);
    }

    const boost = await prisma.$transaction(async (tx) => {
      await tx.shop.update({
        where: { id: shop.id },
        data: { balance: { decrement: body.totalBudget } },
      });

      return tx.productBoost.create({
        data: {
          productId: body.productId,
          shopId: shop.id,
          dailyBudget: body.dailyBudget,
          totalBudget: body.totalBudget,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          status: 'pending',
        },
        include: { product: { select: { id: true, name: true, images: true } } },
      });
    });

    return reply.status(201).send({ success: true, data: boost });
  });

  app.patch('/vendor/boosts/:id/pause', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.user!.userId);

    const boost = await prisma.productBoost.findFirst({
      where: { id, shopId: shop.id, status: 'active' },
    });
    if (!boost) throw new NotFoundError('Reklama');

    const updated = await prisma.productBoost.update({
      where: { id },
      data: { status: 'paused' },
    });

    return reply.send({ success: true, data: updated });
  });

  app.patch('/vendor/boosts/:id/resume', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.user!.userId);

    const boost = await prisma.productBoost.findFirst({
      where: { id, shopId: shop.id, status: 'paused' },
    });
    if (!boost) throw new NotFoundError('Reklama');

    const updated = await prisma.productBoost.update({
      where: { id },
      data: { status: 'active' },
    });

    return reply.send({ success: true, data: updated });
  });

  app.delete('/vendor/boosts/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.user!.userId);

    const boost = await prisma.productBoost.findFirst({
      where: { id, shopId: shop.id, status: { in: ['pending', 'paused'] } },
    });
    if (!boost) throw new AppError('Faqat kutilayotgan yoki to\'xtatilgan reklamani bekor qilish mumkin', 400);

    // Refund remaining budget
    const remaining = Number(boost.totalBudget) - Number(boost.spentAmount);
    await prisma.$transaction(async (tx) => {
      if (remaining > 0) {
        await tx.shop.update({
          where: { id: shop.id },
          data: { balance: { increment: remaining } },
        });
      }
      await tx.productBoost.update({
        where: { id },
        data: { status: 'cancelled' },
      });
    });

    return reply.send({ success: true, message: 'Reklama bekor qilindi' });
  });

  // ============================================
  // COMPETE-009: VENDOR PENALTIES (Jarimalar)
  // ============================================

  app.get('/vendor/penalties', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status } = request.query as { status?: string };
    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const [penalties, total, totalAmount] = await Promise.all([
      prisma.penalty.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.penalty.count({ where }),
      prisma.penalty.aggregate({
        where: { shopId: shop.id, status: 'applied' },
        _sum: { amount: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        penalties,
        totalPenalties: Number(totalAmount._sum.amount || 0),
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  app.post('/vendor/penalties/:id/appeal', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { note } = z.object({ note: z.string().min(10, 'Kamida 10 belgi') }).parse(request.body);
    const shop = await getVendorShop(request.user!.userId);

    const penalty = await prisma.penalty.findFirst({
      where: { id, shopId: shop.id, status: { in: ['pending', 'applied'] } },
    });
    if (!penalty) throw new NotFoundError('Jarima');

    const updated = await prisma.penalty.update({
      where: { id },
      data: { status: 'appealed', appealNote: note },
    });

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // COMPETE-006: Logistics — Delivery Settings
  // ============================================

  /**
   * GET /vendor/delivery-settings
   * Yetkazib berish sozlamalari
   */
  app.get('/vendor/delivery-settings', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);

    return reply.send({
      success: true,
      data: {
        fulfillmentType: shop.fulfillmentType,
        returnPolicy: (shop as any).returnPolicy || 'standard',
        returnDays: (shop as any).returnDays || 14,
        freeDeliveryThreshold: (shop as any).freeDeliveryThreshold || null,
      },
    });
  });

  /**
   * PUT /vendor/delivery-settings
   * Yetkazib berish sozlamalarini yangilash
   */
  app.put('/vendor/delivery-settings', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);
    const body = z.object({
      fulfillmentType: z.enum(['FBS', 'DBS']).optional(),
      returnDays: z.number().min(1).max(30).optional(),
      freeDeliveryThreshold: z.number().min(0).nullable().optional(),
    }).parse(request.body);

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        ...(body.fulfillmentType && { fulfillmentType: body.fulfillmentType }),
      },
    });

    return reply.send({ success: true, data: updated });
  });

  /**
   * GET /vendor/orders/:id/tracking
   * Buyurtma kuzatuv ma'lumotlari
   */
  app.get('/vendor/orders/:id/tracking', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.user!.userId);

    const order = await prisma.order.findFirst({
      where: { id, items: { some: { shopId: shop.id } } },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        address: true,
      },
    });
    if (!order) throw new NotFoundError('Buyurtma');

    return reply.send({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        history: order.statusHistory?.map((h: any) => ({
          status: h.status,
          timestamp: h.createdAt,
          note: h.note || null,
        })) || [],
        deliveryAddress: order.address,
      },
    });
  });

  /**
   * POST /vendor/orders/:id/tracking
   * Kuzatuv ma'lumotlarini qo'shish (track raqami)
   */
  app.post('/vendor/orders/:id/tracking', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { trackingNumber, carrier } = z.object({
      trackingNumber: z.string().min(1),
      carrier: z.string().optional(),
    }).parse(request.body);

    const shop = await getVendorShop(request.user!.userId);
    const order = await prisma.order.findFirst({
      where: { id, items: { some: { shopId: shop.id } } },
    });
    if (!order) throw new NotFoundError('Buyurtma');

    const updated = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber,
        ...(carrier && { carrier }),
      },
    });

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // ADVANCED-001: AI NARX TAVSIYASI
  // ============================================

  /**
   * GET /vendor/ai/price-suggestion/:productId
   * Mahsulot uchun AI narx tavsiyasi
   */
  app.get('/vendor/ai/price-suggestion/:productId', { preHandler: vendorAuth }, async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const shop = await getVendorShop(request.user!.userId);

    const product = await prisma.product.findFirst({
      where: { id: productId, shopId: shop.id },
      include: { subcategory: { include: { category: true } } },
    });
    if (!product) throw new NotFoundError('Mahsulot');

    // Get competing products in same subcategory
    const competitors = await prisma.product.findMany({
      where: {
        subcategoryId: product.subcategoryId,
        status: 'active',
        id: { not: product.id },
      },
      select: { price: true, originalPrice: true, salesCount: true, viewCount: true, rating: true },
      orderBy: { salesCount: 'desc' },
      take: 50,
    });

    if (competitors.length === 0) {
      return reply.send({
        success: true,
        data: {
          currentPrice: product.price,
          suggestedPrice: null,
          message: 'Raqobatchilar topilmadi — narxni o\'zingiz belgilang',
          competitors: { count: 0 },
        },
      });
    }

    const prices = competitors.map(c => Number(c.originalPrice ?? c.price));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] ?? 0;

    // Weighted suggestion: products with more sales have higher weight
    const totalSold = competitors.reduce((s, c) => s + c.salesCount, 0);
    const weightedPrice = totalSold > 0
      ? competitors.reduce((s, c) => s + Number(c.originalPrice ?? c.price) * c.salesCount, 0) / totalSold
      : avgPrice;

    // Suggest a price slightly below weighted avg for competitive edge
    const suggestedPrice = Math.round(weightedPrice * 0.95 / 100) * 100;

    // Price alert: is current price competitive?
    const pricePosition = Number(product.price) <= medianPrice ? 'competitive' : Number(product.price) <= avgPrice * 1.1 ? 'average' : 'high';

    return reply.send({
      success: true,
      data: {
        currentPrice: product.price,
        suggestedPrice,
        pricePosition,
        competitors: {
          count: competitors.length,
          avgPrice: Math.round(avgPrice),
          minPrice,
          maxPrice,
          medianPrice: Math.round(medianPrice ?? 0),
          weightedAvg: Math.round(weightedPrice),
        },
        tips: pricePosition === 'high'
          ? ['Narxingiz raqobatchilardan yuqori', 'Chegirma qo\'yishni o\'ylab ko\'ring', `Tavsiya: ${suggestedPrice.toLocaleString()} so'm`]
          : pricePosition === 'competitive'
          ? ['Narxingiz raqobatbardosh', 'Sifat va xizmatga e\'tibor bering']
          : ['Narxingiz o\'rtacha darajada', 'Biroz pasaytirish savdoni oshirishi mumkin'],
      },
    });
  });

  /**
   * GET /vendor/ai/price-alerts
   * Barcha mahsulotlar uchun narx alertlari
   */
  app.get('/vendor/ai/price-alerts', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);

    const products = await prisma.product.findMany({
      where: { shopId: shop.id, status: 'active' },
      select: { id: true, name: true, price: true, originalPrice: true, subcategoryId: true, salesCount: true },
    });

    const alerts: Array<{
      productId: string;
      productName: string;
      currentPrice: number;
      avgCompetitorPrice: number;
      priceDiffPercent: number;
      alert: 'overpriced' | 'underpriced' | 'ok';
    }> = [];

    // Group by subcategory and compare
    const bySubcat = new Map<string, typeof products>();
    for (const p of products) {
      if (!p.subcategoryId) continue;
      if (!bySubcat.has(p.subcategoryId)) bySubcat.set(p.subcategoryId, []);
      bySubcat.get(p.subcategoryId)!.push(p);
    }

    for (const [subcatId, prods] of bySubcat) {
      const competitors = await prisma.product.findMany({
        where: {
          subcategoryId: subcatId,
          status: 'active',
          shopId: { not: shop.id },
        },
        select: { price: true, originalPrice: true },
        take: 30,
      });

      if (competitors.length < 3) continue;
      const avgCompPrice = competitors.reduce((s, c) => s + Number(c.originalPrice ?? c.price), 0) / competitors.length;

      for (const prod of prods) {
        const effectivePrice = Number(prod.originalPrice ?? prod.price);
        const diffPercent = ((effectivePrice - avgCompPrice) / avgCompPrice) * 100;

        if (Math.abs(diffPercent) > 15) {
          alerts.push({
            productId: prod.id,
            productName: prod.name,
            currentPrice: effectivePrice,
            avgCompetitorPrice: Math.round(avgCompPrice),
            priceDiffPercent: Math.round(diffPercent),
            alert: diffPercent > 15 ? 'overpriced' : 'underpriced',
          });
        }
      }
    }

    return reply.send({ success: true, data: alerts.sort((a, b) => Math.abs(b.priceDiffPercent) - Math.abs(a.priceDiffPercent)) });
  });

  // ============================================
  // ADVANCED-006: VENDOR MOLIYA DASHBOARD
  // ============================================

  /**
   * GET /vendor/finance/summary
   * Moliyaviy xulosa — balans, daromad, komissiya, to'lovlar
   */
  app.get('/vendor/finance/summary', { preHandler: vendorAuth }, async (request, reply) => {
    const { period } = z.object({ period: z.enum(['week', 'month', 'quarter', 'year']).default('month') }).parse(request.query);
    const shop = await getVendorShop(request.user!.userId);

    const now = new Date();
    const startDate = new Date(now);
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3);
    else startDate.setFullYear(now.getFullYear() - 1);

    const [orders, payouts, vendorTxns] = await Promise.all([
      prisma.order.findMany({
        where: { items: { some: { shopId: shop.id } }, createdAt: { gte: startDate }, status: 'delivered' },
        select: { total: true, createdAt: true },
      }),
      prisma.payout.findMany({
        where: { shopId: shop.id, createdAt: { gte: startDate } },
        select: { amount: true, status: true, createdAt: true },
      }),
      prisma.vendorTransaction.findMany({
        where: { shopId: shop.id, createdAt: { gte: startDate } },
        select: { amount: true, type: true, createdAt: true },
      }),
    ]);

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalPayoutsCompleted = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    const totalPayoutsPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
    const totalCommission = vendorTxns.filter(t => t.type === 'sale').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    // Daily breakdown for chart
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(day) || { revenue: 0, orders: 0 };
      entry.revenue += Number(order.total);
      entry.orders += 1;
      dailyMap.set(day, entry);
    }
    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return reply.send({
      success: true,
      data: {
        balance: shop.balance,
        totalRevenue,
        totalCommission,
        netRevenue: totalRevenue - totalCommission,
        totalPayoutsCompleted,
        totalPayoutsPending,
        orderCount: orders.length,
        avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
        dailyBreakdown,
      },
    });
  });

  /**
   * GET /vendor/finance/reports
   * Oylik moliyaviy hisobotlar
   */
  app.get('/vendor/finance/reports', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);

    // Get last 12 months of data
    const now = new Date();
    const reports = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [orderAgg, payoutAgg, commAgg] = await Promise.all([
        prisma.order.aggregate({
          where: { items: { some: { shopId: shop.id } }, createdAt: { gte: monthStart, lte: monthEnd }, status: 'delivered' },
          _sum: { total: true },
          _count: true,
        }),
        prisma.payout.aggregate({
          where: { shopId: shop.id, createdAt: { gte: monthStart, lte: monthEnd }, status: 'completed' },
          _sum: { amount: true },
        }),
        prisma.vendorTransaction.aggregate({
          where: { shopId: shop.id, createdAt: { gte: monthStart, lte: monthEnd }, type: 'sale' },
          _sum: { amount: true },
        }),
      ]);

      reports.push({
        month: monthStart.toISOString().slice(0, 7),
        revenue: Number(orderAgg._sum?.total ?? 0),
        orders: orderAgg._count,
        payouts: Number(payoutAgg._sum.amount ?? 0),
        commission: Math.abs(Number(commAgg._sum.amount ?? 0)),
      });
    }

    return reply.send({ success: true, data: reports });
  });
}
