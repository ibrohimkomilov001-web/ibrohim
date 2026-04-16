import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

// ============================================
// Validation Schemas
// ============================================

const addCardSchema = z.object({
  maskedPan: z.string().min(16).max(19, 'Karta raqami noto\'g\'ri'),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY').optional(),
  token: z.string().min(1, 'Token kerak'),
  provider: z.enum(['aliance', 'octobank']),
  isDefault: z.boolean().default(false),
});

const createTransactionSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().min(100),
  paymentMethod: z.enum(['cash', 'card']),
  providerTxnId: z.string().optional(),
  providerData: z.any().optional(),
});

const updateTransactionSchema = z.object({
  status: z.enum(['completed', 'failed', 'refunded']),
  providerTxnId: z.string().optional(),
  providerData: z.any().optional(),
});

const processPaymentSchema = z.object({
  orderId: z.string().uuid(),
  cardId: z.string().uuid(),
  amount: z.number().min(100),
  description: z.string().optional(),
  paymentType: z.enum(['ONE_STEP', 'TWO_STEP']).default('ONE_STEP'),
});

const initPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().min(100),
  description: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

const initBindingSchema = z.object({
  returnUrl: z.string().url().optional().nullable(),
});

const completePaymentSchema = z.object({
  transactionId: z.string().uuid(),
  amount: z.number().min(100).optional(),
});

const reverseRefundSchema = z.object({
  transactionId: z.string().uuid(),
  amount: z.number().min(100).optional(),
});

const installmentSchema = z.object({
  orderId: z.string().uuid(),
  cardId: z.string().uuid(),
  amount: z.number().min(100),
  months: z.number().min(3).max(24),
  description: z.string().optional(),
});

const payoutSchema = z.object({
  cardId: z.string().uuid(),
  amount: z.number().min(100),
  description: z.string().optional(),
});

const paymentSettingsSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
  isSecret: z.boolean().default(false),
});

// ============================================
// Helper Functions — Bank API Proxy
// ============================================

/** Bank API konfiguratsiyasini olish */
function getBankConfig(provider: 'aliance' | 'octobank') {
  if (provider === 'aliance') {
    return {
      baseUrl: env.ALIANCE_API_LOGIN ? 'https://api.aab.uz/ecom/v1' : '',
      login: env.ALIANCE_API_LOGIN || '',
      secret: env.ALIANCE_API_SECRET || '',
      webhookSecret: env.ALIANCE_WEBHOOK_SECRET || '',
      configured: !!(env.ALIANCE_API_LOGIN && env.ALIANCE_API_SECRET),
    };
  }
  return {
    baseUrl: env.OCTOBANK_API_LOGIN ? 'https://api.octobank.uz/v1' : '',
    login: env.OCTOBANK_API_LOGIN || '',
    secret: env.OCTOBANK_API_SECRET || '',
    webhookSecret: env.OCTOBANK_WEBHOOK_SECRET || '',
    configured: !!(env.OCTOBANK_API_LOGIN && env.OCTOBANK_API_SECRET),
  };
}

/** Bank API ga so'rov yuborish */
async function callBankApi(
  provider: 'aliance' | 'octobank',
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  const config = getBankConfig(provider);

  if (!config.configured) {
    return {
      success: false,
      error: `${provider} API sozlanmagan. Administrator bilan bog'laning.`,
    };
  }

  try {
    // HMAC-SHA256 signature yaratish
    const timestamp = Date.now().toString();
    const signaturePayload = `${config.login}:${timestamp}:${JSON.stringify(payload)}`;
    const signature = createHmac('sha256', config.secret)
      .update(signaturePayload)
      .digest('hex');

    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Merchant-Login': config.login,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      return {
        success: false,
        error: (data as { message?: string }).message || `Bank API xatosi: ${response.status}`,
      };
    }

    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: `Bank API ga ulanib bo'lmadi: ${(e as Error).message}`,
    };
  }
}

/** Qaysi provayderdan foydalanishni aniqlash */
function getPreferredProvider(): 'aliance' | 'octobank' {
  const aliance = getBankConfig('aliance');
  const octobank = getBankConfig('octobank');
  if (aliance.configured) return 'aliance';
  if (octobank.configured) return 'octobank';
  return 'aliance'; // default
}

