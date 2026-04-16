/**
 * Vendor Products Routes — Products CRUD, Bulk Price, Export/Import, Boosts, Product Reviews
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, requireActiveShop } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { getVendorShop } from '../../utils/shop.js';
import {
  bulkUpdatePrices,
  exportProductsCSV,
  bulkImportProducts,
} from '../../services/vendor.service.js';

export async function vendorProductsRoutes(app: FastifyInstance): Promise<void> {
  const vendorAuth = [authMiddleware, requireRole('vendor', 'admin')];
  const vendorWriteAuth = [...vendorAuth, requireActiveShop()];

  // ============================================
  // GET /vendor/products
  // ============================================
  app.get('/vendor/products', { preHandler: vendorAuth }, async (request, reply) => {
    const { page = '1', limit = '20', search, isActive } = request.query as {
      page?: string;
      limit?: string;
      search?: string;
      isActive?: string;
    };

    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { page: pg, limit: lim, skip } = parsePagination({ page, limit });

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, nameUz: true, nameRu: true } },
          brand: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: lim,
      }),
      prisma.product.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        products,
        pagination: paginationMeta(pg, lim, total),
      },
    });
  });

  // ============================================
  // GET /vendor/products/:id
  // ============================================
  app.get('/vendor/products/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const shop = await getVendorShop(request.user!.userId);

    const product = await prisma.product.findFirst({
      where: { id, shopId: shop.id },
      include: {
        category: {
          select: {
            id: true, nameUz: true, nameRu: true, level: true,
            parent: { select: { id: true, nameUz: true, nameRu: true, parent: { select: { id: true, nameUz: true, nameRu: true } } } },
          },
        },
        brand: { select: { id: true, name: true } },
        color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
        variants: {
          include: {
            color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
            size: { select: { id: true, nameUz: true, nameRu: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) throw new NotFoundError('Mahsulot');

    return reply.send({ success: true, data: product });
  });

  // ============================================
  // PATCH /vendor/products/:id
  // ============================================
  app.patch('/vendor/products/:id', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    }).parse(request.body);

    const shop = await getVendorShop(request.user!.userId);

    const existing = await prisma.product.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) throw new NotFoundError('Mahsulot');

    const product = await prisma.product.update({
      where: { id },
      data: body,
    });

    return reply.send({ success: true, data: product });
  });

  // ============================================
  // PATCH /vendor/products/bulk-price
  // ============================================
  const bulkPriceSchema = z.object({
    updates: z.array(z.object({
      productId: z.string().uuid(),
      price: z.number().positive().optional(),
      originalPrice: z.number().positive().optional(),
      discountPercent: z.number().min(0).max(100).optional(),
    })).min(1).max(500),
  });

  app.patch('/vendor/products/bulk-price', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const body = bulkPriceSchema.parse(request.body);
    const shop = await getVendorShop(request.user!.userId);

    const result = await bulkUpdatePrices(shop.id, body.updates);

    return reply.send({
      success: true,
      data: {
        updated: result.updated,
        errors: result.errors,
        total: body.updates.length,
      },
    });
  });

  // ============================================
  // GET /vendor/products/export
  // ============================================
  app.get('/vendor/products/export', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);
    const csv = await exportProductsCSV(shop.id);

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="products_${shop.id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv"`)
      .send(csv);
  });

  // ============================================
  // POST /vendor/products/import
  // ============================================
  app.post('/vendor/products/import', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const { csvContent } = z.object({
      csvContent: z.string().min(10).max(5_000_000),
    }).parse(request.body);

    const shop = await getVendorShop(request.user!.userId);
    const result = await bulkImportProducts(shop.id, csvContent);

    return reply.send({
      success: true,
      data: result,
    });
  });

  // ============================================
  // Product Reviews (vendor view)
  // ============================================
  app.get('/vendor/product-reviews', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { rating, productId } = request.query as { rating?: string; productId?: string };
    const shop = await getVendorShop(request.user!.userId);

    const where: any = { product: { shopId: shop.id } };
    if (rating) where.rating = parseInt(rating);
    if (productId) where.productId = productId;

    const [reviews, total, avgRating, ratingDist] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          product: { select: { id: true, name: true, images: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where }),
      prisma.productReview.aggregate({ where: { product: { shopId: shop.id } }, _avg: { rating: true } }),
      prisma.productReview.groupBy({
        by: ['rating'],
        where: { product: { shopId: shop.id } },
        _count: true,
      }),
    ]);

    const distribution: Record<number, number> = {};
    ratingDist.forEach(r => { distribution[r.rating] = r._count; });

    return reply.send({
      success: true,
      data: {
        reviews,
        averageRating: avgRating._avg.rating || 0,
        ratingDistribution: distribution,
        meta: paginationMeta(page, limit, total),
      },
    });
  });

  // ============================================
  // Product Boosts
  // ============================================
  const boostSchema = z.object({
    productId: z.string().uuid(),
    dailyBudget: z.number().min(5000),
    totalBudget: z.number().min(10000),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  });

  app.get('/vendor/boosts', { preHandler: vendorAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status } = request.query as { status?: string };
    const shop = await getVendorShop(request.user!.userId);

    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const [boosts, total] = await Promise.all([
      prisma.productBoost.findMany({
        where,
        include: { product: { select: { id: true, name: true, images: true, price: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productBoost.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: { boosts, meta: paginationMeta(page, limit, total) },
    });
  });

  app.post('/vendor/boosts', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const body = boostSchema.parse(request.body);
    const shop = await getVendorShop(request.user!.userId);

    const product = await prisma.product.findFirst({
      where: { id: body.productId, shopId: shop.id },
    });
    if (!product) throw new NotFoundError('Mahsulot');

    const activeBoost = await prisma.productBoost.findFirst({
      where: { productId: body.productId, status: { in: ['active', 'pending'] } },
    });
    if (activeBoost) throw new AppError('Bu mahsulot uchun allaqachon faol reklama mavjud', 400);

    if (Number(shop.balance) < body.totalBudget) {
      throw new AppError(`Balans yetarli emas. Joriy balans: ${shop.balance} so'm`, 400);
    }

    const boost = await prisma.$transaction(async (tx) => {
      await tx.shop.update({
        where: { id: shop.id },
        data: { balance: { decrement: body.totalBudget } },
      });

      return tx.productBoost.create({
        data: {
          productId: body.productId,
          shopId: shop.id,
          dailyBudget: body.dailyBudget,
          totalBudget: body.totalBudget,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          status: 'pending',
        },
        include: { product: { select: { id: true, name: true, images: true } } },
      });
    });

    return reply.status(201).send({ success: true, data: boost });
  });

  app.patch('/vendor/boosts/:id/pause', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.user!.userId);

    const boost = await prisma.productBoost.findFirst({
      where: { id, shopId: shop.id, status: 'active' },
    });
    if (!boost) throw new NotFoundError('Reklama');

    const updated = await prisma.productBoost.update({
      where: { id },
      data: { status: 'paused' },
    });

    return reply.send({ success: true, data: updated });
  });

  app.patch('/vendor/boosts/:id/resume', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.user!.userId);

    const boost = await prisma.productBoost.findFirst({
      where: { id, shopId: shop.id, status: 'paused' },
    });
    if (!boost) throw new NotFoundError('Reklama');

    const updated = await prisma.productBoost.update({
      where: { id },
      data: { status: 'active' },
    });

    return reply.send({ success: true, data: updated });
  });

  app.delete('/vendor/boosts/:id', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.user!.userId);

    const boost = await prisma.productBoost.findFirst({
      where: { id, shopId: shop.id, status: { in: ['pending', 'paused'] } },
    });
    if (!boost) throw new AppError('Faqat kutilayotgan yoki to\'xtatilgan reklamani bekor qilish mumkin', 400);

    const remaining = Number(boost.totalBudget) - Number(boost.spentAmount);
    await prisma.$transaction(async (tx) => {
      if (remaining > 0) {
        await tx.shop.update({
          where: { id: shop.id },
          data: { balance: { increment: remaining } },
        });
      }
      await tx.productBoost.update({
        where: { id },
        data: { status: 'cancelled' },
      });
    });

    return reply.send({ success: true, message: 'Reklama bekor qilindi' });
  });
}
