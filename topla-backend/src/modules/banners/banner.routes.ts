import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { cacheGet, cacheSet, checkRateLimit } from '../../config/redis.js';

const BANNER_CACHE_KEY = 'banners:active';
const BANNER_CACHE_TTL = 60; // 1 daqiqa — vaqt jadvali tezroq aks etsin

export async function bannerRoutes(app: FastifyInstance): Promise<void> {

  app.get('/banners', async (request, reply) => {
    const now = new Date();

    const cached = await cacheGet<any>(BANNER_CACHE_KEY);
    if (cached) {
      const visible = (cached as any[]).filter((b) => {
        if (b.startsAt && new Date(b.startsAt) > now) return false;
        if (b.endsAt && new Date(b.endsAt) < now) return false;
        return true;
      });
      return reply.send({ success: true, data: visible });
    }

    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    cacheSet(BANNER_CACHE_KEY, banners, BANNER_CACHE_TTL).catch(() => {});

    const visible = banners.filter((b) => {
      if (b.startsAt && b.startsAt > now) return false;
      if (b.endsAt && b.endsAt < now) return false;
      return true;
    });
    return reply.send({ success: true, data: visible });
  });

  // Click tracking — public, rate limited per IP per banner to prevent spam
  app.post('/banners/:id/click', async (request, reply) => {
    const { id } = request.params as { id: string };
    const ip = request.ip || 'unknown';

    const allowed = await checkRateLimit(`banner:click:${id}:${ip}`, 5, 60);
    if (!allowed) return reply.code(429).send({ success: false, error: 'Too many requests' });

    try {
      await prisma.banner.update({
        where: { id },
        data: { clickCount: { increment: 1 } },
      });
    } catch {
      // banner may have been deleted; ignore
    }
    return reply.send({ success: true });
  });

  // View tracking — fire-and-forget, lightly rate limited per IP per banner
  app.post('/banners/:id/view', async (request, reply) => {
    const { id } = request.params as { id: string };
    const ip = request.ip || 'unknown';

    const allowed = await checkRateLimit(`banner:view:${id}:${ip}`, 1, 300);
    if (!allowed) return reply.send({ success: true });

    try {
      await prisma.banner.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    } catch {
      // ignore
    }
    return reply.send({ success: true });
  });
}
