import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import crypto from 'crypto';

/**
 * Lucky Wheel (Omad Barabani) — User Routes
 * 
 * - GET  /lucky-wheel/prizes   — barcha aktiv sovg'alar (baraban segmentlari)
 * - GET  /lucky-wheel/status   — bugungi spin holati
 * - POST /lucky-wheel/spin     — aylantirish
 * - GET  /lucky-wheel/history  — foydalanuvchining spin tarixi
 */
export async function luckyWheelRoutes(app: FastifyInstance): Promise<void> {

  // ==========================================
  // GET /lucky-wheel/prizes — baraban segmentlari
  // ==========================================
  app.get('/lucky-wheel/prizes', async (_request, reply) => {
    const prizes = await prisma.luckyWheelPrize.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        nameUz: true,
        nameRu: true,
        type: true,
        value: true,
        color: true,
        imageUrl: true,
        sortOrder: true,
      },
    });

    return reply.send({
      success: true,
      data: { prizes },
    });
  });

  // ==========================================
  // GET /lucky-wheel/status — bugungi holat
  // ==========================================
  app.get('/lucky-wheel/status', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySpin = await prisma.luckyWheelSpin.findUnique({
      where: {
        userId_spinDate: {
          userId,
          spinDate: today,
        },
      },
      include: {
        prize: {
          select: {
            nameUz: true,
            nameRu: true,
            type: true,
            value: true,
            imageUrl: true,
          },
        },
      },
    });

    // Keyingi kun boshlanishi (UTC+5 Toshkent vaqti)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return reply.send({
      success: true,
      data: {
        canSpin: !todaySpin,
        todaySpin: todaySpin ? {
          prizeType: todaySpin.prizeType,
          prizeName: todaySpin.prizeName,
          promoCode: todaySpin.promoCode,
          prize: todaySpin.prize,
          createdAt: todaySpin.createdAt,
        } : null,
        nextSpinAt: todaySpin ? tomorrow.toISOString() : null,
      },
    });
  });

  // ==========================================
  // POST /lucky-wheel/spin — aylantirish
  // ==========================================
  app.post('/lucky-wheel/spin', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Kunlik limit tekshirish
    const existingSpin = await prisma.luckyWheelSpin.findUnique({
      where: {
        userId_spinDate: {
          userId,
          spinDate: today,
        },
      },
    });

    if (existingSpin) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return reply.status(429).send({
        success: false,
        message: 'Bugun allaqachon aylantirgansiz',
        data: {
          nextSpinAt: tomorrow.toISOString(),
        },
      });
    }

    // Aktiv sovg'alarni olish
    const prizes = await prisma.luckyWheelPrize.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (prizes.length === 0) {
      return reply.status(503).send({
        success: false,
        message: 'Baraban hozircha ishlamayapti',
      });
    }

    // Weighted random selection
    const selectedPrize = weightedRandom(prizes);

    // Fizik sovg'a stock tekshirish
    if (selectedPrize.type === 'physical_gift' && selectedPrize.stock !== null && selectedPrize.stock <= 0) {
      // Stock tugagan — "nothing" tipidagi sovg'ani qaytarish
      const nothingPrize = prizes.find(p => p.type === 'nothing');
      if (nothingPrize) {
        return await createSpin(userId, today, nothingPrize, reply);
      }
      // Hech qanday "nothing" yo'q — baribir natija qaytarish
      return await createSpin(userId, today, selectedPrize, reply);
    }

    return await createSpin(userId, today, selectedPrize, reply);
  });

  // ==========================================
  // GET /lucky-wheel/history — spin tarixi
  // ==========================================
  app.get('/lucky-wheel/history', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const querySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    });
    const { page, limit } = querySchema.parse(request.query);
    const skip = (page - 1) * limit;

    const [spins, total] = await Promise.all([
      prisma.luckyWheelSpin.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          prize: {
            select: {
              nameUz: true,
              nameRu: true,
              type: true,
              value: true,
              imageUrl: true,
              color: true,
            },
          },
        },
      }),
      prisma.luckyWheelSpin.count({ where: { userId } }),
    ]);

    return reply.send({
      success: true,
      data: {
        spins,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  });
}

// ============================================
// Helper: Weighted Random Selection
// ============================================
function weightedRandom(prizes: any[]): any {
  const totalWeight = prizes.reduce(
    (sum: number, p: any) => sum + Number(p.probability),
    0,
  );

  let random = Math.random() * totalWeight;

  for (const prize of prizes) {
    random -= Number(prize.probability);
    if (random <= 0) {
      return prize;
    }
  }

  // Fallback — oxirgi element
  return prizes[prizes.length - 1];
}

// ============================================
// Helper: Promo Code Generator
// ============================================
function generatePromoCode(prefix?: string | null): string {
  const pfx = prefix || 'WHEEL';
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TOPLA-${pfx}-${random}`;
}

// ============================================
// Helper: Create Spin Record
// ============================================
async function createSpin(
  userId: string,
  spinDate: Date,
  prize: any,
  reply: any,
) {
  let promoCode: string | null = null;

  // Chegirma tipi bo'lsa — promo kod yaratish
  if (prize.type === 'discount_percent' || prize.type === 'discount_fixed' || prize.type === 'free_delivery') {
    promoCode = generatePromoCode(prize.promoCodePrefix);

    // PromoCode jadvaliga yozish
    await prisma.promoCode.create({
      data: {
        code: promoCode,
        discountType: prize.type === 'discount_percent' ? 'percentage' : 'fixed',
        discountValue: prize.type === 'free_delivery'
          ? 999999  // bepul yetkazish = katta chegirma
          : Number(prize.value || 0),
        maxUses: 1,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 kun
        isActive: true,
      },
    });
  }

  // Fizik sovg'a — stockni kamaytirish
  if (prize.type === 'physical_gift' && prize.stock !== null) {
    await prisma.luckyWheelPrize.update({
      where: { id: prize.id },
      data: { stock: { decrement: 1 } },
    });
  }

  // totalWon ni oshirish
  await prisma.luckyWheelPrize.update({
    where: { id: prize.id },
    data: { totalWon: { increment: 1 } },
  });

  // Spin yozuvi
  const spin = await prisma.luckyWheelSpin.create({
    data: {
      userId,
      prizeId: prize.id,
      promoCode,
      prizeType: prize.type,
      prizeName: prize.nameUz,
      spinDate,
    },
    include: {
      prize: {
        select: {
          id: true,
          nameUz: true,
          nameRu: true,
          type: true,
          value: true,
          imageUrl: true,
          color: true,
        },
      },
    },
  });

  const tomorrow = new Date(spinDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return reply.send({
    success: true,
    data: {
      spin: {
        id: spin.id,
        prizeType: spin.prizeType,
        prizeName: spin.prizeName,
        promoCode: spin.promoCode,
        prize: spin.prize,
        createdAt: spin.createdAt,
      },
      nextSpinAt: tomorrow.toISOString(),
    },
  });
}