/** Bo'lib to'lash foiz stavkalari */
const INSTALLMENT_RATES: Record<number, number> = {
  3: 0,      // 3 oyga — 0% foiz
  6: 2.5,    // 6 oyga — 2.5%
  9: 5.0,    // 9 oyga — 5%
  12: 8.0,   // 12 oyga — 8%
  18: 12.0,  // 18 oyga — 12%
  24: 16.0,  // 24 oyga — 16%
};

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
        maskedPan: true,
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
    const masked = body.maskedPan.replace(/\s/g, '');
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
        maskedPan: maskedNumber,
        expiryDate: body.expiryDate,
        token: encrypt(body.token), // Token shifrlangan holda saqlanadi
        provider: body.provider,
        isDefault,
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: card.id,
        maskedPan: card.maskedPan,
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
        maskedPan: true,
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
          maskedPan: true,
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
  // CARD BINDING — Bank API proxy
  // ============================================

  /**
   * POST /payments/init-binding
   * Karta binding (tokenizatsiya) jarayonini boshlash.
   * Bank API ga so'rov yuboradi va redirect URL qaytaradi.
   */
  app.post('/payments/init-binding', { preHandler: authMiddleware }, async (request, reply) => {
    const body = initBindingSchema.parse(request.body);
    const userId = request.user!.userId;
    const provider = getPreferredProvider();

    const callbackUrl = `${env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000'}/api/v1/payments/callback`;

    const result = await callBankApi(provider, '/binding/init', {
      client_id: userId,
      return_url: body.returnUrl || `${env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000'}/payment/binding-result`,
      callback_url: callbackUrl,
    });

    if (!result.success) {
      throw new AppError(result.error || 'Karta binding xatosi', 502);
    }

    return reply.send({
      success: true,
      data: {
        redirectUrl: result.data?.redirect_url || result.data?.redirectUrl,
        provider,
        bindingId: result.data?.binding_id || result.data?.transaction_id,
      },
    });
  });

  /**
   * GET /payments/binding-status/:bindingId
   * Binding natijasini tekshirish
   */
  app.get('/payments/binding-status/:bindingId', { preHandler: authMiddleware }, async (request, reply) => {
    const { bindingId } = request.params as { bindingId: string };
    const provider = getPreferredProvider();

    const result = await callBankApi(provider, '/binding/status', {
      binding_id: bindingId,
    });

    if (!result.success) {
      return reply.send({
        success: true,
        data: { status: 'pending', message: 'Kutilmoqda...' },
      });
    }

    const data = result.data || {};
    const status = data.status === 'success' || data.status === 'completed' ? 'completed' : 'pending';

    return reply.send({
      success: true,
      data: {
        status,
        bindingId: data.binding_id || bindingId,
        card: status === 'completed' ? {
          maskedPan: data.masked_pan,
          cardType: data.card_type,
          expiryDate: data.expiry_date,
        } : null,
      },
    });
  });

  // ============================================
  // PAYMENT PROCESSING — Bank API proxy
  // ============================================

  /**
   * POST /payments/process
   * Saqlangan karta bilan to'lovni amalga oshirish.
   * ONE_STEP: darhol yechish, TWO_STEP: hold qilish.
   */
  app.post('/payments/process', { preHandler: authMiddleware }, async (request, reply) => {
    const body = processPaymentSchema.parse(request.body);
    const userId = request.user!.userId;

    // Buyurtmani tekshirish
    const order = await prisma.order.findFirst({
      where: { id: body.orderId, userId },
    });
    if (!order) throw new NotFoundError('Buyurtma');
    if (order.paymentStatus === 'paid') {
      throw new AppError('Bu buyurtma allaqachon to\'langan', 400);
    }

    // Kartani tekshirish
    const card = await prisma.savedCard.findFirst({
      where: { id: body.cardId, userId },
    });
    if (!card) throw new NotFoundError('Karta');

    const provider = card.provider as 'aliance' | 'octobank';
    const cardToken = decrypt(card.token);
    const endpoint = body.paymentType === 'TWO_STEP' ? '/payment/hold' : '/payment/charge';

    // Bank API ga so'rov
    const result = await callBankApi(provider, endpoint, {
      order_id: body.orderId,
      amount: body.amount,
      currency: 860,
      binding_id: cardToken,
      description: body.description || `TOPLA buyurtma #${body.orderId.slice(0, 8)}`,
      payment_type: body.paymentType,
    });

    // Tranzaksiya yaratish
    const initialStatus = body.paymentType === 'TWO_STEP' ? 'held' : 'pending';
    const transaction = await prisma.transaction.create({
      data: {
        orderId: body.orderId,
        amount: body.amount,
        paymentMethod: 'card',
        status: initialStatus as 'pending',
        providerTxnId: (result.data?.transaction_id as string) || `txn_${Date.now()}`,
        providerData: { provider, paymentType: body.paymentType, bankResponse: result.data ?? null } as unknown as Prisma.InputJsonValue,
      },
    });

    if (!result.success) {
      // Muvaffaqiyatsiz — tranzaksiyani failed qilish
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      });
      throw new AppError(result.error || 'To\'lov rad etildi', 502);
    }

    const bankData = result.data || {};
    const bankStatus = bankData.status as string;

    // 3D Secure kerak?
    if (bankData.redirect_url || bankData.redirectUrl) {
      return reply.send({
        success: true,
        data: {
          status: 'pending_3ds',
          transactionId: transaction.id,
          redirectUrl: bankData.redirect_url || bankData.redirectUrl,
        },
      });
    }

    // Muvaffaqiyatli
    if (bankStatus === 'success' || bankStatus === 'completed' || bankStatus === 'held' || bankStatus === 'demo_mode') {
      const finalStatus = body.paymentType === 'TWO_STEP' ? 'held' : 'completed';
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: finalStatus as 'pending',
          providerTxnId: (bankData.transaction_id as string) || transaction.providerTxnId,
        },
      });

      // ONE_STEP — buyurtmani darhol "paid" qilish
      if (body.paymentType === 'ONE_STEP') {
        await prisma.order.update({
          where: { id: body.orderId },
          data: { paymentStatus: 'paid' },
        });
      }

      return reply.send({
        success: true,
        data: {
          status: finalStatus,
          transactionId: transaction.id,
          providerTxnId: bankData.transaction_id,
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        status: 'pending',
        transactionId: transaction.id,
        message: bankData.message || 'To\'lov kutilmoqda',
      },
    });
  });

  /**
   * POST /payments/init-payment
   * Yangi karta bilan to'lov (redirect flow).
   * Karta saqlanmaydi — faqat bir martalik to'lov.
   */
  app.post('/payments/init-payment', { preHandler: authMiddleware }, async (request, reply) => {
    const body = initPaymentSchema.parse(request.body);
    const userId = request.user!.userId;

    // Buyurtmani tekshirish
    const order = await prisma.order.findFirst({
      where: { id: body.orderId, userId },
    });
    if (!order) throw new NotFoundError('Buyurtma');
    if (order.paymentStatus === 'paid') {
      throw new AppError('Bu buyurtma allaqachon to\'langan', 400);
    }

    const provider = getPreferredProvider();
    const callbackUrl = `${env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000'}/api/v1/payments/callback`;

    const result = await callBankApi(provider, '/payment/init', {
      order_id: body.orderId,
      amount: body.amount,
      currency: 860,
      description: body.description || `TOPLA buyurtma #${body.orderId.slice(0, 8)}`,
      return_url: body.returnUrl || `${env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000'}/payment/result`,
      callback_url: callbackUrl,
    });

    if (!result.success) {
      throw new AppError(result.error || 'To\'lov boshlashda xatolik', 502);
    }

    // Tranzaksiya yaratish
    const transaction = await prisma.transaction.create({
      data: {
        orderId: body.orderId,
        amount: body.amount,
        paymentMethod: 'card',
        status: 'pending',
        providerTxnId: (result.data?.payment_id as string) || `txn_${Date.now()}`,
        providerData: { provider, type: 'new_card', bankResponse: result.data ?? null } as unknown as Prisma.InputJsonValue,
      },
    });

    return reply.send({
      success: true,
      data: {
        redirectUrl: result.data?.redirect_url || result.data?.redirectUrl,
        transactionId: transaction.id,
      },
    });
  });

  /**
   * POST /payments/complete
   * TWO_STEP to'lovni yakunlash (hold → capture)
   */
  app.post('/payments/complete', { preHandler: authMiddleware }, async (request, reply) => {
    const body = completePaymentSchema.parse(request.body);

    const transaction = await prisma.transaction.findUnique({
      where: { id: body.transactionId },
    });
    if (!transaction) throw new NotFoundError('Tranzaksiya');
    if (transaction.status !== ('held' as 'pending')) {
      throw new AppError('Bu tranzaksiya hold holatida emas', 400);
    }

    // Admin yoki buyurtma egasimi?
    const order = await prisma.order.findUnique({
      where: { id: transaction.orderId },
      select: { userId: true },
    });
    const isOwner = order?.userId === request.user!.userId;
    const isAdmin = request.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Ruxsat yo\'q', 403);
    }

    const providerData = transaction.providerData as Record<string, unknown>;
    const provider = (providerData?.provider || getPreferredProvider()) as 'aliance' | 'octobank';

    const result = await callBankApi(provider, '/payment/complete', {
      transaction_id: transaction.providerTxnId,
      amount: body.amount || Number(transaction.amount),
    });

    if (!result.success) {
      throw new AppError(result.error || 'Complete xatosi', 502);
    }

    await prisma.transaction.update({
      where: { id: body.transactionId },
      data: { status: 'completed' },
    });

    await prisma.order.update({
      where: { id: transaction.orderId },
      data: { paymentStatus: 'paid' },
    });

    return reply.send({
      success: true,
      data: { status: 'completed', transactionId: body.transactionId },
    });
  });

  /**
   * POST /payments/reverse
   * Hold qilingan to'lovni bekor qilish
   */
  app.post('/payments/reverse', { preHandler: authMiddleware }, async (request, reply) => {
    const body = reverseRefundSchema.parse(request.body);

    const transaction = await prisma.transaction.findUnique({
      where: { id: body.transactionId },
    });
    if (!transaction) throw new NotFoundError('Tranzaksiya');

    const order = await prisma.order.findUnique({
      where: { id: transaction.orderId },
      select: { userId: true },
    });
    const isOwner = order?.userId === request.user!.userId;
    const isAdmin = request.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Ruxsat yo\'q', 403);
    }

    const providerData = transaction.providerData as Record<string, unknown>;
    const provider = (providerData?.provider || getPreferredProvider()) as 'aliance' | 'octobank';

    const result = await callBankApi(provider, '/payment/reverse', {
      transaction_id: transaction.providerTxnId,
    });

    if (!result.success) {
      throw new AppError(result.error || 'Reverse xatosi', 502);
    }

    await prisma.transaction.update({
      where: { id: body.transactionId },
      data: { status: 'failed' }, // reversed → failed in our schema
    });

    return reply.send({
      success: true,
      data: { status: 'reversed', transactionId: body.transactionId },
    });
  });

  /**
   * POST /payments/refund
   * Yakunlangan to'lovni qaytarish
   */
  app.post('/payments/refund', { preHandler: authMiddleware }, async (request, reply) => {
    const body = reverseRefundSchema.parse(request.body);

    // Faqat admin refund qila oladi
    if (request.user!.role !== 'admin') {
      throw new AppError('Faqat admin refund qila oladi', 403);
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: body.transactionId },
    });
    if (!transaction) throw new NotFoundError('Tranzaksiya');
    if (transaction.status !== 'completed') {
      throw new AppError('Faqat yakunlangan tranzaksiyani qaytarish mumkin', 400);
    }

    const providerData = transaction.providerData as Record<string, unknown>;
    const provider = (providerData?.provider || getPreferredProvider()) as 'aliance' | 'octobank';

    const result = await callBankApi(provider, '/payment/refund', {
      transaction_id: transaction.providerTxnId,
      amount: body.amount || Number(transaction.amount),
    });

    if (!result.success) {
      throw new AppError(result.error || 'Refund xatosi', 502);
    }

    await prisma.transaction.update({
      where: { id: body.transactionId },
      data: { status: 'refunded' },
    });

    await prisma.order.update({
      where: { id: transaction.orderId },
      data: { paymentStatus: 'refunded' },
    });

    return reply.send({
      success: true,
      data: { status: 'refunded', transactionId: body.transactionId },
    });
  });

  // ============================================
  // INSTALLMENT — Bo'lib to'lash
  // ============================================

  /**
   * GET /payments/installment-plans
   * Mavjud bo'lib to'lash rejalarini hisoblash
   */
  app.get('/payments/installment-plans', { preHandler: authMiddleware }, async (request, reply) => {
    const { amount } = request.query as { amount?: string };
    const amountNum = Number(amount) || 0;

    if (amountNum < 50000) {
      return reply.send({
        success: true,
        data: [],
        message: 'Bo\'lib to\'lash minimal summasi 50,000 so\'m',
      });
    }

    const plans = Object.entries(INSTALLMENT_RATES).map(([months, rate]) => {
      const m = Number(months);
      const totalWithInterest = amountNum * (1 + rate / 100);
      const monthlyAmount = Math.ceil(totalWithInterest / m);
      return {
        id: `plan_${m}m`,
        months: m,
        monthlyAmount,
        totalAmount: Math.ceil(totalWithInterest),
        interestRate: rate,
        provider: getPreferredProvider(),
      };
    });

    return reply.send({ success: true, data: plans });
  });

  /**
   * POST /payments/installment
   * Bo'lib to'lash bilan to'lov
   */
  app.post('/payments/installment', { preHandler: authMiddleware }, async (request, reply) => {
    const body = installmentSchema.parse(request.body);
    const userId = request.user!.userId;

    // Buyurtmani tekshirish
    const order = await prisma.order.findFirst({
      where: { id: body.orderId, userId },
    });
    if (!order) throw new NotFoundError('Buyurtma');
    if (order.paymentStatus === 'paid') {
      throw new AppError('Bu buyurtma allaqachon to\'langan', 400);
    }

    // Kartani tekshirish
    const card = await prisma.savedCard.findFirst({
      where: { id: body.cardId, userId },
    });
    if (!card) throw new NotFoundError('Karta');

    const provider = card.provider as 'aliance' | 'octobank';
    const rate = INSTALLMENT_RATES[body.months] ?? 0;
    const totalAmount = body.amount * (1 + rate / 100);
    const monthlyAmount = Math.ceil(totalAmount / body.months);

    // Bank API ga installment so'rovi
    const cardToken = decrypt(card.token);
    const result = await callBankApi(provider, '/payment/installment', {
      order_id: body.orderId,
      amount: body.amount,
      currency: 860,
      binding_id: cardToken,
      months: body.months,
      description: body.description || `TOPLA bo'lib to'lash #${body.orderId.slice(0, 8)}`,
    });

    // Tranzaksiya yaratish
    const transaction = await prisma.transaction.create({
      data: {
        orderId: body.orderId,
        amount: totalAmount,
        paymentMethod: 'installment',
        status: 'pending',
        providerTxnId: (result.data?.transaction_id as string) || `inst_${Date.now()}`,
        providerData: {
          provider,
          type: 'installment',
          months: body.months,
          monthlyAmount,
          interestRate: rate,
          bankResponse: result.data ?? null,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // InstallmentPlan yaratish
    const nextPayment = new Date();
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    await prisma.installmentPlan.create({
      data: {
        orderId: body.orderId,
        cardId: body.cardId,
        totalAmount,
        monthlyAmount,
        months: body.months,
        interestRate: rate,
        paidMonths: 0,
        nextPaymentDate: nextPayment,
        status: 'active',
        provider,
        providerPlanId: (result.data?.plan_id as string) || transaction.providerTxnId,
      },
    });

    if (!result.success) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      });
      throw new AppError(result.error || 'Bo\'lib to\'lash rad etildi', 502);
    }

    const bankData = result.data || {};
    const bankStatus = bankData.status as string;

    // 3D Secure kerak?
    if (bankData.redirect_url || bankData.redirectUrl) {
      return reply.send({
        success: true,
        data: {
          status: 'pending_3ds',
          transactionId: transaction.id,
          redirectUrl: bankData.redirect_url || bankData.redirectUrl,
        },
      });
    }

    if (bankStatus === 'success' || bankStatus === 'completed' || bankStatus === 'demo_mode') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' },
      });

      await prisma.order.update({
        where: { id: body.orderId },
        data: { paymentStatus: 'paid', paymentMethod: 'installment' as 'card' },
      });

      return reply.send({
        success: true,
        data: {
          status: 'completed',
          transactionId: transaction.id,
          installment: {
            months: body.months,
            monthlyAmount,
            totalAmount: Math.ceil(totalAmount),
            interestRate: rate,
          },
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        status: 'pending',
        transactionId: transaction.id,
        message: 'Bo\'lib to\'lash kutilmoqda',
      },
    });
  });

  // ============================================
  // VENDOR PAYOUT
  // ============================================

  /**
   * POST /payments/payout
   * Vendor kartasiga pul o'tkazish
   */
  app.post('/payments/payout', { preHandler: authMiddleware }, async (request, reply) => {
    const body = payoutSchema.parse(request.body);
    const userId = request.user!.userId;

    // Vendor kartasini topish
    const card = await prisma.savedCard.findFirst({
      where: { id: body.cardId, userId },
    });
    if (!card) throw new NotFoundError('Karta');

    const provider = card.provider as 'aliance' | 'octobank';

    // Payout yaratish
    const payout = await prisma.payout.create({
      data: {
        shopId: userId, // vendor = user
        amount: body.amount,
        status: 'pending',
        cardNumber: card.maskedPan,
      },
    });

    // Bank API ga payout so'rovi
    const result = await callBankApi(provider, '/payout/card', {
      payout_id: payout.id,
      card_token: decrypt(card.token),
      amount: body.amount,
      currency: 860,
      description: body.description || `TOPLA payout #${payout.id.slice(0, 8)}`,
    });

    if (!result.success) {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'failed' },
      });
      throw new AppError(result.error || 'Payout rad etildi', 502);
    }

    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: 'completed', processedAt: new Date() },
    });

    return reply.send({
      success: true,
      data: {
        status: 'processing',
        payoutId: payout.id,
      },
    });
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

    if (!isAdmin && (body.status === 'completed' || body.status === 'refunded')) {
      throw new AppError('Faqat administrator to\'lov statusini tasdiqlashi mumkin', 403);
    }

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

    if (body.status === 'completed') {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { paymentStatus: 'paid' },
      });
    }

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

  /**
   * GET /payments/transactions/status/:transactionId
   * Tranzaksiya holatini tekshirish (polling uchun)
   */
  app.get('/payments/transactions/status/:transactionId', { preHandler: authMiddleware }, async (request, reply) => {
    const { transactionId } = request.params as { transactionId: string };

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundError('Tranzaksiya');

    return reply.send({
      success: true,
      data: {
        status: transaction.status,
        transactionId: transaction.id,
        amount: transaction.amount,
        updatedAt: transaction.updatedAt,
      },
    });
  });

  // ============================================
  // PAYMENT SETTINGS — Admin
  // ============================================

  /**
   * GET /payments/settings
   * To'lov tizimi sozlamalarini olish (admin)
   */
  app.get('/payments/settings', { preHandler: authMiddleware }, async (request, reply) => {
    if (request.user!.role !== 'admin') {
      throw new AppError('Ruxsat yo\'q', 403);
    }

    const settings = await prisma.paymentSettings.findMany({
      orderBy: { key: 'asc' },
    });

    // Secret qiymatlarni yashirish
    const safeSettings = settings.map(s => ({
      ...s,
      value: s.isSecret ? '***' : s.value,
    }));

    // Bank konfiguratsiya holati
    const alianceConfigured = getBankConfig('aliance').configured;
    const octobankConfigured = getBankConfig('octobank').configured;

    return reply.send({
      success: true,
      data: {
        settings: safeSettings,
        providers: {
          aliance: { configured: alianceConfigured, name: 'Aliance Bank' },
          octobank: { configured: octobankConfigured, name: 'Octobank' },
        },
        installmentRates: INSTALLMENT_RATES,
      },
    });
  });

  /**
   * POST /payments/settings
   * To'lov sozlamasini qo'shish/yangilash (admin)
   */
  app.post('/payments/settings', { preHandler: authMiddleware }, async (request, reply) => {
    if (request.user!.role !== 'admin') {
      throw new AppError('Ruxsat yo\'q', 403);
    }

    const body = paymentSettingsSchema.parse(request.body);

    const setting = await prisma.paymentSettings.upsert({
      where: { key: body.key },
      update: {
        value: body.isSecret ? encrypt(body.value) : body.value,
        description: body.description,
        isSecret: body.isSecret,
      },
      create: {
        key: body.key,
        value: body.isSecret ? encrypt(body.value) : body.value,
        description: body.description,
        isSecret: body.isSecret,
      },
    });

    return reply.send({
      success: true,
      data: {
        ...setting,
        value: setting.isSecret ? '***' : setting.value,
      },
    });
  });

  /**
   * DELETE /payments/settings/:key
   * To'lov sozlamasini o'chirish (admin)
   */
  app.delete('/payments/settings/:key', { preHandler: authMiddleware }, async (request, reply) => {
    if (request.user!.role !== 'admin') {
      throw new AppError('Ruxsat yo\'q', 403);
    }

    const { key } = request.params as { key: string };

    const setting = await prisma.paymentSettings.findUnique({
      where: { key },
    });
    if (!setting) throw new NotFoundError('Sozlama');

    await prisma.paymentSettings.delete({ where: { key } });

    return reply.send({ success: true });
  });

  // ============================================
  // PAYMENT CALLBACK (webhook)
  // ============================================

  /**
   * POST /payments/callback
   * Bank webhook callback (Aliance/Octobank)
   * HMAC-SHA256 signature orqali himoyalangan
   */
  app.post('/payments/callback', {
    config: {
      rateLimit: {
        max: 60,        // 1 daqiqada 60 ta so'rov
        timeWindow: 60000,
      },
    },
  }, async (request, reply) => {
    // IP whitelist tekshiruvi
    const allowedIPs = (env.PAYMENT_WEBHOOK_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
    if (allowedIPs.length > 0) {
      const clientIP = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || request.headers['x-real-ip'] as string
        || request.ip;
      if (!allowedIPs.includes(clientIP)) {
        request.log.warn({ clientIP, allowedIPs }, 'Payment webhook: ruxsatsiz IP manzil');
        throw new AppError('Ruxsat berilmagan IP manzil', 403);
      }
    }

    const callbackSchema = z.object({
      provider: z.enum(['aliance', 'octobank']),
      transactionId: z.string().min(1),
      status: z.string().min(1),
      providerTxnId: z.string().optional(),
      amount: z.number().optional(),
      signature: z.string().optional(),
      // Card binding callback fields
      bindingId: z.string().optional(),
      maskedPan: z.string().optional(),
      cardType: z.string().optional(),
      expiryDate: z.string().optional(),
      clientId: z.string().optional(), // userId
    });

    const body = callbackSchema.parse(request.body);
    const { provider, transactionId, status, providerTxnId, amount, signature } = body;

    // Signature tekshiruvi
    const webhookSecret = provider === 'aliance'
      ? env.ALIANCE_WEBHOOK_SECRET
      : env.OCTOBANK_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
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
    }

    // Card binding callback?
    if (body.bindingId && body.clientId && body.maskedPan) {
      // Karta avtomatik saqlanadi
      const existingCard = await prisma.savedCard.findFirst({
        where: {
          userId: body.clientId,
          token: encrypt(body.bindingId),
        },
      });

      if (!existingCard) {
        const cardCount = await prisma.savedCard.count({
          where: { userId: body.clientId },
        });

        await prisma.savedCard.create({
          data: {
            userId: body.clientId,
            maskedPan: body.maskedPan,
            expiryDate: body.expiryDate,
            token: encrypt(body.bindingId),
            provider,
            isDefault: cardCount === 0,
          },
        });
      }

      return reply.send({ success: true, type: 'binding' });
    }

    // Payment callback
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      // providerTxnId bo'yicha qidirish
      const byProviderTxn = await prisma.transaction.findFirst({
        where: { providerTxnId: transactionId },
      });
      if (!byProviderTxn) throw new NotFoundError('Tranzaksiya');
    }

    const txn = transaction || await prisma.transaction.findFirst({
      where: { providerTxnId: transactionId },
    });
    if (!txn) throw new NotFoundError('Tranzaksiya');

    if (amount && Number(txn.amount) !== amount) {
      throw new AppError('Summa mos kelmaydi');
    }

    const newStatus = status === 'success' || status === 'completed' ? 'completed' : 'failed';

    await prisma.transaction.update({
      where: { id: txn.id },
      data: {
        status: newStatus,
        providerTxnId: providerTxnId || txn.providerTxnId,
        providerData: { provider, rawStatus: status, receivedAt: new Date().toISOString() },
      },
    });

    if (newStatus === 'completed') {
      await prisma.order.update({
        where: { id: txn.orderId },
        data: { paymentStatus: 'paid' },
      });
    }

    return reply.send({ success: true });
  });
}
