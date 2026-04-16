/**
 * Admin Analytics Routes — Revenue, Orders, Users, Categories, Regions,
 * Couriers, Colors, Meilisearch, Search Analytics
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { initMeilisearch, clearIndex } from '../../services/search.service.js';
import { getAnalyticsDates, ALLOWED_DATE_FORMATS } from './helpers.js';

export async function adminAnalyticsRoutes(app: FastifyInstance) {
  // ==========================================
  // ANALYTICS — Time-series & breakdown data
  // ==========================================

  // Revenue time-series
  app.get('/admin/analytics/revenue', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const compare = query.compare === 'true';

    const { startDate, prevStartDate, prevEndDate, groupFormat } = getAnalyticsDates(period);
    const safeGroupFormat = ALLOWED_DATE_FORMATS[groupFormat] || 'YYYY-MM-DD';

    const currentRevenue = await prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>(
      Prisma.sql`SELECT TO_CHAR(created_at, ${safeGroupFormat}) as date,
              COALESCE(SUM(total::numeric), 0) as revenue,
              COUNT(*)::int as orders
       FROM orders
       WHERE created_at >= ${startDate} AND payment_status = 'paid'
       GROUP BY date ORDER BY date`
    );

    let previousRevenue: Array<{ date: string; revenue: number; orders: number }> = [];
    if (compare) {
      previousRevenue = await prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>(
        Prisma.sql`SELECT TO_CHAR(created_at, ${safeGroupFormat}) as date,
                COALESCE(SUM(total::numeric), 0) as revenue,
                COUNT(*)::int as orders
         FROM orders
         WHERE created_at >= ${prevStartDate} AND created_at < ${prevEndDate} AND payment_status = 'paid'
         GROUP BY date ORDER BY date`
      );
    }

    const totalRevenue = currentRevenue.reduce((s, r) => s + Number(r.revenue), 0);
    const totalOrders = currentRevenue.reduce((s, r) => s + Number(r.orders), 0);
    const prevTotal = previousRevenue.reduce((s, r) => s + Number(r.revenue), 0);
    const growthPercent = prevTotal > 0 ? ((totalRevenue - prevTotal) / prevTotal * 100) : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      success: true,
      data: {
        current: currentRevenue.map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) })),
        previous: previousRevenue.map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) })),
        summary: { totalRevenue, totalOrders, growthPercent: Math.round(growthPercent * 100) / 100, avgOrderValue: Math.round(avgOrderValue) },
      },
    };
  });

  // Orders time-series with status breakdown
  app.get('/admin/analytics/orders', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const { startDate, groupFormat } = getAnalyticsDates(period);
    const safeGroupFormat = ALLOWED_DATE_FORMATS[groupFormat] || 'YYYY-MM-DD';

    const ordersByDate = await prisma.$queryRaw<Array<{ date: string; count: number }>>(
      Prisma.sql`SELECT TO_CHAR(created_at, ${safeGroupFormat}) as date, COUNT(*)::int as count
       FROM orders WHERE created_at >= ${startDate}
       GROUP BY date ORDER BY date`
    );

    const statusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
      where: { createdAt: { gte: startDate } },
    });

    const paymentBreakdown = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: true,
      _sum: { total: true },
      where: { createdAt: { gte: startDate } },
    });

    return {
      success: true,
      data: {
        timeSeries: ordersByDate.map(o => ({ date: o.date, count: Number(o.count) })),
        statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: s._count })),
        paymentBreakdown: paymentBreakdown.map(p => ({
          method: p.paymentMethod, count: p._count, total: Number(p._sum.total || 0),
        })),
      },
    };
  });

  // New users time-series
  app.get('/admin/analytics/users', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const compare = query.compare === 'true';
    const { startDate, prevStartDate, prevEndDate, groupFormat } = getAnalyticsDates(period);
    const safeGroupFormat = ALLOWED_DATE_FORMATS[groupFormat] || 'YYYY-MM-DD';

    const currentUsers = await prisma.$queryRaw<Array<{ date: string; count: number }>>(
      Prisma.sql`SELECT TO_CHAR(created_at, ${safeGroupFormat}) as date, COUNT(*)::int as count
       FROM profiles WHERE created_at >= ${startDate} AND role = 'user'
       GROUP BY date ORDER BY date`
    );

    let previousUsers: Array<{ date: string; count: number }> = [];
    if (compare) {
      previousUsers = await prisma.$queryRaw<Array<{ date: string; count: number }>>(
        Prisma.sql`SELECT TO_CHAR(created_at, ${safeGroupFormat}) as date, COUNT(*)::int as count
         FROM profiles WHERE created_at >= ${prevStartDate} AND created_at < ${prevEndDate} AND role = 'user'
         GROUP BY date ORDER BY date`
      );
    }

    const totalNew = currentUsers.reduce((s, u) => s + Number(u.count), 0);
    const prevNew = previousUsers.reduce((s, u) => s + Number(u.count), 0);
    const growthPercent = prevNew > 0 ? ((totalNew - prevNew) / prevNew * 100) : 0;

    return {
      success: true,
      data: {
        current: currentUsers.map(u => ({ date: u.date, count: Number(u.count) })),
        previous: previousUsers.map(u => ({ date: u.date, count: Number(u.count) })),
        summary: { totalNew, growthPercent: Math.round(growthPercent * 100) / 100 },
      },
    };
  });

  // Category sales breakdown
  app.get('/admin/analytics/categories', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const { startDate } = getAnalyticsDates(period);

    const categorySales = await prisma.$queryRaw<Array<{ category_id: string; name: string; count: number; revenue: number }>>(
      Prisma.sql`SELECT c.id as category_id, c.name_uz as name,
              COUNT(oi.id)::int as count,
              COALESCE(SUM(oi.price * oi.quantity), 0)::numeric as revenue
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN categories c ON c.id = p.category_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= ${startDate} AND o.payment_status = 'paid'
       GROUP BY c.id, c.name_uz
       ORDER BY revenue DESC
       LIMIT 10`
    );

    return {
      success: true,
      data: categorySales.map(c => ({
        id: c.category_id, name: c.name, count: Number(c.count), revenue: Number(c.revenue),
      })),
    };
  });

  // Region statistics
  app.get('/admin/analytics/regions', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const period = (query.period as string) || '30d';
    const { startDate } = getAnalyticsDates(period);

    const regionData = await prisma.$queryRaw<Array<{ region: string; count: number; revenue: number }>>(
      Prisma.sql`SELECT
         CASE
           WHEN a.latitude BETWEEN 41.2 AND 41.4 AND a.longitude BETWEEN 69.1 AND 69.4 THEN 'tashkent_city'
           WHEN a.latitude BETWEEN 40.8 AND 41.6 AND a.longitude BETWEEN 68.6 AND 70.2 THEN 'tashkent'
           WHEN a.latitude BETWEEN 39.5 AND 40.5 AND a.longitude BETWEEN 66.0 AND 68.0 THEN 'samarkand'
           WHEN a.latitude BETWEEN 40.8 AND 41.8 AND a.longitude BETWEEN 60.0 AND 62.0 THEN 'khorezm'
           WHEN a.latitude BETWEEN 39.5 AND 40.2 AND a.longitude BETWEEN 64.0 AND 66.5 THEN 'bukhara'
           WHEN a.latitude BETWEEN 40.5 AND 41.5 AND a.longitude BETWEEN 64.5 AND 66.5 THEN 'navoiy'
           WHEN a.latitude BETWEEN 40.0 AND 41.0 AND a.longitude BETWEEN 70.0 AND 72.0 THEN 'fergana'
           WHEN a.latitude BETWEEN 40.5 AND 41.5 AND a.longitude BETWEEN 70.5 AND 72.5 THEN 'namangan'
           WHEN a.latitude BETWEEN 40.5 AND 41.5 AND a.longitude BETWEEN 69.5 AND 71.5 THEN 'andijon'
           WHEN a.latitude BETWEEN 38.5 AND 39.5 AND a.longitude BETWEEN 65.5 AND 67.5 THEN 'qashqadaryo'
           WHEN a.latitude BETWEEN 37.5 AND 39.0 AND a.longitude BETWEEN 66.0 AND 68.0 THEN 'surxondaryo'
           WHEN a.latitude BETWEEN 39.5 AND 41.0 AND a.longitude BETWEEN 68.0 AND 70.5 THEN 'jizzax'
           WHEN a.latitude BETWEEN 40.0 AND 42.0 AND a.longitude BETWEEN 67.0 AND 69.0 THEN 'sirdaryo'
           WHEN a.latitude BETWEEN 41.5 AND 46.0 AND a.longitude BETWEEN 56.0 AND 62.0 THEN 'karakalpakstan'
           ELSE 'other'
         END as region,
         COUNT(o.id)::int as count,
         COALESCE(SUM(o.total::numeric), 0) as revenue
       FROM orders o
       JOIN addresses a ON a.id = o.address_id
       WHERE o.created_at >= ${startDate} AND a.latitude IS NOT NULL
       GROUP BY region
       ORDER BY revenue DESC`
    );

    return {
      success: true,
      data: regionData.map(r => ({ region: r.region, count: Number(r.count), revenue: Number(r.revenue) })),
    };
  });

  // ==========================================
  // COURIERS
  // ==========================================
  app.get('/admin/couriers', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as string | undefined;

    const where: any = {};
    if (status) where.status = status;

    const [couriers, total] = await Promise.all([
      prisma.courier.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { profile: { select: { fullName: true, phone: true, avatarUrl: true } } },
      }),
      prisma.courier.count({ where }),
    ]);

    return { success: true, data: { items: couriers, pagination: paginationMeta(page, limit, total) } };
  });

  // ==========================================
  // COLORS (admin CRUD)
  // ==========================================
  app.get('/admin/colors', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async () => {
    const colors = await prisma.color.findMany({
      orderBy: { nameUz: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return { success: true, data: colors };
  });

  app.post('/admin/colors', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const data = z.object({
      nameUz: z.string().min(1),
      nameRu: z.string().min(1),
      hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Noto\'g\'ri rang formati (#RRGGBB)'),
    }).parse(request.body);

    const color = await prisma.color.create({ data });
    return { success: true, data: color };
  });

  app.put('/admin/colors/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = z.object({
      nameUz: z.string().min(1).optional(),
      nameRu: z.string().min(1).optional(),
      hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Noto\'g\'ri rang formati').optional(),
    }).parse(request.body);

    const color = await prisma.color.update({ where: { id }, data });
    return { success: true, data: color };
  });

  app.delete('/admin/colors/:id', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const productCount = await prisma.product.count({ where: { colorId: id } });
    if (productCount > 0) {
      throw new AppError(`Bu rang ${productCount} ta mahsulotda ishlatilmoqda. Avval rangni almashtirib o'chirishingiz kerak.`, 400);
    }
    await prisma.color.delete({ where: { id } });
    return { success: true, message: 'Rang o\'chirildi' };
  });

  // ============================================
  // Meilisearch: Bulk Re-index
  // ============================================
  app.post('/admin/search/reindex', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    await initMeilisearch();
    await clearIndex();

    const { enqueueSearchIndex } = await import('../../services/queue.service.js');
    await enqueueSearchIndex({ type: 'bulk_reindex' });

    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'search.reindex',
        entityType: 'system',
        entityId: 'meilisearch',
        details: { message: 'Bulk reindex queued via BullMQ' },
        ipAddress: request.ip,
      },
    });

    return reply.send({
      success: true,
      data: { message: 'Re-index jarayoni BullMQ orqali boshlandi. Bir necha daqiqada tugaydi.' },
    });
  });

  // ============================================
  // Meilisearch: Synonym Management
  // ============================================
  app.get('/admin/search/synonyms', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { getSynonyms } = await import('../../services/search.service.js');
    const synonyms = await getSynonyms();
    return reply.send({ success: true, data: synonyms || {} });
  });

  app.put('/admin/search/synonyms', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { updateSynonyms } = await import('../../services/search.service.js');
    const body = request.body as Record<string, string[]>;
    if (!body || typeof body !== 'object') {
      return reply.status(400).send({ success: false, error: 'Body must be a synonyms object' });
    }
    const result = await updateSynonyms(body);
    if (!result) {
      return reply.status(500).send({ success: false, error: 'Meilisearch synonyms yangilanmadi' });
    }
    await prisma.activityLog.create({
      data: {
        userId: request.user!.userId,
        action: 'search.synonyms_updated',
        entityType: 'system',
        entityId: 'meilisearch',
        details: { synonymCount: Object.keys(body).length },
        ipAddress: request.ip,
      },
    });
    return reply.send({ success: true, data: { message: 'Sinonimlar yangilandi' } });
  });

  // ============================================
  // Search Analytics Dashboard
  // ============================================
  app.get('/admin/search/analytics', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { days = '7' } = request.query as { days?: string };
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [topQueries, noResultQueries, totalSearches, clickStats, recentTrend] = await Promise.all([
      prisma.searchQuery.findMany({ orderBy: { count: 'desc' }, take: 20 }),
      prisma.searchAnalytics.groupBy({
        by: ['query'],
        where: { action: 'no_results', createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { query: 'desc' } },
        take: 20,
      }),
      prisma.searchQuery.aggregate({ _sum: { count: true } }),
      prisma.searchAnalytics.groupBy({
        by: ['action'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM search_analytics
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `,
    ]);

    return reply.send({
      success: true,
      data: {
        topQueries,
        noResultQueries: noResultQueries.map(q => ({ query: q.query, count: q._count._all })),
        totalSearches: totalSearches._sum.count || 0,
        clickStats: clickStats.map(s => ({ action: s.action, count: s._count._all })),
        recentTrend,
      },
    });
  });

  app.get('/admin/search/stats', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { getIndexStats } = await import('../../services/search.service.js');
    const stats = await getIndexStats();
    return reply.send({ success: true, data: stats });
  });
}
