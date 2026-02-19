import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';

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

    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

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

    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

    const product = await prisma.product.findFirst({
      where: { id, shopId: shop.id },
      include: {
        category: { select: { id: true, nameUz: true, nameRu: true } },
        subcategory: { select: { id: true, nameUz: true, nameRu: true } },
        brand: { select: { id: true, name: true } },
        color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
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

    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

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
    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

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

    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

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
    const { page = '1', limit = '20', status } = request.query as {
      page?: string;
      limit?: string;
      status?: string;
    };

    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.payout.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        payouts,
        balance: Number(shop.balance),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  });

  // ============================================
  // POST /vendor/payouts
  // Pul yechish so'rovi
  // ============================================
  app.post('/vendor/payouts', { preHandler: vendorAuth }, async (request, reply) => {
    const body = payoutRequestSchema.parse(request.body);

    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

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
    const { page = '1', limit = '20' } = request.query as {
      page?: string;
      limit?: string;
    };

    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total, totalCommission] = await Promise.all([
      prisma.vendorTransaction.findMany({
        where: { shopId: shop.id, type: 'sale' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
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
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  });

  // ============================================
  // GET /vendor/transactions
  // Barcha tranzaksiyalar
  // ============================================
  app.get('/vendor/transactions', { preHandler: vendorAuth }, async (request, reply) => {
    const { page = '1', limit = '20', type } = request.query as {
      page?: string;
      limit?: string;
      type?: string;
    };

    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

    const where: any = { shopId: shop.id };
    if (type) where.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      prisma.vendorTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.vendorTransaction.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  });

  /**
   * GET /vendor/reviews
   * Vendor do'koniga yozilgan sharhlar
   */
  app.get('/vendor/reviews', { preHandler: [authMiddleware, requireRole('vendor')] }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Vendor do'konini topish
    const shop = await prisma.shop.findFirst({
      where: { ownerId: request.user!.userId },
    });

    if (!shop) {
      throw new AppError('Do\'kon topilmadi', 404);
    }

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
        take: parseInt(limit),
      }),
      prisma.shopReview.count({ where: { shopId: shop.id } }),
    ]);

    return reply.send({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
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

    const shop = await prisma.shop.findFirst({
      where: { ownerId: request.user!.userId },
    });
    if (!shop) throw new NotFoundError('Do\'kon');

    // Sharh vendor do'konigami tekshirish
    const review = await prisma.shopReview.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!review) throw new NotFoundError('Sharh');

    // ShopReview modelda reply field yo'q — notification orqali javob yuborish
    // va review comment'ga vendor javobini qo'shish
    const updatedReview = await prisma.shopReview.update({
      where: { id },
      data: {
        comment: review.comment
          ? `${review.comment}\n\n💬 Sotuvchi javobi: ${replyText}`
          : `💬 Sotuvchi javobi: ${replyText}`,
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
    const skip = ((parseInt(query.page || '1') - 1) * parseInt(query.limit || '50'));
    const limit = parseInt(query.limit || '50');
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
}
