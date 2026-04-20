import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import * as favoriteRepo from '../../repositories/favorite.repository.js';

const productIdParamSchema = z.object({ productId: z.string().uuid() });

// ============================================
// FAVORITES (Sevimlilar) Routes — uses favoriteRepo
// ============================================

export async function favoriteRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /favorites
   */
  app.get('/favorites', { preHandler: authMiddleware }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
    const { page: pg, limit: lim, skip } = parsePagination({ page, limit });

    const { items, total } = await favoriteRepo.findByUser(
      request.user!.userId,
      { skip, take: lim },
    );

    return reply.send({
      success: true,
      data: items,
      pagination: paginationMeta(pg, lim, total),
    });
  });

  /**
   * POST /favorites/:productId
   */
  app.post('/favorites/:productId', { preHandler: authMiddleware }, async (request, reply) => {
    const { productId } = productIdParamSchema.parse(request.params);
    await favoriteRepo.add(request.user!.userId, productId);
    return reply.send({ success: true });
  });

  /**
   * DELETE /favorites/:productId
   */
  app.delete('/favorites/:productId', { preHandler: authMiddleware }, async (request, reply) => {
    const { productId } = productIdParamSchema.parse(request.params);
    await favoriteRepo.remove(request.user!.userId, productId);
    return reply.send({ success: true });
  });
}
