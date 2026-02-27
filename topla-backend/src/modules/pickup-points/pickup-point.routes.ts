import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { notifyOrderStatusChange } from '../notifications/notification.service.js';
import { emitOrderStatusUpdate, emitToAdminDashboard } from '../../websocket/socket.js';
import { generateToken, JwtPayload } from '../../utils/jwt.js';

// ============================================
// Validation Schemas
// ============================================

const createPickupPointSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().min(5).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().optional(),
  workingHours: z.record(z.string()).optional(), // {"mon":"09:00-21:00",...}
  loginCode: z.string().min(3).max(50).optional(),
  pinCode: z.string().min(4).max(20).optional(),
});

const updatePickupPointSchema = createPickupPointSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const verifyPickupSchema = z.object({
  orderId: z.string().uuid().optional(),
  pickupToken: z.string().optional(),
  pickupCode: z.string().optional(),
});

const pickupLoginSchema = z.object({
  loginCode: z.string(),
  pinCode: z.string(),
});

// ============================================
// Routes
// ============================================

export async function pickupPointRoutes(app: FastifyInstance): Promise<void> {

  // ============================================
  // PUBLIC: Topshirish punktlari ro'yxati
  // ============================================

  /**
   * GET /pickup-points
   * Faol topshirish punktlari (mijozlar uchun)
   */
  app.get('/pickup-points', async (request, reply) => {
    const points = await prisma.pickupPoint.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        phone: true,
        workingHours: true,
      },
      orderBy: { name: 'asc' },
    });

    return reply.send({ success: true, data: points });
  });

  /**
   * GET /pickup-points/:id
   * Bitta punkt tafsilotlari
   */
  app.get('/pickup-points/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const point = await prisma.pickupPoint.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        phone: true,
        workingHours: true,
      },
    });

    if (!point) throw new NotFoundError('Topshirish punkti');
    return reply.send({ success: true, data: point });
  });

  // ============================================
  // ADMIN: Topshirish punktlarini boshqarish
  // ============================================

  /**
   * GET /admin/pickup-points
   * Admin: barcha punktlar (faol/nofaol)
   */
  app.get(
    '/admin/pickup-points',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const points = await prisma.pickupPoint.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { orders: true } },
        },
      });

      return reply.send({ success: true, data: points });
    },
  );

  /**
   * POST /admin/pickup-points
   * Admin: yangi punkt yaratish
   */
  app.post(
    '/admin/pickup-points',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const body = createPickupPointSchema.parse(request.body);

      const data: any = {
        name: body.name,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        phone: body.phone,
        workingHours: body.workingHours || null,
      };

      if (body.loginCode) {
        // Uniqueness check
        const existing = await prisma.pickupPoint.findUnique({
          where: { loginCode: body.loginCode },
        });
        if (existing) throw new AppError('Bu login kod allaqachon mavjud', 409);
        data.loginCode = body.loginCode;
      }

      if (body.pinCode) {
        data.pinCode = await bcrypt.hash(body.pinCode, 10);
      }

      const point = await prisma.pickupPoint.create({ data });

      return reply.status(201).send({ success: true, data: point });
    },
  );

  /**
   * PUT /admin/pickup-points/:id
   * Admin: punktni tahrirlash
   */
  app.put(
    '/admin/pickup-points/:id',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = updatePickupPointSchema.parse(request.body);

      const existing = await prisma.pickupPoint.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Topshirish punkti');

      const data: any = { ...body };

      // loginCode uniqueness
      if (body.loginCode && body.loginCode !== existing.loginCode) {
        const dup = await prisma.pickupPoint.findUnique({
          where: { loginCode: body.loginCode },
        });
        if (dup) throw new AppError('Bu login kod allaqachon mavjud', 409);
      }

      // Hash pin if changed
      if (body.pinCode) {
        data.pinCode = await bcrypt.hash(body.pinCode, 10);
      }

      const updated = await prisma.pickupPoint.update({
        where: { id },
        data,
      });

      return reply.send({ success: true, data: updated });
    },
  );

  /**
   * DELETE /admin/pickup-points/:id
   * Admin: punktni o'chirish
   */
  app.delete(
    '/admin/pickup-points/:id',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

      const existing = await prisma.pickupPoint.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Topshirish punkti');

      // Aktiv buyurtmalar bormi?
      const activeOrders = await prisma.order.count({
        where: {
          pickupPointId: id,
          status: { in: ['pending', 'confirmed', 'processing', 'ready_for_pickup', 'at_pickup_point'] },
        },
      });

      if (activeOrders > 0) {
        throw new AppError(`Bu punktda ${activeOrders} ta faol buyurtma bor. Avval ularni tugating.`);
      }

      await prisma.pickupPoint.delete({ where: { id } });

      return reply.send({ success: true, message: 'Topshirish punkti o\'chirildi' });
    },
  );

  // ============================================
  // PICKUP STAFF: Punkt xodimi endpointlari
  // ============================================

  /**
   * POST /pickup/login
   * Punkt xodimi kirish (loginCode + pinCode)
   */
  app.post('/pickup/login', async (request, reply) => {
    const body = pickupLoginSchema.parse(request.body);

    const point = await prisma.pickupPoint.findUnique({
      where: { loginCode: body.loginCode },
    });

    if (!point || !point.pinCode) {
      throw new AppError('Noto\'g\'ri login yoki pin kod', 401);
    }

    const pinValid = await bcrypt.compare(body.pinCode, point.pinCode);
    if (!pinValid) {
      throw new AppError('Noto\'g\'ri login yoki pin kod', 401);
    }

    // JWT token yaratish (pickupPointId bilan)
    const token = generateToken({
      userId: point.id,
      role: 'pickup_staff',
      pickupPointId: point.id,
    });

    return reply.send({
      success: true,
      data: {
        token,
        pickupPoint: {
          id: point.id,
          name: point.name,
          address: point.address,
        },
      },
    });
  });

  /**
   * GET /pickup/orders
   * Punkt xodimi: shu punktdagi buyurtmalar
   */
  app.get('/pickup/orders', { preHandler: authMiddleware }, async (request, reply) => {
    const pickupPointId = request.user?.pickupPointId || request.user?.userId;
    
    // Admin ham ko'ra oladi
    if (request.user?.role !== 'admin') {
      const point = await prisma.pickupPoint.findUnique({ where: { id: pickupPointId } });
      if (!point) throw new AppError('Punkt topilmadi', 403);
    }

    const { status } = z.object({ status: z.string().optional() }).parse(request.query);

    const where: any = { pickupPointId };
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['at_pickup_point', 'delivered'] };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return reply.send({ success: true, data: orders });
  });

  /**
   * POST /pickup/verify
   * Punkt xodimi: QR kodni skanerlash / kodni tekshirish → buyurtmani topshirish
   *
   * Ishlatish usullari:
   * 1. QR skaner apparati / kamera: { pickupToken: "uuid-token" }
   * 2. Qo'lda kiritish: { pickupCode: "123456" }
   * 3. Ikkalasi: { orderId: "uuid", pickupToken: "uuid-token" }
   */
  app.post('/pickup/verify', { preHandler: authMiddleware }, async (request, reply) => {
    const body = verifyPickupSchema.parse(request.body);

    if (!body.pickupToken && !body.pickupCode) {
      throw new AppError('pickupToken yoki pickupCode kerak');
    }

    // Buyurtmani topish
    let order;
    if (body.pickupToken) {
      order = await prisma.order.findFirst({
        where: { pickupToken: body.pickupToken },
        include: {
          items: true,
          user: { select: { id: true, fullName: true, phone: true } },
          pickupPoint: { select: { id: true, name: true } },
        },
      });
    } else if (body.pickupCode) {
      order = await prisma.order.findFirst({
        where: {
          pickupCode: body.pickupCode,
          status: 'at_pickup_point',
        },
        include: {
          items: true,
          user: { select: { id: true, fullName: true, phone: true } },
          pickupPoint: { select: { id: true, name: true } },
        },
      });
    }

    if (!order) {
      throw new AppError('Buyurtma topilmadi. Kod noto\'g\'ri yoki muddati o\'tgan.', 404);
    }

    // Status tekshirish
    if (order.status !== 'at_pickup_point') {
      if (order.status === 'delivered') {
        throw new AppError('Bu buyurtma allaqachon topshirilgan', 400);
      }
      throw new AppError(`Buyurtma hali punktga yetib kelmagan (status: ${order.status})`, 400);
    }

    // Buyurtmani "delivered" ga o'tkazish
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order!.id },
        data: {
          status: 'delivered',
          paymentStatus: 'paid',
          deliveredAt: new Date(),
          pickedUpAt2: new Date(),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order!.id,
          status: 'delivered',
          note: 'Topshirish punktida QR kod bilan tasdiqlandi',
          changedBy: request.user?.pickupPointId || request.user!.userId,
        },
      });
    });

    // Bildirishnoma
    await notifyOrderStatusChange(order.id, 'order_delivered');

    // Real-time
    emitOrderStatusUpdate(order.id, 'delivered', {});
    emitToAdminDashboard('order:delivered', { orderId: order.id });

    return reply.send({
      success: true,
      message: 'Buyurtma muvaffaqiyatli topshirildi!',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.fullName,
        customerPhone: order.user?.phone,
        items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
        total: order.total,
      },
    });
  });
}
