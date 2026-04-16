/**
 * Vendor Engagement Routes — Shop Reviews, Chats, Promo Codes, Delivery Settings,
 * AI Price Suggestions, API Keys, Webhooks
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, requireActiveShop } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { getVendorShop } from '../../utils/shop.js';

export async function vendorEngagementRoutes(app: FastifyInstance): Promise<void> {
  const vendorAuth = [authMiddleware, requireRole('vendor', 'admin')];
  const vendorWriteAuth = [...vendorAuth, requireActiveShop()];

  // ============================================
  // Shop Reviews
  // ============================================
  app.get('/vendor/reviews', { preHandler: [authMiddleware, requireRole('vendor')] }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);

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

  app.post('/vendor/reviews/:id/reply', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reply: replyText } = z.object({
      reply: z.string().min(1, 'Javob matnini kiriting'),
    }).parse(request.body);

    const shop = await getVendorShop(request.user!.userId);

    const review = await prisma.shopReview.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!review) throw new NotFoundError('Sharh');

    const updatedReview = await prisma.shopReview.update({
      where: { id },
      data: {
        vendorReply: replyText,
        vendorRepliedAt: new Date(),
      },
    });

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
  // Chats
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

  app.post('/vendor/chats/:id/messages', { preHandler: vendorWriteAuth }, async (request, reply) => {
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
  // Promo Codes
  // ============================================
  const vendorPromoSchema = z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minOrderAmount: z.number().min(0).optional(),
    maxUses: z.number().int().min(1).optional(),
    expiresAt: z.string().datetime().optional(),
  });

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

  app.post('/vendor/promo-codes', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const userId = request.user!.userId;
    const data = vendorPromoSchema.parse(request.body);

    const shop = await getVendorShop(userId);

    const count = await prisma.promoCode.count({ where: { shopId: shop.id } });
    if (count >= 20) throw new AppError('Maksimal 20 ta promo kod yaratish mumkin', 400);

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

  app.put('/vendor/promo-codes/:id', { preHandler: vendorWriteAuth }, async (request, reply) => {
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

  app.delete('/vendor/promo-codes/:id', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const shop = await getVendorShop(userId);

    const promo = await prisma.promoCode.findFirst({ where: { id, shopId: shop.id } });
    if (!promo) throw new NotFoundError('Promo kod');

    await prisma.promoCode.delete({ where: { id } });
    return reply.send({ success: true, message: 'Promo kod o\'chirildi' });
  });

  // ============================================
  // Delivery Settings
  // ============================================
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

  app.put('/vendor/delivery-settings', { preHandler: vendorWriteAuth }, async (request, reply) => {
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

  // ============================================
  // AI Price Suggestions
  // ============================================
  app.get('/vendor/ai/price-suggestion/:productId', { preHandler: vendorAuth }, async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const shop = await getVendorShop(request.user!.userId);

    const product = await prisma.product.findFirst({
      where: { id: productId, shopId: shop.id },
      include: { category: { include: { parent: true } } },
    });
    if (!product) throw new NotFoundError('Mahsulot');

    const competitors = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
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

    const totalSold = competitors.reduce((s, c) => s + c.salesCount, 0);
    const weightedPrice = totalSold > 0
      ? competitors.reduce((s, c) => s + Number(c.originalPrice ?? c.price) * c.salesCount, 0) / totalSold
      : avgPrice;

    const suggestedPrice = Math.round(weightedPrice * 0.95 / 100) * 100;

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

  app.get('/vendor/ai/price-alerts', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);

    const products = await prisma.product.findMany({
      where: { shopId: shop.id, status: 'active' },
      select: { id: true, name: true, price: true, originalPrice: true, categoryId: true, salesCount: true },
    });

    const alerts: Array<{
      productId: string;
      productName: string;
      currentPrice: number;
      avgCompetitorPrice: number;
      priceDiffPercent: number;
      alert: 'overpriced' | 'underpriced' | 'ok';
    }> = [];

    const byCat = new Map<string, typeof products>();
    for (const p of products) {
      if (!p.categoryId) continue;
      if (!byCat.has(p.categoryId)) byCat.set(p.categoryId, []);
      byCat.get(p.categoryId)!.push(p);
    }

    for (const [catId, prods] of byCat) {
      const competitors = await prisma.product.findMany({
        where: {
          categoryId: catId,
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
  // API Keys
  // ============================================
  app.get('/vendor/api-keys', { preHandler: vendorAuth }, async (request, reply) => {
    const keys = await prisma.apiKey.findMany({
      where: { userId: request.user!.userId },
      include: { webhooks: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const masked = keys.map(k => ({
      ...k,
      secret: k.secret.slice(0, 8) + '...',
      key: k.key.slice(0, 12) + '...',
    }));

    return reply.send({ success: true, data: masked });
  });

  app.post('/vendor/api-keys', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const count = await prisma.apiKey.count({ where: { userId: request.user!.userId } });
    if (count >= 5) {
      return reply.status(400).send({
        error: 'BadRequest',
        message: 'Maksimal 5 ta API kalit yaratishingiz mumkin',
      });
    }

    const body = z.object({
      name: z.string().min(2).max(50),
      permissions: z.array(z.string()).default(['products.read', 'orders.read']),
      rateLimit: z.number().min(100).max(5000).default(1000),
    }).parse(request.body);

    const crypto = await import('crypto');
    const key = 'tpk_' + crypto.randomBytes(24).toString('hex');
    const secret = 'tps_' + crypto.randomBytes(32).toString('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: request.user!.userId,
        name: body.name,
        key,
        secret,
        permissions: body.permissions,
        rateLimit: body.rateLimit,
      },
    });

    return reply.status(201).send({ success: true, data: { ...apiKey, key, secret } });
  });

  app.patch('/vendor/api-keys/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const apiKey = await prisma.apiKey.findFirst({ where: { id, userId: request.user!.userId } });
    if (!apiKey) throw new NotFoundError('API kalit');

    const body = z.object({
      name: z.string().min(2).max(50).optional(),
      isActive: z.boolean().optional(),
      permissions: z.array(z.string()).optional(),
    }).parse(request.body);

    const updated = await prisma.apiKey.update({ where: { id }, data: body });

    return reply.send({
      success: true,
      data: { ...updated, secret: updated.secret.slice(0, 8) + '...', key: updated.key.slice(0, 12) + '...' },
    });
  });

  app.delete('/vendor/api-keys/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const apiKey = await prisma.apiKey.findFirst({ where: { id, userId: request.user!.userId } });
    if (!apiKey) throw new NotFoundError('API kalit');

    await prisma.apiKey.delete({ where: { id } });
    return reply.send({ success: true, message: "API kalit o'chirildi" });
  });

  // ============================================
  // Webhooks
  // ============================================
  app.get('/vendor/webhooks', { preHandler: vendorAuth }, async (request, reply) => {
    const myKeyIds = await prisma.apiKey
      .findMany({ where: { userId: request.user!.userId }, select: { id: true } })
      .then(keys => keys.map(k => k.id));

    const webhooks = await prisma.webhook.findMany({
      where: { apiKeyId: { in: myKeyIds } },
      include: { apiKey: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: webhooks });
  });

  app.post('/vendor/webhooks', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const body = z.object({
      apiKeyId: z.string().uuid(),
      url: z.string().url(),
      events: z.array(z.string()).min(1),
    }).parse(request.body);

    const apiKey = await prisma.apiKey.findFirst({
      where: { id: body.apiKeyId, userId: request.user!.userId },
    });
    if (!apiKey) throw new NotFoundError('API kalit');

    const crypto = await import('crypto');
    const webhook = await prisma.webhook.create({
      data: {
        apiKeyId: body.apiKeyId,
        url: body.url,
        events: body.events,
        secret: 'whs_' + crypto.randomBytes(16).toString('hex'),
      },
    });

    return reply.status(201).send({ success: true, data: webhook });
  });

  app.delete('/vendor/webhooks/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const webhook = await prisma.webhook.findFirst({
      where: { id },
      include: { apiKey: { select: { userId: true } } },
    });
    if (!webhook || webhook.apiKey.userId !== request.user!.userId) throw new NotFoundError('Webhook');

    await prisma.webhook.delete({ where: { id } });
    return reply.send({ success: true, message: "Webhook o'chirildi" });
  });

  app.post('/vendor/webhooks/:id/test', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const webhook = await prisma.webhook.findFirst({
      where: { id },
      include: { apiKey: { select: { userId: true } } },
    });
    if (!webhook || webhook.apiKey.userId !== request.user!.userId) throw new NotFoundError('Webhook');

    const crypto = await import('crypto');
    const payload = JSON.stringify({
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from Topla.uz' },
    });
    const sig = crypto.createHmac('sha256', webhook.secret).update(payload).digest('hex');

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Topla-Signature': `sha256=${sig}`,
          'X-Topla-Event': 'test.ping',
          'X-Topla-Timestamp': new Date().toISOString(),
        },
        body: payload,
        signal: AbortSignal.timeout(8000),
      });
      return reply.send({ success: true, data: { statusCode: response.status, ok: response.ok } });
    } catch (err: any) {
      return reply.send({ success: false, data: { error: err.message } });
    }
  });

  app.get('/vendor/api-usage', { preHandler: vendorAuth }, async (request, reply) => {
    const keys = await prisma.apiKey.findMany({
      where: { userId: request.user!.userId },
      select: { id: true, name: true, key: true, lastUsedAt: true, rateLimit: true, isActive: true, createdAt: true },
    });

    return reply.send({
      success: true,
      data: keys.map(k => ({ ...k, key: k.key.slice(0, 12) + '...' })),
    });
  });
}
