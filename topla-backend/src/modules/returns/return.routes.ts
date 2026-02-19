import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';

// ============================================
// Validation Schemas
// ============================================

const createReturnSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(5, 'Sabab kamida 5 ta belgi'),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
});

const reviewReturnSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
});

// ============================================
// Routes
// ============================================

export async function returnRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /returns
   * Foydalanuvchining qaytarishlari
   */
  app.get('/returns', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { status } = request.query as { status?: string };

    const where: any = { userId };
    if (status) where.status = status;

    const returns = await prisma.return.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: returns });
  });

  /**
   * POST /returns
   * Qaytarish so'rovi yaratish
   */
  app.post('/returns', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const body = createReturnSchema.parse(request.body);

    // Buyurtmani tekshirish
    const order = await prisma.order.findFirst({
      where: { id: body.orderId, userId },
    });

    if (!order) throw new NotFoundError('Buyurtma');

    // Faqat yetkazilgan buyurtmalarni qaytarish mumkin
    if (order.status !== 'delivered') {
      throw new AppError('Faqat yetkazilgan buyurtmalarni qaytarish mumkin');
    }

    // 14 kunlik muddat tekshirish
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceDelivery > 14) {
      throw new AppError('Qaytarish muddati o\'tgan (14 kun)');
    }

    // Allaqachon qaytarish borligini tekshirish
    const existing = await prisma.return.findFirst({
      where: {
        orderId: body.orderId,
        userId,
        status: { in: ['pending', 'approved'] },
      },
    });

    if (existing) {
      throw new AppError('Bu buyurtma uchun qaytarish so\'rovi allaqachon mavjud');
    }

    const returnRequest = await prisma.return.create({
      data: {
        orderId: body.orderId,
        userId,
        reason: body.reason,
        description: body.description,
        images: body.images,
        refundAmount: Number(order.total),
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
          },
        },
      },
    });

    return reply.status(201).send({ success: true, data: returnRequest });
  });

  /**
   * GET /returns/:id
   * Qaytarish tafsilotlari
   */
  app.get('/returns/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const returnRequest = await prisma.return.findFirst({
      where: { id, userId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!returnRequest) throw new NotFoundError('Qaytarish');

    return reply.send({ success: true, data: returnRequest });
  });

  /**
   * DELETE /returns/:id
   * Qaytarish so'rovini bekor qilish (faqat pending holatda)
   */
  app.delete('/returns/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const returnRequest = await prisma.return.findFirst({
      where: { id, userId },
    });

    if (!returnRequest) throw new NotFoundError('Qaytarish');

    if (returnRequest.status !== 'pending') {
      throw new AppError('Faqat kutilayotgan so\'rovlarni bekor qilish mumkin');
    }

    await prisma.return.delete({ where: { id } });

    return reply.send({ success: true, message: 'Qaytarish bekor qilindi' });
  });

  // ============================================
  // ADMIN: Qaytarishlarni boshqarish
  // ============================================

  /**
   * GET /admin/returns
   * Barcha qaytarishlar (admin)
   */
  app.get(
    '/admin/returns',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const { status, page = '1', limit = '20' } = request.query as Record<string, string>;

      const where: any = {};
      if (status) where.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [returns, total] = await Promise.all([
        prisma.return.findMany({
          where,
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
            order: {
              select: {
                id: true,
                orderNumber: true,
                total: true,
                items: {
                  select: { name: true, quantity: true, price: true, imageUrl: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.return.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: returns,
        meta: { total, page: parseInt(page), limit: parseInt(limit) },
      });
    }
  );

  /**
   * PUT /admin/returns/:id
   * Qaytarishni ko'rib chiqish (approve/reject)
   */
  app.put(
    '/admin/returns/:id',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = reviewReturnSchema.parse(request.body);

      const returnRequest = await prisma.return.findUnique({ where: { id } });
      if (!returnRequest) throw new NotFoundError('Qaytarish');

      if (returnRequest.status !== 'pending') {
        throw new AppError('Bu qaytarish allaqachon ko\'rib chiqilgan');
      }

      const updated = await prisma.return.update({
        where: { id },
        data: {
          status: body.status,
          adminNote: body.adminNote,
          refundAmount: body.refundAmount ?? returnRequest.refundAmount,
        },
        include: {
          user: { select: { id: true, fullName: true, phone: true } },
          order: { select: { id: true, orderNumber: true, total: true } },
        },
      });

      return reply.send({ success: true, data: updated });
    }
  );
}
