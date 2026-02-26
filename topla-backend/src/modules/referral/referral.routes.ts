import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { randomBytes, randomInt } from 'crypto';

// ============================================
// Helpers
// ============================================

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // O, 0, I, 1 chiqarib tashlandi
  let code = 'TOPLA';
  for (let i = 0; i < 5; i++) {
    code += chars[randomInt(0, chars.length)];
  }
  return code;
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

    // Kodi yo'q bo'lsa yaratish
    if (!profile.referralCode) {
      let code = generateReferralCode();
      // Unique bo'lishini tekshirish
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
   * Referral statistikasi
   */
  app.get('/referral/stats', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    const [totalInvited, totalEarned, referrals] = await Promise.all([
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.aggregate({
        where: { referrerId: userId, referrerPaid: true },
        _sum: { bonusAmount: true },
      }),
      prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referred: {
            select: { fullName: true, avatarUrl: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        totalInvited,
        totalEarned: totalEarned._sum.bonusAmount || 0,
        bonusPerInvite: 50000,
        referrals: referrals.map(r => ({
          id: r.id,
          friendName: r.referred.fullName || 'Foydalanuvchi',
          friendAvatar: r.referred.avatarUrl,
          referrerPaid: r.referrerPaid,
          referredPaid: r.referredPaid,
          bonusAmount: r.bonusAmount,
          createdAt: r.createdAt,
        })),
      },
    });
  });

  /**
   * POST /referral/apply
   * Referral kodni qo'llash (ro'yxatdan o'tishda)
   */
  app.post('/referral/apply', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { code } = z.object({ code: z.string().min(3) }).parse(request.body);

    // O'zining kodi emas ekanligini tekshirish
    const userProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (userProfile?.referralCode === code) {
      throw new AppError('O\'z kodingizni qo\'llash mumkin emas');
    }

    // Kod egasini topish
    const referrer = await prisma.profile.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });

    if (!referrer) throw new AppError('Noto\'g\'ri referral kod');

    // Allaqachon referral borligini tekshirish
    const existing = await prisma.referral.findFirst({
      where: { referredId: userId },
    });

    if (existing) throw new AppError('Siz allaqachon referral kodni qo\'llagansiz');

    // Referral yaratish
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        bonusAmount: 50000,
      },
    });

    return reply.status(201).send({
      success: true,
      data: referral,
      message: 'Referral kod qo\'llandi! Birinchi xarid qilganingizdan keyin bonus beriladi.',
    });
  });
}
