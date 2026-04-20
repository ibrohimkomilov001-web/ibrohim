import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as notificationRepo from '../../repositories/notification.repository.js';
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

    const { notifications, total, unreadCount } = await notificationRepo.findByUser(
      request.user!.userId,
      { skip, take: limit },
    );

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
    await notificationRepo.markRead(id, request.user!.userId);
    return reply.send({ success: true });
  });

  /**
   * PUT /notifications/read-all
   * Barcha bildirishnomalarni o'qilgan deb belgilash
   */
  app.put('/notifications/read-all', { preHandler: authMiddleware }, async (request, reply) => {
    await notificationRepo.markAllRead(request.user!.userId);
    return reply.send({ success: true });
  });

  /**
   * GET /notifications/unread-count
   * O'qilmagan bildirishnomalar soni
   */
  app.get('/notifications/unread-count', { preHandler: authMiddleware }, async (request, reply) => {
    const count = await notificationRepo.unreadCount(request.user!.userId);
    return reply.send({ success: true, data: { count } });
  });
}
