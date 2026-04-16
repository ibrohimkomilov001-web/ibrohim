/**
 * Vendor Finance Routes — Payouts, Commissions, Transactions, Penalties, Finance Summary/Reports
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, requireActiveShop } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { getVendorShop } from '../../utils/shop.js';

const payoutRequestSchema = z.object({
  amount: z.number().min(10000, 'Minimal summa 10,000 so\'m'),
  cardNumber: z.string().min(16).max(19),
});

export async function vendorFinanceRoutes(app: FastifyInstance): Promise<void> {
  const vendorAuth = [authMiddleware, requireRole('vendor', 'admin')];
  const vendorWriteAuth = [...vendorAuth, requireActiveShop()];

  // ============================================
  // GET /vendor/payouts
  // ============================================
  app.get('/vendor/payouts', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status } = request.query as { status?: string };

    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        payouts,
        balance: Number(shop.balance),
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  // ============================================
  // POST /vendor/payouts
  // ============================================
  app.post('/vendor/payouts', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const body = payoutRequestSchema.parse(request.body);

    const shop = await getVendorShop(request.user!.userId);

    if (Number(shop.balance) < body.amount) {
      throw new AppError(`Balans yetarli emas. Joriy balans: ${shop.balance} so'm`);
    }

    const pendingPayout = await prisma.payout.findFirst({
      where: { shopId: shop.id, status: 'pending' },
    });
    if (pendingPayout) {
      throw new AppError('Sizda kutilayotgan to\'lov mavjud. Iltimos uni kuting.');
    }

    const payout = await prisma.$transaction(async (tx) => {
      await tx.shop.update({
        where: { id: shop.id },
        data: { balance: { decrement: body.amount } },
      });

      const newPayout = await tx.payout.create({
        data: {
          shopId: shop.id,
          amount: body.amount,
          cardNumber: body.cardNumber,
          status: 'pending',
        },
      });

      await tx.vendorTransaction.create({
        data: {
          shopId: shop.id,
          amount: body.amount,
          commission: 0,
          netAmount: body.amount,
          type: 'payout',
        },
      });

      return newPayout;
    });

    return reply.status(201).send({ success: true, data: payout });
  });

  // ============================================
  // GET /vendor/commissions
  // ============================================
  app.get('/vendor/commissions', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);

    const shop = await getVendorShop(request.user!.userId);

    const [transactions, total, totalCommission] = await Promise.all([
      prisma.vendorTransaction.findMany({
        where: { shopId: shop.id, type: 'sale' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vendorTransaction.count({
        where: { shopId: shop.id, type: 'sale' },
      }),
      prisma.vendorTransaction.aggregate({
        where: { shopId: shop.id, type: 'sale' },
        _sum: { commission: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        transactions,
        commissionRate: Number(shop.commissionRate),
        totalCommission: Number(totalCommission._sum.commission || 0),
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  // ============================================
  // GET /vendor/transactions
  // ============================================
  app.get('/vendor/transactions', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { type } = request.query as { type?: string };

    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.vendorTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vendorTransaction.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        transactions,
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  // ============================================
  // GET /vendor/penalties
  // ============================================
  app.get('/vendor/penalties', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status } = request.query as { status?: string };
    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const [penalties, total, totalAmount] = await Promise.all([
      prisma.penalty.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.penalty.count({ where }),
      prisma.penalty.aggregate({
        where: { shopId: shop.id, status: 'applied' },
        _sum: { amount: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        penalties,
        totalPenalties: Number(totalAmount._sum.amount || 0),
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  app.post('/vendor/penalties/:id/appeal', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { note } = z.object({ note: z.string().min(10, 'Kamida 10 belgi') }).parse(request.body);
    const shop = await getVendorShop(request.user!.userId);

    const penalty = await prisma.penalty.findFirst({
      where: { id, shopId: shop.id, status: { in: ['pending', 'applied'] } },
    });
    if (!penalty) throw new NotFoundError('Jarima');

    const updated = await prisma.penalty.update({
      where: { id },
      data: { status: 'appealed', appealNote: note },
    });

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // GET /vendor/finance/summary
  // ============================================
  app.get('/vendor/finance/summary', { preHandler: vendorAuth }, async (request, reply) => {
    const { period } = z.object({ period: z.enum(['week', 'month', 'quarter', 'year']).default('month') }).parse(request.query);
    const shop = await getVendorShop(request.user!.userId);

    const now = new Date();
    const startDate = new Date(now);
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3);
    else startDate.setFullYear(now.getFullYear() - 1);

    const [orders, payouts, vendorTxns] = await Promise.all([
      prisma.order.findMany({
        where: { items: { some: { shopId: shop.id } }, createdAt: { gte: startDate }, status: 'delivered' },
        select: { total: true, createdAt: true },
      }),
      prisma.payout.findMany({
        where: { shopId: shop.id, createdAt: { gte: startDate } },
        select: { amount: true, status: true, createdAt: true },
      }),
      prisma.vendorTransaction.findMany({
        where: { shopId: shop.id, createdAt: { gte: startDate } },
        select: { amount: true, type: true, createdAt: true },
      }),
    ]);

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalPayoutsCompleted = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    const totalPayoutsPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
    const totalCommission = vendorTxns.filter(t => t.type === 'sale').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(day) || { revenue: 0, orders: 0 };
      entry.revenue += Number(order.total);
      entry.orders += 1;
      dailyMap.set(day, entry);
    }
    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return reply.send({
      success: true,
      data: {
        balance: shop.balance,
        totalRevenue,
        totalCommission,
        netRevenue: totalRevenue - totalCommission,
        totalPayoutsCompleted,
        totalPayoutsPending,
        orderCount: orders.length,
        avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
        dailyBreakdown,
      },
    });
  });

  // ============================================
  // GET /vendor/finance/reports
  // ============================================
  app.get('/vendor/finance/reports', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);

    const now = new Date();
    const reports = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [orderAgg, payoutAgg, commAgg] = await Promise.all([
        prisma.order.aggregate({
          where: { items: { some: { shopId: shop.id } }, createdAt: { gte: monthStart, lte: monthEnd }, status: 'delivered' },
          _sum: { total: true },
          _count: true,
        }),
        prisma.payout.aggregate({
          where: { shopId: shop.id, createdAt: { gte: monthStart, lte: monthEnd }, status: 'completed' },
          _sum: { amount: true },
        }),
        prisma.vendorTransaction.aggregate({
          where: { shopId: shop.id, createdAt: { gte: monthStart, lte: monthEnd }, type: 'sale' },
          _sum: { amount: true },
        }),
      ]);

      reports.push({
        month: monthStart.toISOString().slice(0, 7),
        revenue: Number(orderAgg._sum?.total ?? 0),
        orders: orderAgg._count,
        payouts: Number(payoutAgg._sum.amount ?? 0),
        commission: Math.abs(Number(commAgg._sum.amount ?? 0)),
      });
    }

    return reply.send({ success: true, data: reports });
  });
}
