import { FastifyInstance } from 'fastify';
import * as bannerRepo from '../../repositories/banner.repository.js';
import { checkRateLimit } from '../../config/redis.js';

type BannerRow = {
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
};

export async function bannerRoutes(app: FastifyInstance): Promise<void> {

  app.get('/banners', async (_request, reply) => {
    const now = new Date();
    const banners = (await bannerRepo.findActiveCached()) as BannerRow[];

    const visible = banners.filter((b) => {
      if (b.startsAt && new Date(b.startsAt) > now) return false;
      if (b.endsAt && new Date(b.endsAt) < now) return false;
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

    await bannerRepo.incrementClick(id);
    return reply.send({ success: true });
  });

  // View tracking — fire-and-forget, lightly rate limited per IP per banner
  app.post('/banners/:id/view', async (request, reply) => {
    const { id } = request.params as { id: string };
    const ip = request.ip || 'unknown';

    const allowed = await checkRateLimit(`banner:view:${id}:${ip}`, 1, 300);
    if (!allowed) return reply.send({ success: true });

    await bannerRepo.incrementView(id);
    return reply.send({ success: true });
  });
}
