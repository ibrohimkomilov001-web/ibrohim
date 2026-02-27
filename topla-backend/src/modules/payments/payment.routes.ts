import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { AppError, NotFoundError } from '../../middleware/error.js';

// ============================================
// Validation Schemas
// ============================================

const addCardSchema = z.object({
  cardNumber: z.string().min(16).max(19, 'Karta raqami noto\'g\'ri'),
  cardHolder: z.string().optional(),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY').optional(),
  token: z.string().min(1, 'Token kerak'),
  provider: z.enum(['payme', 'click']),
  isDefault: z.boolean().default(false),
});

const createTransactionSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().min(100),
  paymentMethod: z.enum(['cash', 'card', 'payme', 'click']),
  providerTxnId: z.string().optional(),
  providerData: z.any().optional(),
});

const updateTransactionSchema = z.object({
  status: z.enum(['completed', 'failed', 'refunded']),
  providerTxnId: z.string().optional(),
  providerData: z.any().optional(),
});

// ============================================
// Routes
// ============================================

export async function paymentRoutes(app: FastifyInstance): Promise<void> {

  // ============================================
  // SAVED CARDS
  // ============================================

  /**
   * GET /payments/cards
   * Saqlangan kartalar ro'yxati
   */
  app.get('/payments/cards', { preHandler: authMiddleware }, async (request, reply) => {
    const cards = await prisma.savedCard.findMany({
      where: { userId: request.user!.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        cardNumber: true,
        cardHolder: true,
        expiryDate: true,
        provider: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return reply.send({ success: true, data: cards });
  });

  /**
   * POST /payments/cards
   * Karta qo'shish
   */
  app.post('/payments/cards', { preHandler: authMiddleware }, async (request, reply) => {
    const body = addCardSchema.parse(request.body);
    const userId = request.user!.userId;

    // Maskalashtirish: **** **** **** 1234
    const masked = body.cardNumber.replace(/\s/g, '');
    const maskedNumber = `**** **** **** ${masked.slice(-4)}`;

    // Agar isDefault bo'lsa, boshqa kartalarni default emas qilish
    if (body.isDefault) {
      await prisma.savedCard.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Birinchi kartami? Avtomatik default
    const cardCount = await prisma.savedCard.count({ where: { userId } });
    const isDefault = body.isDefault || cardCount === 0;

    const card = await prisma.savedCard.create({
      data: {
        userId,
        cardNumber: maskedNumber,
        cardHolder: body.cardHolder,
        expiryDate: body.expiryDate,
        token: body.token,
        provider: body.provider,
        isDefault,
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: card.id,
        cardNumber: card.cardNumber,
        cardHolder: card.cardHolder,
        expiryDate: card.expiryDate,
        provider: card.provider,
        isDefault: card.isDefault,
      },
    });
  });

  /**
   * GET /payments/cards/default
   * Asosiy kartani olish
   */
  app.get('/payments/cards/default', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    const card = await prisma.savedCard.findFirst({
      where: { userId, isDefault: true },
      select: {
        id: true,
        cardNumber: true,
        cardHolder: true,
        expiryDate: true,
        provider: true,
        isDefault: true,
        createdAt: true,
      },
    });

    if (!card) {
      // Agar default yo'q bo'lsa, birinchi kartani qaytarish
      const firstCard = await prisma.savedCard.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          cardNumber: true,
          cardHolder: true,
          expiryDate: true,
          provider: true,
          isDefault: true,
          createdAt: true,
        },
      });

      if (!firstCard) throw new NotFoundError('Karta topilmadi');
      return reply.send({ success: true, data: firstCard });
    }

    return reply.send({ success: true, data: card });
  });

  /**
   * DELETE /payments/cards/:id
   * Kartani o'chirish
   */
  app.delete('/payments/cards/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const card = await prisma.savedCard.findFirst({
      where: { id, userId },
    });

    if (!card) throw new NotFoundError('Karta');

    await prisma.savedCard.delete({ where: { id } });

    // Agar o'chirilgan karta default bo'lsa, birinchi kartani default qilish
    if (card.isDefault) {
      const first = await prisma.savedCard.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      if (first) {
        await prisma.savedCard.update({
          where: { id: first.id },
          data: { isDefault: true },
        });
      }
    }

    return reply.send({ success: true });
  });

  /**
   * PUT /payments/cards/:id/default
   * Kartani default qilish
   */
  app.put('/payments/cards/:id/default', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const card = await prisma.savedCard.findFirst({
      where: { id, userId },
    });

    if (!card) throw new NotFoundError('Karta');

    // Boshqa kartalarni default emas qilish
    await prisma.savedCard.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Tanlangan kartani default qilish
    await prisma.savedCard.update({
      where: { id },
      data: { isDefault: true },
    });

    return reply.send({ success: true });
  });

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * POST /payments/transactions
   * Tranzaksiya yaratish (to'lov boshlash)
   */
  app.post('/payments/transactions', { preHandler: authMiddleware }, async (request, reply) => {
    const body = createTransactionSchema.parse(request.body);

    // Buyurtmani tekshirish
    const order = await prisma.order.findFirst({
      where: { id: body.orderId, userId: request.user!.userId },
    });

    if (!order) throw new NotFoundError('Buyurtma');

    if (order.paymentStatus === 'paid') {
      throw new AppError('Bu buyurtma allaqachon to\'langan');
    }

    const transaction = await prisma.transaction.create({
      data: {
        orderId: body.orderId,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        status: 'pending',
        providerTxnId: body.providerTxnId,
        providerData: body.providerData || undefined,
      },
    });

    return reply.status(201).send({ success: true, data: transaction });
  });

  /**
   * PUT /payments/transactions/:id
   * Tranzaksiya statusini yangilash
   * 
   * XAVFSIZLIK: Foydalanuvchi faqat 'failed' (bekor qilish) ga o'zgartira oladi.
   * 'completed' va 'refunded' statuslari FAQAT admin yoki webhook callback orqali o'zgartiriladi.
   */
  app.put('/payments/transactions/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateTransactionSchema.parse(request.body);

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) throw new NotFoundError('Tranzaksiya');

    // Ownership tekshiruvi
    const order = await prisma.order.findUnique({
      where: { id: transaction.orderId },
      select: { userId: true },
    });
    
    const isOwner = order?.userId === request.user!.userId;
    const isAdmin = request.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Bu tranzaksiyani o\'zgartirish huquqingiz yo\'q', 403);
    }

    // XAVFSIZLIK: Faqat admin 'completed' yoki 'refunded' ga o'zgartira oladi
    // Oddiy foydalanuvchi faqat 'failed' (bekor qilish) qila oladi
    if (!isAdmin && (body.status === 'completed' || body.status === 'refunded')) {
      throw new AppError('Faqat administrator to\'lov statusini tasdiqlashi mumkin', 403);
    }

    // Allaqachon completed/refunded tranzaksiyani o'zgartirib bo'lmaydi
    if (transaction.status === 'completed' || transaction.status === 'refunded') {
      throw new AppError('Yakunlangan tranzaksiyani o\'zgartirish mumkin emas', 400);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: body.status,
        providerTxnId: body.providerTxnId || transaction.providerTxnId,
        providerData: body.providerData || transaction.providerData,
      },
    });

    // Agar to'lov muvaffaqiyatli bo'lsa — buyurtma paymentStatus ni yangilash (faqat admin)
    if (body.status === 'completed') {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { paymentStatus: 'paid' },
      });
    }

    // Agar qaytarilsa (refund) — faqat admin
    if (body.status === 'refunded') {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { paymentStatus: 'refunded' },
      });
    }

    return reply.send({ success: true, data: updated });
  });

  /**
   * GET /payments/transactions/:orderId
   * Buyurtma tranzaksiyalari
   */
  app.get('/payments/transactions/:orderId', { preHandler: authMiddleware }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };

    // Foydalanuvchining buyurtmasi ekanini tekshirish
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: request.user!.userId },
    });

    if (!order) throw new NotFoundError('Buyurtma');

    const transactions = await prisma.transaction.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: transactions });
  });

  // ============================================
  // PAYMENT CALLBACK (webhook)
  // ============================================

  /**
   * POST /payments/callback
   * To'lov tizimi callback (Payme/Click)
   * Webhook secret orqali himoyalangan
   */
  app.post('/payments/callback', async (request, reply) => {
    // Webhook body validation
    const callbackSchema = z.object({
      provider: z.enum(['payme', 'click']),
      transactionId: z.string().min(1),
      status: z.string().min(1),
      providerTxnId: z.string().optional(),
      amount: z.number().optional(),
      signature: z.string().optional(),
    });

    const body = callbackSchema.parse(request.body);
    const { provider, transactionId, status, providerTxnId, amount, signature } = body;

    // Provider secret tekshiruvi
    const webhookSecret = provider === 'payme'
      ? env.PAYME_WEBHOOK_SECRET
      : env.CLICK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      // Webhook secret barcha muhitlarda majburiy — xavfsizlik uchun
      throw new AppError('Webhook secret sozlanmagan. PAYME_WEBHOOK_SECRET yoki CLICK_WEBHOOK_SECRET o\'rnating.', 500);
    }

    // Signature tekshiruvi: HMAC-SHA256(transactionId + status + amount, secret)
    if (!signature) {
      throw new AppError('Webhook signature kerak', 401);
    }
    const expectedPayload = `${transactionId}:${status}:${amount || ''}`;
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(expectedPayload)
      .digest('hex');
    
    try {
      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
        throw new AppError('Webhook signature yaroqsiz', 401);
      }
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError('Webhook signature yaroqsiz', 401);
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new NotFoundError('Tranzaksiya');

    // Summani tekshirish (agar kelgan bo'lsa)
    if (amount && Number(transaction.amount) !== amount) {
      throw new AppError('Summa mos kelmaydi');
    }

    const newStatus = status === 'success' || status === 'completed' ? 'completed' : 'failed';

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus,
        providerTxnId: providerTxnId || transaction.providerTxnId,
        providerData: { provider, rawStatus: status, receivedAt: new Date().toISOString() },
      },
    });

    // Buyurtma paymentStatus yangilash
    if (newStatus === 'completed') {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { paymentStatus: 'paid' },
      });
    }

    return reply.send({ success: true });
  });
}
