import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const idParamSchema = z.object({ id: z.string().uuid() });

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /notifications
   * Foydalanuvchining barcha bildirishnomalarini olish
   */
  app.get('/notifications', { preHandler: authMiddleware }, async (request, reply) => {
    const { page, limit } = paginationSchema.parse(request.query);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: request.user!.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: request.user!.userId },
      }),
      prisma.notification.count({
        where: { userId: request.user!.userId, isRead: false },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  });

  /**
   * PUT /notifications/:id/read
   * Bildirishnomani o'qilgan deb belgilash
   */
  app.put('/notifications/:id/read', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    await prisma.notification.update({
      where: { id, userId: request.user!.userId },
      data: { isRead: true },
    });

    return reply.send({ success: true });
  });

  /**
   * PUT /notifications/read-all
   * Barcha bildirishnomalarni o'qilgan deb belgilash
   */
  app.put('/notifications/read-all', { preHandler: authMiddleware }, async (request, reply) => {
    await prisma.notification.updateMany({
      where: { userId: request.user!.userId, isRead: false },
      data: { isRead: true },
    });

    return reply.send({ success: true });
  });

  /**
   * GET /notifications/unread-count
   * O'qilmagan bildirishnomalar soni
   */
  app.get('/notifications/unread-count', { preHandler: authMiddleware }, async (request, reply) => {
    const count = await prisma.notification.count({
      where: { userId: request.user!.userId, isRead: false },
    });

    return reply.send({ success: true, data: { count } });
  });
}
