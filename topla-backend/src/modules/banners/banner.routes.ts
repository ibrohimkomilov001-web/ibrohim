import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { cacheGet, cacheSet } from '../../config/redis.js';

const BANNER_CACHE_KEY = 'banners:active';
const BANNER_CACHE_TTL = 300; // 5 daqiqa

export async function bannerRoutes(app: FastifyInstance): Promise<void> {

  app.get('/banners', async (request, reply) => {
    // Redis cache — bannerlar kamdan-kam o'zgaradi
    const cached = await cacheGet<any>(BANNER_CACHE_KEY);
    if (cached) return reply.send({ success: true, data: cached });

    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    cacheSet(BANNER_CACHE_KEY, banners, BANNER_CACHE_TTL).catch(() => {});
    return reply.send({ success: true, data: banners });
  });
}
