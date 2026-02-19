import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function bannerRoutes(app: FastifyInstance): Promise<void> {

  app.get('/banners', async (request, reply) => {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return reply.send({ success: true, data: banners });
  });
}
