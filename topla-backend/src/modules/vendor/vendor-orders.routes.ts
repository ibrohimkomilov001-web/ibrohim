/**
 * Vendor Orders Routes — Stats, Analytics, Funnel, Returns, Order Tracking
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, requireActiveShop } from '../../middleware/auth.js';
import { NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { getVendorShop } from '../../utils/shop.js';
import { cacheGet, cacheSet } from '../../config/redis.js';

export async function vendorOrdersRoutes(app: FastifyInstance): Promise<void> {
  const vendorAuth = [authMiddleware, requireRole('vendor', 'admin')];
  const vendorWriteAuth = [...vendorAuth, requireActiveShop()];

  // ============================================
  // GET /vendor/stats
  // ============================================
  app.get('/vendor/stats', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);

    const cacheKey = `vendor_stats:${shop.id}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      return reply.send({ success: true, data: cached });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [orderStats, productStats, revenueStats] = await Promise.all([
      prisma.$queryRaw<Array<{
        status: string;
        total: bigint;
        today_count: bigint;
        month_count: bigint;
      }>>`
        SELECT 
          o.status,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE o.created_at >= ${today}) as today_count,
          COUNT(*) FILTER (WHERE o.created_at >= ${monthStart}) as month_count
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE oi.shop_id = ${shop.id}::uuid
        GROUP BY o.status
      `,

      prisma.product.groupBy({
        by: ['isActive'],
        where: { shopId: shop.id },
        _count: true,
      }),

      prisma.$queryRaw<Array<{
        total_revenue: string | null;
        month_revenue: string | null;
        today_revenue: string | null;
        total_commission: string | null;
      }>>`
        SELECT 
          SUM(net_amount) as total_revenue,
          SUM(net_amount) FILTER (WHERE created_at >= ${monthStart}) as month_revenue,
          SUM(net_amount) FILTER (WHERE created_at >= ${today}) as today_revenue,
          SUM(commission) as total_commission
        FROM vendor_transactions
        WHERE shop_id = ${shop.id}::uuid AND type = 'sale'
      `,
    ]);

    let totalOrders = 0, todayOrders = 0, monthOrders = 0;
    let pendingOrders = 0, deliveredOrders = 0, cancelledOrders = 0;
    for (const row of orderStats) {
      const total = Number(row.total);
      const todayCount = Number(row.today_count);
      const monthCount = Number(row.month_count);
      totalOrders += total;
      todayOrders += todayCount;
      monthOrders += monthCount;
      if (row.status === 'pending') pendingOrders = total;
      if (row.status === 'delivered') deliveredOrders = total;
      if (row.status === 'cancelled') cancelledOrders = total;
    }

    let productsTotal = 0, activeProducts = 0;
    for (const row of productStats) {
      const count = (row as any)._count;
      productsTotal += count;
      if (row.isActive) activeProducts = count;
    }

    const rev = revenueStats[0];
    const totalRevenue = Number(rev?.total_revenue || 0);
    const monthRevenue = Number(rev?.month_revenue || 0);
    const todayRevenue = Number(rev?.today_revenue || 0);
    const totalCommission = Number(rev?.total_commission || 0);

    const statsData = {
      balance: Number(shop.balance),
      rating: shop.rating,
      reviewCount: shop.reviewCount,
      commissionRate: Number(shop.commissionRate),
      orders: {
        total: totalOrders,
        today: todayOrders,
        month: monthOrders,
        pending: pendingOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      products: {
        total: productsTotal,
        active: activeProducts,
        inactive: productsTotal - activeProducts,
      },
      revenue: {
        total: totalRevenue,
        month: monthRevenue,
        today: todayRevenue,
      },
      totalCommission,
    };

    await cacheSet(cacheKey, statsData, 60);

    return reply.send({ success: true, data: statsData });
  });

  // ============================================
  // GET /vendor/analytics
  // ============================================
  app.get('/vendor/analytics', { preHandler: vendorAuth }, async (request, reply) => {
    const { period = 'month' } = request.query as { period?: string };

    const shop = await getVendorShop(request.user!.userId);

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const [transactions, topProducts, ordersByStatus] = await Promise.all([
      prisma.vendorTransaction.findMany({
        where: { shopId: shop.id, type: 'sale', createdAt: { gte: startDate } },
        orderBy: { createdAt: 'asc' },
        select: {
          amount: true,
          commission: true,
          netAmount: true,
          createdAt: true,
        },
      }),

      prisma.orderItem.groupBy({
        by: ['productId', 'name'],
        where: {
          shopId: shop.id,
          order: { createdAt: { gte: startDate }, status: { not: 'cancelled' } },
        },
        _sum: { quantity: true },
        _count: true,
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),

      prisma.order.groupBy({
        by: ['status'],
        where: {
          items: { some: { shopId: shop.id } },
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
    ]);

    const dailyRevenue: Record<string, { revenue: number; orders: number; commission: number }> = {};
    for (const tx of transactions) {
      const dateKey = tx.createdAt.toISOString().slice(0, 10);
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = { revenue: 0, orders: 0, commission: 0 };
      }
      dailyRevenue[dateKey].revenue += Number(tx.netAmount);
      dailyRevenue[dateKey].orders += 1;
      dailyRevenue[dateKey].commission += Number(tx.commission);
    }

    return reply.send({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
          date,
          ...data,
        })),
        topProducts: topProducts.map((p) => ({
          productId: p.productId,
          name: p.name,
          totalSold: p._sum.quantity || 0,
          orderCount: p._count,
        })),
        ordersByStatus: ordersByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        summary: {
          totalRevenue: transactions.reduce((sum, tx) => sum + Number(tx.netAmount), 0),
          totalCommission: transactions.reduce((sum, tx) => sum + Number(tx.commission), 0),
          totalOrders: transactions.length,
          averageOrderValue:
            transactions.length > 0
              ? transactions.reduce((sum, tx) => sum + Number(tx.amount), 0) / transactions.length
              : 0,
        },
      },
    });
  });

  // ============================================
  // GET /vendor/analytics/funnel
  // ============================================
  app.get('/vendor/analytics/funnel', { preHandler: vendorAuth }, async (request, reply) => {
    const { period = 'month' } = request.query as { period?: string };
    const shop = await getVendorShop(request.user!.userId);

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
    }

    const [totalViews, uniqueViewers, cartAdds, orders, deliveredOrders] = await Promise.all([
      prisma.productView.count({
        where: { product: { shopId: shop.id }, createdAt: { gte: startDate } },
      }),
      prisma.productView.groupBy({
        by: ['userId'],
        where: { product: { shopId: shop.id }, createdAt: { gte: startDate } },
      }).then(r => r.length),
      prisma.cartItem.count({
        where: { product: { shopId: shop.id }, createdAt: { gte: startDate } },
      }),
      prisma.order.count({
        where: { items: { some: { shopId: shop.id } }, createdAt: { gte: startDate }, status: { not: 'cancelled' } },
      }),
      prisma.order.count({
        where: { items: { some: { shopId: shop.id } }, createdAt: { gte: startDate }, status: 'delivered' },
      }),
    ]);

    const dailyViews = await prisma.$queryRaw<{ date: string; count: bigint }[]>(Prisma.sql`
      SELECT DATE(pv."created_at") as date, COUNT(*) as count
      FROM product_views pv
      JOIN products p ON pv."product_id" = p.id
      WHERE p."shop_id" = ${shop.id}::uuid AND pv."created_at" >= ${startDate}
      GROUP BY DATE(pv."created_at")
      ORDER BY date ASC
    `);

    const dailyOrders = await prisma.$queryRaw<{ date: string; count: bigint }[]>(Prisma.sql`
      SELECT DATE(o."created_at") as date, COUNT(DISTINCT o.id) as count
      FROM orders o
      JOIN order_items oi ON o.id = oi."order_id"
      WHERE oi."shop_id" = ${shop.id}::uuid AND o."created_at" >= ${startDate} AND o.status != 'cancelled'
      GROUP BY DATE(o."created_at")
      ORDER BY date ASC
    `);

    return reply.send({
      success: true,
      data: {
        funnel: {
          views: totalViews,
          uniqueViewers,
          cartAdds,
          orders,
          delivered: deliveredOrders,
        },
        conversionRates: {
          viewToCart: totalViews > 0 ? ((cartAdds / totalViews) * 100).toFixed(1) : '0.0',
          cartToOrder: cartAdds > 0 ? ((orders / cartAdds) * 100).toFixed(1) : '0.0',
          orderToDelivered: orders > 0 ? ((deliveredOrders / orders) * 100).toFixed(1) : '0.0',
          overall: totalViews > 0 ? ((deliveredOrders / totalViews) * 100).toFixed(2) : '0.00',
        },
        dailyViews: dailyViews.map(d => ({ date: String(d.date).slice(0, 10), count: Number(d.count) })),
        dailyOrders: dailyOrders.map(d => ({ date: String(d.date).slice(0, 10), count: Number(d.count) })),
      },
    });
  });

  // ============================================
  // GET /vendor/returns
  // ============================================
  app.get('/vendor/returns', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status } = request.query as Record<string, string>;
    const userId = request.user!.userId;

    const shop = await getVendorShop(userId);

    const where: any = {
      order: { items: { some: { shopId: shop.id } } },
    };
    if (status) where.status = status;

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              createdAt: true,
              items: {
                where: { shopId: shop.id },
                select: { name: true, quantity: true, price: true, imageUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.return.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: returns,
      meta: paginationMeta(page, limit, total),
    });
  });

  // ============================================
  // GET /vendor/orders/:id/tracking
  // ============================================
  app.get('/vendor/orders/:id/tracking', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.user!.userId);

    const order = await prisma.order.findFirst({
      where: { id, items: { some: { shopId: shop.id } } },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        address: true,
      },
    });
    if (!order) throw new NotFoundError('Buyurtma');

    return reply.send({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        history: order.statusHistory?.map((h: any) => ({
          status: h.status,
          timestamp: h.createdAt,
          note: h.note || null,
        })) || [],
        deliveryAddress: order.address,
      },
    });
  });

  // ============================================
  // POST /vendor/orders/:id/tracking
  // ============================================
  app.post('/vendor/orders/:id/tracking', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { trackingNumber, carrier } = z.object({
      trackingNumber: z.string().min(1),
      carrier: z.string().optional(),
    }).parse(request.body);

    const shop = await getVendorShop(request.user!.userId);
    const order = await prisma.order.findFirst({
      where: { id, items: { some: { shopId: shop.id } } },
    });
    if (!order) throw new NotFoundError('Buyurtma');

    const updated = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber,
        ...(carrier && { carrier }),
      },
    });

    return reply.send({ success: true, data: updated });
  });
}
