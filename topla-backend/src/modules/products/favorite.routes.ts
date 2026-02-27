import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';

const productIdParamSchema = z.object({ productId: z.string().uuid() });

// ============================================
// FAVORITES (Sevimlilar) Routes
// ============================================

export async function favoriteRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /favorites
   */
  app.get('/favorites', { preHandler: authMiddleware }, async (request, reply) => {
    const favorites = await prisma.favorite.findMany({
      where: { userId: request.user!.userId },
      include: {
        product: {
          include: {
            shop: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return reply.send({ success: true, data: favorites });
  });

  /**
   * POST /favorites/:productId
   * Sevimliga qo'shish
   */
  app.post('/favorites/:productId', { preHandler: authMiddleware }, async (request, reply) => {
    const { productId } = productIdParamSchema.parse(request.params);

    await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: request.user!.userId,
          productId,
        },
      },
      update: {},
      create: {
        userId: request.user!.userId,
        productId,
      },
    });

    return reply.send({ success: true });
  });

  /**
   * DELETE /favorites/:productId
   */
  app.delete('/favorites/:productId', { preHandler: authMiddleware }, async (request, reply) => {
    const { productId } = productIdParamSchema.parse(request.params);

    await prisma.favorite.deleteMany({
      where: { userId: request.user!.userId, productId },
    });

    return reply.send({ success: true });
  });
}
