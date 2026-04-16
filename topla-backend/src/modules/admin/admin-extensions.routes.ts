/**
 * Admin Extensions Routes — Lucky Wheel, Referrals, Promotions, Penalties,
 * Moderation Queue, Boosts, RBAC, Advanced Analytics, Loyalty, API Keys, FAQ, Reviews
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, requirePermission } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';

export async function adminExtensionsRoutes(app: FastifyInstance) {
  // ============================================
  // LUCKY WHEEL ADMIN
  // ============================================
  app.get('/admin/lucky-wheel', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const prizes = await prisma.luckyWheelPrize.findMany({ orderBy: { sortOrder: 'asc' } });

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
          totalSpins, todaySpins, totalWinners,
          totalPrizes: prizes.length,
          activePrizes: prizes.filter(p => p.isActive).length,
        },
      },
    });
  });

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
        nameUz: data.nameUz, nameRu: data.nameRu, type: data.type,
        value: data.value ?? null, probability: data.probability, color: data.color,
        imageUrl: data.imageUrl ?? null, promoCodePrefix: data.promoCodePrefix ?? null,
        stock: data.stock ?? null, sortOrder: data.sortOrder, isActive: data.isActive,
      },
    });

    return reply.status(201).send({ success: true, data: prize });
  });

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
    const prize = await prisma.luckyWheelPrize.update({ where: { id }, data });
    return reply.send({ success: true, data: prize });
  });

  app.delete('/admin/lucky-wheel/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    await prisma.luckyWheelPrize.delete({ where: { id } });
    return reply.send({ success: true });
  });

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
        orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: {
          user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
          prize: { select: { nameUz: true, nameRu: true, type: true, value: true, color: true } },
        },
      }),
      prisma.luckyWheelSpin.count(),
    ]);

    return reply.send({
      success: true,
      data: { spins, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  });

  // ============================================
  // REFERRAL ADMIN
  // ============================================
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
        orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: {
          referrer: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
          referred: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
        },
      }),
      prisma.referral.count(),
      prisma.referral.count({ where: { referrerPaid: true } }),
      prisma.referral.aggregate({ where: { referrerPaid: true }, _sum: { bonusAmount: true } }),
    ]);

    let bonusAmount = 50000;
    try {
      const setting = await prisma.adminSetting.findUnique({ where: { key: 'referral_bonus_amount' } });
      if (setting) bonusAmount = parseFloat(setting.value) || 50000;
    } catch {}

    return reply.send({
      success: true,
      data: {
        referrals,
        stats: {
          totalReferrals: total, totalPaidBonuses: totalPaid,
          totalBonusAmount: totalBonusSum._sum.bonusAmount || 0, currentBonusAmount: bonusAmount,
        },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  });

  app.put('/admin/referral-settings', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const settingsSchema = z.object({ bonusAmount: z.number().min(0).max(10000000).optional() });
    const body = settingsSchema.parse(request.body);

    if (body.bonusAmount !== undefined) {
      await prisma.adminSetting.upsert({
        where: { key: 'referral_bonus_amount' },
        update: { value: body.bonusAmount.toString() },
        create: { key: 'referral_bonus_amount', value: body.bonusAmount.toString() },
      });
    }

    return reply.send({ success: true, message: 'Referral sozlamalari yangilandi' });
  });

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

    const referral = await prisma.referral.update({ where: { id }, data: body });
    return reply.send({ success: true, data: referral });
  });

  // ============================================
  // REFERRAL REWARDS
  // ============================================
  app.get('/admin/referral-rewards', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const rewards = await prisma.referralReward.findMany({ orderBy: { pointsCost: 'asc' } });
    return reply.send({ success: true, data: rewards });
  });

  app.post('/admin/referral-rewards', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const schema = z.object({
      nameUz: z.string().min(1), nameRu: z.string().min(1),
      description: z.string().optional().nullable(),
      pointsCost: z.number().int().min(1),
      type: z.enum(['promo_fixed', 'promo_percent', 'free_delivery', 'physical_gift']),
      value: z.number().optional(), imageUrl: z.string().optional(),
      stock: z.number().int().min(0).optional().nullable(),
      isActive: z.boolean().default(true),
    });
    const body = schema.parse(request.body);
    const reward = await prisma.referralReward.create({ data: body as any });
    return reply.status(201).send({ success: true, data: reward });
  });

  app.put('/admin/referral-rewards/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const schema = z.object({
      nameUz: z.string().min(1).optional(), nameRu: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      pointsCost: z.number().int().min(1).optional(),
      type: z.enum(['promo_fixed', 'promo_percent', 'free_delivery', 'physical_gift']).optional(),
      value: z.number().optional().nullable(), imageUrl: z.string().optional().nullable(),
      stock: z.number().int().min(0).optional().nullable(),
      isActive: z.boolean().optional(),
    });
    const body = schema.parse(request.body);
    const reward = await prisma.referralReward.update({ where: { id }, data: body as any });
    return reply.send({ success: true, data: reward });
  });

  app.delete('/admin/referral-rewards/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    await prisma.referralReward.delete({ where: { id } });
    return reply.send({ success: true, message: 'Sovg\'a o\'chirildi' });
  });

  // ============================================
  // REFERRAL CLAIMS
  // ============================================
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
        where, orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: {
          profile: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
          reward: { select: { id: true, nameUz: true, type: true, value: true, pointsCost: true } },
        },
      }),
      prisma.referralRewardClaim.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: { claims, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  });

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
      await prisma.$transaction(async (tx) => {
        await tx.referralRewardClaim.update({ where: { id }, data: { status: 'cancelled' } });
        await tx.profile.update({
          where: { id: claim.profileId },
          data: { referralPoints: { increment: claim.pointsSpent } },
        });
        if (claim.reward.stock !== null) {
          await tx.referralReward.update({
            where: { id: claim.rewardId },
            data: { stock: { increment: 1 } },
          });
        }
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
      await prisma.referralRewardClaim.update({ where: { id }, data: { status: 'fulfilled' } });
    }

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
    return reply.send({ success: true, message: 'Referral ball sozlamalari yangilandi' });
  });

  // ============================================
  // CATEGORY COMMISSIONS
  // ============================================
  app.get('/admin/category-commissions', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const commissions = await prisma.categoryCommission.findMany({
      include: { category: { select: { id: true, nameUz: true, nameRu: true } } },
      orderBy: { category: { nameUz: 'asc' } },
    });

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
  // PROMOTIONS / CAMPAIGNS
  // ============================================
  const promotionSchema = z.object({
    nameUz: z.string().min(2), nameRu: z.string().min(2),
    descriptionUz: z.string().optional(), descriptionRu: z.string().optional(),
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
      prisma.promotion.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.promotion.count({ where }),
    ]);

    return reply.send({ success: true, data: { promotions, meta: paginationMeta(page, limit, total) } });
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

    const promotion = await prisma.promotion.update({ where: { id }, data: { status } });
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
  // PENALTIES
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
        orderBy: { createdAt: 'desc' }, skip, take: limit,
      }),
      prisma.penalty.count({ where }),
      prisma.penalty.aggregate({ where: { status: 'applied' }, _sum: { amount: true } }),
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
        shopId: body.shopId, orderId: body.orderId,
        type: body.type, amount: body.amount,
        reason: body.reason, description: body.description,
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
    const { status } = z.object({ status: z.enum(['applied', 'cancelled']) }).parse(request.body);

    const penalty = await prisma.penalty.findUnique({ where: { id } });
    if (!penalty) throw new NotFoundError('Jarima');

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.penalty.update({
        where: { id },
        data: { status, resolvedBy: request.user!.userId, resolvedAt: new Date() },
      });

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
  // MODERATION QUEUE
  // ============================================
  app.get('/admin/moderation-queue', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status, search } = request.query as { status?: string; search?: string };

    const where: any = {};
    if (status) { where.status = status; } else { where.status = 'on_review'; }

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
          moderationLogs: { take: 3, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'asc' },
        skip, take: limit,
      }),
      prisma.product.count({ where }),
      prisma.product.count({ where: { status: 'on_review' } }),
      prisma.product.groupBy({ by: ['status'], _count: true }),
    ]);

    const statusCounts: Record<string, number> = {};
    allCounts.forEach(c => { statusCounts[c.status] = c._count; });

    return reply.send({
      success: true,
      data: { products, pendingCount, statusCounts, meta: paginationMeta(page, limit, total) },
    });
  });

  // ============================================
  // PRODUCT BOOST MANAGEMENT
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
        orderBy: { createdAt: 'desc' }, skip, take: limit,
      }),
      prisma.productBoost.count({ where }),
    ]);

    return reply.send({ success: true, data: { boosts, meta: paginationMeta(page, limit, total) } });
  });

  app.patch('/admin/boosts/:id/approve', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const boost = await prisma.productBoost.findUnique({ where: { id } });
    if (!boost) throw new NotFoundError('Reklama');
    const updated = await prisma.productBoost.update({ where: { id }, data: { status: 'active' } });
    return reply.send({ success: true, data: updated });
  });

  app.patch('/admin/boosts/:id/reject', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const boost = await prisma.productBoost.findUnique({ where: { id } });
    if (!boost) throw new NotFoundError('Reklama');

    const remaining = Number(boost.totalBudget) - Number(boost.spentAmount);
    await prisma.$transaction(async (tx) => {
      if (remaining > 0) {
        await tx.shop.update({
          where: { id: boost.shopId },
          data: { balance: { increment: remaining } },
        });
      }
      await tx.productBoost.update({ where: { id }, data: { status: 'cancelled' } });
    });

    return reply.send({ success: true, message: 'Reklama rad etildi, mablag\' qaytarildi' });
  });

  // ============================================
  // ADMIN RBAC
  // ============================================
  app.get('/admin/roles', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('roles.manage')],
  }, async (request, reply) => {
    const roles = await prisma.adminRole.findMany({
      include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true } } },
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

    const currentRole = await prisma.adminRole.findUnique({ where: { userId: request.user!.userId } });
    if (userId === request.user!.userId && currentRole?.level === 'super_admin' && body.level !== 'super_admin') {
      throw new AppError('O\'z super_admin rolingizni o\'zgartira olmaysiz', 400);
    }

    const role = await prisma.adminRole.upsert({
      where: { userId },
      update: { level: body.level, permissions: body.permissions || [] },
      create: { userId, level: body.level, permissions: body.permissions || [] },
      include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
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
  // ADVANCED ANALYTICS
  // ============================================
  app.get('/admin/analytics/heatmap', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { period } = z.object({ period: z.enum(['week', 'month', 'quarter']).default('month') }).parse(request.query);

    const now = new Date();
    const startDate = new Date(now);
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else startDate.setMonth(now.getMonth() - 3);

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

  app.get('/admin/analytics/cohort', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const months = 6;
    const cohorts = [];

    for (let i = months - 1; i >= 0; i--) {
      const cohortStart = new Date();
      cohortStart.setMonth(cohortStart.getMonth() - i, 1);
      cohortStart.setHours(0, 0, 0, 0);
      const cohortEnd = new Date(cohortStart);
      cohortEnd.setMonth(cohortEnd.getMonth() + 1);

      const firstOrders = await prisma.order.findMany({
        where: { createdAt: { gte: cohortStart, lt: cohortEnd } },
        select: { userId: true },
        distinct: ['userId'],
      });

      const userIds = firstOrders.map(o => o.userId);
      const previousBuyers = userIds.length > 0
        ? await prisma.order.findMany({
            where: { userId: { in: userIds }, createdAt: { lt: cohortStart } },
            select: { userId: true },
            distinct: ['userId'],
          })
        : [];
      const previousSet = new Set(previousBuyers.map(p => p.userId));
      const newUsers = userIds.filter(id => !previousSet.has(id));

      const retention: number[] = [];
      for (let j = 1; j <= months - i - 1 && j <= 5; j++) {
        const retStart = new Date(cohortStart);
        retStart.setMonth(retStart.getMonth() + j);
        const retEnd = new Date(retStart);
        retEnd.setMonth(retEnd.getMonth() + 1);

        if (newUsers.length === 0) { retention.push(0); continue; }

        const returned = await prisma.order.findMany({
          where: { userId: { in: newUsers }, createdAt: { gte: retStart, lt: retEnd } },
          select: { userId: true },
          distinct: ['userId'],
        });
        retention.push(Math.round((returned.length / newUsers.length) * 100));
      }

      cohorts.push({ month: cohortStart.toISOString().slice(0, 7), newUsers: newUsers.length, retention });
    }

    return reply.send({ success: true, data: cohorts });
  });

  // ============================================
  // A/B TESTS
  // ============================================
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
        name: body.name, description: body.description,
        testType: body.testType, variants: body.variants as any,
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

    const test = await prisma.aBTest.update({ where: { id }, data: body as any });
    return reply.send({ success: true, data: test });
  });

  // ============================================
  // LOYALTY SYSTEM
  // ============================================
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
        skip, take: limit,
      }),
      prisma.loyaltyAccount.count({ where }),
    ]);

    return reply.send({ success: true, data: accounts, meta: paginationMeta(total, page, limit) });
  });

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

  app.get('/admin/loyalty/stats', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const [total, byTier, totalPoints] = await Promise.all([
      prisma.loyaltyAccount.count(),
      prisma.loyaltyAccount.groupBy({ by: ['tier'], _count: true }),
      prisma.loyaltyAccount.aggregate({ _sum: { availablePoints: true, lifetimePoints: true } }),
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
  // API MARKETPLACE
  // ============================================
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
        userId: body.userId, name: body.name,
        key, secret,
        permissions: body.permissions, rateLimit: body.rateLimit,
      },
    });

    return reply.send({ success: true, data: { ...apiKey, key, secret } });
  });

  app.delete('/admin/api-keys/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.apiKey.delete({ where: { id } });
    return reply.send({ success: true, message: 'API kalit o\'chirildi' });
  });

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
        apiKeyId: body.apiKeyId, url: body.url, events: body.events,
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
  // FAQ BOT
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
  // REVIEW MODERATION
  // ============================================
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
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, nameUz: true, nameRu: true, images: true } },
          user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
        },
      }),
      prisma.productReview.count({ where }),
    ]);

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
        where, skip, take: limit,
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

  app.delete('/admin/reviews/shops/:id', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermission('moderation.manage')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const review = await prisma.shopReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundError('Sharh topilmadi');

    await prisma.shopReview.delete({ where: { id } });

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
