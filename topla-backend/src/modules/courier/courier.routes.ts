import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import {
  courierAcceptOrder,
  courierRejectOrder,
  courierPickedUp,
  courierStartDelivery,
  courierDelivered,
} from './courier.service.js';

// ============================================
// Validation Schemas
// ============================================

const registerCourierSchema = z.object({
  vehicleType: z.enum(['walking', 'bicycle', 'motorcycle', 'car']).default('motorcycle'),
  vehicleNumber: z.string().optional(),
  maxDistance: z.number().min(1).max(50).default(10),
});

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().optional(),
  heading: z.number().optional(),
  accuracy: z.number().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['online', 'offline', 'on_break']),
});

// ============================================
// Routes
// ============================================

export async function courierRoutes(app: FastifyInstance): Promise<void> {

  // ============================================
  // KURYER RO'YXATDAN O'TISH
  // ============================================

  /**
   * POST /courier/register
   * Kuryer sifatida ro'yxatdan o'tish
   */
  app.post('/courier/register', { preHandler: authMiddleware }, async (request, reply) => {
    const body = registerCourierSchema.parse(request.body);
    const userId = request.user!.userId;

    // Allaqachon kuryer emasligini tekshirish
    const existing = await prisma.courier.findUnique({
      where: { profileId: userId },
    });

    if (existing) {
      throw new AppError('Siz allaqachon kuryer sifatida ro\'yxatdan o\'tgansiz');
    }

    // Kuryer yaratish
    const courier = await prisma.courier.create({
      data: {
        profileId: userId,
        vehicleType: body.vehicleType,
        vehicleNumber: body.vehicleNumber,
        maxDistance: body.maxDistance,
        isVerified: false, // Admin tasdiqlashi kerak
      },
    });

    // Profilni courier roliga o'zgartirish
    await prisma.profile.update({
      where: { id: userId },
      data: { role: 'courier' },
    });

    return reply.status(201).send({
      success: true,
      data: courier,
      message: 'Ro\'yxatdan o\'tdingiz! Admin tasdiqlashini kuting.',
    });
  });

  // ============================================
  // KURYER PROFILI
  // ============================================

  /**
   * GET /courier/me
   * Kuryer profili va statistika
   */
  app.get(
    '/courier/me',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
        include: {
          profile: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      // Bugungi statistika
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayStats = await prisma.order.aggregate({
        where: {
          courierId: courier.id,
          status: 'delivered',
          deliveredAt: { gte: today },
        },
        _count: true,
        _sum: { deliveryFee: true },
      });

      return reply.send({
        success: true,
        data: {
          ...courier,
          todayDeliveries: todayStats._count || 0,
          todayEarnings: Number(todayStats._sum.deliveryFee || 0) * 0.8,
        },
      });
    },
  );

  // ============================================
  // KURYER HOLATI (online/offline)
  // ============================================

  /**
   * PUT /courier/status
   * Kuryerni online/offline qilish
   */
  app.put(
    '/courier/status',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const body = updateStatusSchema.parse(request.body);

      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      if (!courier.isVerified) {
        throw new AppError('Profilingiz hali tasdiqlanmagan');
      }

      // Agar "busy" holatda bo'lsa, offline qilib bo'lmaydi
      if (courier.status === 'busy' && body.status === 'offline') {
        throw new AppError('Yetkazma davomida offline bo\'la olmaysiz');
      }

      await prisma.courier.update({
        where: { id: courier.id },
        data: { status: body.status },
      });

      return reply.send({
        success: true,
        message: `Holat "${body.status}" ga o'zgartirildi`,
      });
    },
  );

  // ============================================
  // JOYLASHUV YANGILASH (GPS)
  // ============================================

  /**
   * POST /courier/location
   * GPS joylashuvni yangilash (har 5-10 soniyada)
   */
  app.post(
    '/courier/location',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const body = updateLocationSchema.parse(request.body);

      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      // Joriy joylashuvni yangilash
      await prisma.courier.update({
        where: { id: courier.id },
        data: {
          currentLatitude: body.latitude,
          currentLongitude: body.longitude,
          lastLocationAt: new Date(),
        },
      });

      // Joylashuv tarixiga saqlash (agar yetkazmoqda bo'lsa)
      if (courier.status === 'busy') {
        await prisma.courierLocation.create({
          data: {
            courierId: courier.id,
            latitude: body.latitude,
            longitude: body.longitude,
            speed: body.speed,
            heading: body.heading,
            accuracy: body.accuracy,
          },
        });
      }

      return reply.send({ success: true });
    },
  );

  // ============================================
  // BUYURTMALARNI BOSHQARISH
  // ============================================

  /**
   * GET /courier/orders/available
   * Mavjud (tayinlangan) buyurtmalar
   */
  app.get(
    '/courier/orders/available',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      // Kuryerga tayinlangan, hali javob berilmagan buyurtmalar
      const assignments = await prisma.deliveryAssignment.findMany({
        where: {
          courierId: courier.id,
          status: 'pending',
          expiresAt: { gt: new Date() }, // Hali muddati tugamagan
        },
        include: {
          courier: false,
        },
      });

      // Buyurtma tafsilotlarini olish
      const orders = await Promise.all(
        assignments.map(async (a) => {
          const order = await prisma.order.findUnique({
            where: { id: a.orderId },
            include: {
              items: {
                include: {
                  shop: {
                    select: { id: true, name: true, address: true, latitude: true, longitude: true },
                  },
                },
              },
              address: true,
            },
          });

          return {
            assignment: {
              id: a.id,
              distanceKm: a.distanceKm,
              estimatedMinutes: a.estimatedMinutes,
              expiresAt: a.expiresAt,
            },
            order,
          };
        }),
      );

      return reply.send({ success: true, data: orders });
    },
  );

  /**
   * GET /courier/orders/active
   * Hozirgi faol yetkazma
   */
  app.get(
    '/courier/orders/active',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      const activeOrders = await prisma.order.findMany({
        where: {
          courierId: courier.id,
          status: { in: ['courier_assigned', 'courier_picked_up', 'shipping'] },
        },
        include: {
          items: {
            include: {
              shop: {
                select: { id: true, name: true, address: true, phone: true, latitude: true, longitude: true },
              },
            },
          },
          address: true,
          user: {
            select: { id: true, fullName: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ success: true, data: activeOrders });
    },
  );

  /**
   * GET /courier/orders/history
   * Yetkazib bo'lgan buyurtmalar tarixi
   */
  app.get(
    '/courier/orders/history',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: {
            courierId: courier.id,
            status: { in: ['delivered', 'cancelled'] },
          },
          include: {
            items: {
              include: {
                shop: { select: { id: true, name: true } },
              },
            },
            address: true,
            deliveryRating: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.order.count({
          where: {
            courierId: courier.id,
            status: { in: ['delivered', 'cancelled'] },
          },
        }),
      ]);

      return reply.send({
        success: true,
        data: { orders, total },
      });
    },
  );

  // ============================================
  // BUYURTMA QABUL/RAD QILISH
  // ============================================

  /**
   * POST /courier/orders/:id/accept
   * Buyurtmani qabul qilish
   */
  app.post(
    '/courier/orders/:id/accept',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const { id: orderId } = request.params as { id: string };
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      await courierAcceptOrder(courier.id, orderId);

      return reply.send({
        success: true,
        message: 'Buyurtma qabul qilindi! Do\'konga boring.',
      });
    },
  );

  /**
   * POST /courier/orders/:id/reject
   * Buyurtmani rad etish
   */
  app.post(
    '/courier/orders/:id/reject',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const { id: orderId } = request.params as { id: string };
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      await courierRejectOrder(courier.id, orderId);

      return reply.send({ success: true, message: 'Buyurtma rad etildi' });
    },
  );

  /**
   * POST /courier/orders/:id/picked-up
   * Buyurtmani do'kondan oldim
   */
  app.post(
    '/courier/orders/:id/picked-up',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const { id: orderId } = request.params as { id: string };
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      await courierPickedUp(courier.id, orderId);

      return reply.send({
        success: true,
        message: 'Buyurtma olindi! Mijozga yetkazing.',
      });
    },
  );

  /**
   * POST /courier/orders/:id/start-delivery
   * Yetkazishni boshlash (GPS tracking start)
   */
  app.post(
    '/courier/orders/:id/start-delivery',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const { id: orderId } = request.params as { id: string };
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      await courierStartDelivery(courier.id, orderId);

      return reply.send({
        success: true,
        message: 'Yetkazish boshlandi! GPS tracking yoqildi.',
      });
    },
  );

  /**
   * POST /courier/orders/:id/delivered
   * Buyurtma yetkazildi
   */
  app.post(
    '/courier/orders/:id/delivered',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const { id: orderId } = request.params as { id: string };
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      await courierDelivered(courier.id, orderId);

      return reply.send({
        success: true,
        message: '✅ Buyurtma muvaffaqiyatli yetkazildi!',
      });
    },
  );

  // ============================================
  // KURYER DAROMADI
  // ============================================

  /**
   * GET /courier/earnings
   * Kuryer daromadi statistikasi
   */
  app.get(
    '/courier/earnings',
    { preHandler: [authMiddleware, requireRole('courier')] },
    async (request, reply) => {
      const { period = 'week' } = request.query as { period?: string };
      const courier = await prisma.courier.findUnique({
        where: { profileId: request.user!.userId },
      });

      if (!courier) throw new NotFoundError('Kuryer profili');

      // Period bo'yicha filter
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today': {
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          startDate = today;
          break;
        }
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const stats = await prisma.order.aggregate({
        where: {
          courierId: courier.id,
          status: 'delivered',
          deliveredAt: { gte: startDate },
        },
        _count: true,
        _sum: { deliveryFee: true },
      });

      // Kunlik taqsimot
      const dailyEarnings = await prisma.order.groupBy({
        by: ['deliveredAt'],
        where: {
          courierId: courier.id,
          status: 'delivered',
          deliveredAt: { gte: startDate },
        },
        _count: true,
        _sum: { deliveryFee: true },
      });

      return reply.send({
        success: true,
        data: {
          period,
          totalDeliveries: stats._count || 0,
          totalEarnings: Number(stats._sum.deliveryFee || 0) * 0.8,
          balance: Number(courier.balance),
          rating: courier.rating,
          dailyEarnings,
        },
      });
    },
  );

  // ============================================
  // ADMIN: KURYER BOSHQARISH
  // ============================================



  /**
   * PUT /admin/couriers/:id/verify
   * Kuryerni tasdiqlash (admin)
   */
  app.put(
    '/admin/couriers/:id/verify',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const verifySchema = z.object({
        verified: z.boolean(),
      });
      const { verified } = verifySchema.parse(request.body);

      const courier = await prisma.courier.findUnique({ where: { id } });
      if (!courier) throw new NotFoundError('Kuryer');

      await prisma.courier.update({
        where: { id },
        data: { isVerified: verified },
      });

      return reply.send({
        success: true,
        message: verified ? 'Kuryer tasdiqlandi' : 'Kuryer rad etildi',
      });
    },
  );
}
