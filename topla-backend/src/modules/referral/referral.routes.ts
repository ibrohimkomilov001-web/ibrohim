import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { randomInt } from 'crypto';
import { createNotification } from '../notifications/notification.service.js';

// ============================================
// Helpers
// ============================================

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TOPLA';
  for (let i = 0; i < 5; i++) {
    code += chars[randomInt(0, chars.length)];
  }
  return code;
}

// Ball miqdorlari (AdminSetting dan olinadi, default qiymatlar)
const DEFAULT_REGISTRATION_POINTS = 10;
const DEFAULT_PURCHASE_POINTS = 5;
const DEFAULT_MIN_PURCHASE = 100000;

async function getPointSettings() {
  let registrationPoints = DEFAULT_REGISTRATION_POINTS;
  let purchasePoints = DEFAULT_PURCHASE_POINTS;
  let minPurchaseAmount = DEFAULT_MIN_PURCHASE;
  try {
    const [regSetting, purchSetting, minSetting] = await Promise.all([
      prisma.adminSetting.findUnique({ where: { key: 'referral_registration_points' } }),
      prisma.adminSetting.findUnique({ where: { key: 'referral_purchase_points' } }),
      prisma.adminSetting.findUnique({ where: { key: 'referral_min_purchase' } }),
    ]);
    if (regSetting) registrationPoints = parseInt(regSetting.value) || DEFAULT_REGISTRATION_POINTS;
    if (purchSetting) purchasePoints = parseInt(purchSetting.value) || DEFAULT_PURCHASE_POINTS;
    if (minSetting) minPurchaseAmount = parseInt(minSetting.value) || DEFAULT_MIN_PURCHASE;
  } catch {}
  return { registrationPoints, purchasePoints, minPurchaseAmount };
}

// ============================================
// Routes
// ============================================

export async function referralRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /referral/code
   * Foydalanuvchining referral kodi (yo'q bo'lsa yaratadi)
   */
  app.get('/referral/code', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    let profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { referralCode: true, fullName: true },
    });

    if (!profile) throw new AppError('Profil topilmadi');

    if (!profile.referralCode) {
      let code = generateReferralCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.profile.findUnique({ where: { referralCode: code } });
        if (!existing) break;
        code = generateReferralCode();
        attempts++;
      }

      await prisma.profile.update({
        where: { id: userId },
        data: { referralCode: code },
      });

      profile = { ...profile, referralCode: code };
    }

    return reply.send({
      success: true,
      data: {
        code: profile.referralCode,
        link: `https://topla.uz/invite/${profile.referralCode}`,
      },
    });
  });

  /**
   * GET /referral/stats
   * Ballar, do'stlar va ball tarixi
   */
  app.get('/referral/stats', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    const [profile, totalInvited, referrals, pointLogs] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: userId },
        select: { referralPoints: true },
      }),
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referred: {
            select: { fullName: true, avatarUrl: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.referralPointLog.findMany({
        where: { profileId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const settings = await getPointSettings();

    return reply.send({
      success: true,
      data: {
        points: profile?.referralPoints || 0,
        totalInvited,
        registrationPoints: settings.registrationPoints,
        purchasePoints: settings.purchasePoints,
        minPurchaseAmount: settings.minPurchaseAmount,
        referrals: referrals.map(r => ({
          id: r.id,
          friendName: r.referred.fullName || 'Foydalanuvchi',
          friendAvatar: r.referred.avatarUrl,
          registrationBonusGiven: r.registrationBonusGiven,
          purchaseBonusGiven: r.purchaseBonusGiven,
          createdAt: r.createdAt,
        })),
        pointLogs: pointLogs.map(l => ({
          id: l.id,
          amount: l.amount,
          type: l.type,
          description: l.description,
          createdAt: l.createdAt,
        })),
      },
    });
  });

  /**
   * GET /referral/rewards
   * Sovg'alar katalogi
   */
  app.get('/referral/rewards', { preHandler: authMiddleware }, async (request, reply) => {
    const rewards = await prisma.referralReward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: 'asc' },
    });

    return reply.send({
      success: true,
      data: rewards.map(r => ({
        id: r.id,
        nameUz: r.nameUz,
        nameRu: r.nameRu,
        description: r.description,
        pointsCost: r.pointsCost,
        type: r.type,
        value: r.value,
        imageUrl: r.imageUrl,
        stock: r.stock,
        isActive: r.isActive,
      })),
    });
  });

  /**
   * POST /referral/rewards/:id/claim
   * Sovg'aga ball almashish
   */
  app.post('/referral/rewards/:id/claim', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const [profile, reward] = await Promise.all([
      prisma.profile.findUnique({ where: { id: userId }, select: { referralPoints: true } }),
      prisma.referralReward.findUnique({ where: { id } }),
    ]);

    if (!profile) throw new AppError('Profil topilmadi');
    if (!reward || !reward.isActive) throw new AppError('Sovg\'a topilmadi');
    if (reward.stock !== null && reward.stock <= 0) throw new AppError('Sovg\'a tugagan');
    if (profile.referralPoints < reward.pointsCost) {
      throw new AppError(`Ballar yetarli emas. Kerak: ${reward.pointsCost}, sizda: ${profile.referralPoints}`);
    }

    // Transaction: ballarni ayirish + claim yaratish + stock kamaytirish + log
    const claim = await prisma.$transaction(async (tx) => {
      // Ballarni ayirish
      await tx.profile.update({
        where: { id: userId },
        data: { referralPoints: { decrement: reward.pointsCost } },
      });

      // Stockni kamaytirish
      if (reward.stock !== null) {
        await tx.referralReward.update({
          where: { id: reward.id },
          data: { stock: { decrement: 1 } },
        });
      }

      // Claim yaratish
      const newClaim = await tx.referralRewardClaim.create({
        data: {
          profileId: userId,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
          status: 'pending',
        },
      });

      // Ball log
      await tx.referralPointLog.create({
        data: {
          profileId: userId,
          amount: -reward.pointsCost,
          type: 'reward_claimed',
          description: `Sovg'a olindi: ${reward.nameUz}`,
          claimId: newClaim.id,
        },
      });

      return newClaim;
    });

    return reply.status(201).send({
      success: true,
      data: claim,
      message: `${reward.nameUz} uchun so'rov yuborildi! Admin tasdiqlashini kuting.`,
    });
  });

  /**
   * POST /referral/apply
   * Referral kodni qo'llash — do'st ro'yxatdan o'tganda
   * Referrer ga +registrationPoints ball beriladi
   */
  app.post('/referral/apply', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { code } = z.object({ code: z.string().min(3) }).parse(request.body);

    const userProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { referralCode: true, fullName: true },
    });

    if (userProfile?.referralCode === code) {
      throw new AppError('O\'z kodingizni qo\'llash mumkin emas');
    }

    const referrer = await prisma.profile.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });

    if (!referrer) throw new AppError('Noto\'g\'ri referral kod');

    const existing = await prisma.referral.findFirst({
      where: { referredId: userId },
    });

    if (existing) throw new AppError('Siz allaqachon referral kodni qo\'llagansiz');

    const settings = await getPointSettings();

    // Transaction: referral yaratish + ball berish + log + profil yangilash
    const referral = await prisma.$transaction(async (tx) => {
      const ref = await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: userId,
          bonusAmount: 0,
          registrationBonusGiven: true,
        },
      });

      // Referrer ga ball berish
      await tx.profile.update({
        where: { id: referrer.id },
        data: { referralPoints: { increment: settings.registrationPoints } },
      });

      // Ball log
      await tx.referralPointLog.create({
        data: {
          profileId: referrer.id,
          amount: settings.registrationPoints,
          type: 'friend_registered',
          description: `Do'st ro'yxatdan o'tdi: ${userProfile?.fullName || 'Foydalanuvchi'}`,
          referralId: ref.id,
        },
      });

      return ref;
    });

    // Bildirishnoma (non-blocking)
    createNotification(
      referrer.id,
      'referral_bonus',
      'Yangi do\'st!',
      `${userProfile?.fullName || 'Foydalanuvchi'} ilovaga qo'shildi! +${settings.registrationPoints} ball`,
    ).catch(() => {});

    return reply.status(201).send({
      success: true,
      data: referral,
      message: 'Referral kod qo\'llandi!',
    });
  });
}
