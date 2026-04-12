import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { apiKeyAuth, requireApiPermission } from '../../middleware/auth.js';
import { NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { getVendorShop } from '../../utils/shop.js';
import { dispatchWebhookEvent } from '../../services/webhook.service.js';

// ============================================
// PARTNER API — External app integration
// Auth: X-API-Key: tpk_... header
// ============================================

export async function partnerRoutes(app: FastifyInstance): Promise<void> {
  // All partner routes require API key authentication
  const partnerAuth = [apiKeyAuth];

  // ============================================
  // GET /partner/shop — shop info
  // ============================================
  app.get('/partner/shop', {
    preHandler: [...partnerAuth, requireApiPermission('shop.read')],
  }, async (request, reply) => {
    const shop = await getVendorShop(request.apiKeyContext!.userId);
    return reply.send({ success: true, data: shop });
  });

  // ============================================
  // GET /partner/products — paginated product list
  // ============================================
  app.get('/partner/products', {
    preHandler: [...partnerAuth, requireApiPermission('products.read')],
  }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const query = request.query as { status?: string; search?: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const where: any = { shopId: shop.id };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { nameUz: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, nameUz: true, nameRu: true,
          price: true, originalPrice: true,
          stock: true, sku: true, status: true,
          images: true, description: true,
          category: { select: { id: true, nameUz: true, nameRu: true } },
          brand: { select: { id: true, name: true } },
          createdAt: true, updatedAt: true,
        },
      }),
    ]);

    return reply.send({ success: true, data: items, meta: paginationMeta(total, page, limit) });
  });

  // ============================================
  // GET /partner/products/:id — single product
  // ============================================
  app.get('/partner/products/:id', {
    preHandler: [...partnerAuth, requireApiPermission('products.read')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const product = await prisma.product.findFirst({
      where: { id, shopId: shop.id },
      include: {
        category: { select: { id: true, nameUz: true, nameRu: true } },
        brand: { select: { id: true, name: true } },
        color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
        variants: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product) throw new NotFoundError('Mahsulot');

    return reply.send({ success: true, data: product });
  });

  // ============================================
  // POST /partner/products — create product
  // ============================================
  app.post('/partner/products', {
    preHandler: [...partnerAuth, requireApiPermission('products.write')],
  }, async (request, reply) => {
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const body = z.object({
      name: z.string().min(2),
      nameUz: z.string().min(2),
      nameRu: z.string().optional(),
      description: z.string().optional(),
      price: z.number().positive(),
      originalPrice: z.number().positive().optional(),
      stock: z.number().int().min(0).default(0),
      sku: z.string().optional(),
      categoryId: z.string().uuid().optional(),
      brandId: z.string().uuid().optional(),
      images: z.array(z.string()).default([]),
    }).parse(request.body);

    const product = await prisma.product.create({
      data: {
        ...body,
        shopId: shop.id,
        status: 'on_review', // Always on_review — goes through moderation
      },
    });

    return reply.status(201).send({ success: true, data: product });
  });

  // ============================================
  // PUT /partner/products/:id — update product
  // ============================================
  app.put('/partner/products/:id', {
    preHandler: [...partnerAuth, requireApiPermission('products.write')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const existing = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) throw new NotFoundError('Mahsulot');

    const body = z.object({
      name: z.string().min(2).optional(),
      nameUz: z.string().min(2).optional(),
      nameRu: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      price: z.number().positive().optional(),
      originalPrice: z.number().positive().optional().nullable(),
      images: z.array(z.string()).optional(),
    }).parse(request.body);

    const updated = await prisma.product.update({ where: { id }, data: body });
    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // PATCH /partner/products/:id/stock — update stock only
  // ============================================
  app.patch('/partner/products/:id/stock', {
    preHandler: [...partnerAuth, requireApiPermission('inventory.write')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const existing = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) throw new NotFoundError('Mahsulot');

    const { stock } = z.object({ stock: z.number().int().min(0) }).parse(request.body);

    const updated = await prisma.product.update({
      where: { id },
      data: { stock },
      select: { id: true, name: true, stock: true },
    });

    // Dispatch low stock webhook if applicable
    if (updated.stock <= 3) {
      dispatchWebhookEvent(shop.id, 'product.low_stock', {
        productId: updated.id,
        productName: updated.name,
        stock: updated.stock,
      }).catch(() => {});
    }

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // PATCH /partner/products/:id/price — update price only
  // ============================================
  app.patch('/partner/products/:id/price', {
    preHandler: [...partnerAuth, requireApiPermission('products.write')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const existing = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) throw new NotFoundError('Mahsulot');

    const body = z.object({
      price: z.number().positive(),
      originalPrice: z.number().positive().optional().nullable(),
    }).parse(request.body);

    const updated = await prisma.product.update({
      where: { id },
      data: body,
      select: { id: true, name: true, price: true, originalPrice: true },
    });

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // DELETE /partner/products/:id
  // ============================================
  app.delete('/partner/products/:id', {
    preHandler: [...partnerAuth, requireApiPermission('products.write')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const existing = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) throw new NotFoundError('Mahsulot');

    await prisma.product.delete({ where: { id } });
    return reply.send({ success: true, message: "Mahsulot o'chirildi" });
  });

  // ============================================
  // POST /partner/products/bulk — bulk create/update
  // ============================================
  app.post('/partner/products/bulk', {
    preHandler: [...partnerAuth, requireApiPermission('products.write')],
  }, async (request, reply) => {
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const body = z.object({
      products: z.array(z.object({
        id: z.string().uuid().optional(), // If provided: update; otherwise: create
        name: z.string().min(2),
        nameUz: z.string().min(2),
        price: z.number().positive(),
        stock: z.number().int().min(0).default(0),
        sku: z.string().optional(),
        images: z.array(z.string()).default([]),
      })).max(100),
    }).parse(request.body);

    const results: any[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < body.products.length; i++) {
      const p = body.products[i]!;
      try {
        if (p.id) {
          const existing = await prisma.product.findFirst({ where: { id: p.id, shopId: shop.id } });
          if (!existing) throw new Error('Mahsulot topilmadi');
          const updated = await prisma.product.update({ where: { id: p.id }, data: p });
          results.push(updated);
        } else {
          const created = await prisma.product.create({
            data: { ...p, shopId: shop.id, status: 'on_review' },
          });
          results.push(created);
        }
      } catch (err: any) {
        errors.push({ index: i, error: err.message });
      }
    }

    return reply.send({
      success: true,
      data: { processed: results.length, errorCount: errors.length, results, errors },
    });
  });

  // ============================================
  // GET /partner/orders — paginated orders
  // ============================================
  app.get('/partner/orders', {
    preHandler: [...partnerAuth, requireApiPermission('orders.read')],
  }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const query = request.query as { status?: string; from?: string; to?: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const where: any = {
      items: { some: { shopId: shop.id } },
    };
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            where: { shopId: shop.id },
            include: { product: { select: { id: true, name: true, images: true } } },
          },
          user: { select: { fullName: true, phone: true } },
          address: true,
        },
      }),
    ]);

    return reply.send({ success: true, data: orders, meta: paginationMeta(total, page, limit) });
  });

  // ============================================
  // GET /partner/orders/:id — order detail
  // ============================================
  app.get('/partner/orders/:id', {
    preHandler: [...partnerAuth, requireApiPermission('orders.read')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const order = await prisma.order.findFirst({
      where: { id, items: { some: { shopId: shop.id } } },
      include: {
        items: {
          where: { shopId: shop.id },
          include: { product: true },
        },
        user: { select: { fullName: true, phone: true, email: true } },
        address: true,
        courier: { select: { profile: { select: { fullName: true, phone: true } } } },
      },
    });
    if (!order) throw new NotFoundError('Buyurtma');

    return reply.send({ success: true, data: order });
  });

  // ============================================
  // PUT /partner/orders/:id/status — update fulfillment status
  // ============================================
  app.put('/partner/orders/:id/status', {
    preHandler: [...partnerAuth, requireApiPermission('orders.write')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const order = await prisma.order.findFirst({
      where: { id, items: { some: { shopId: shop.id } } },
    });
    if (!order) throw new NotFoundError('Buyurtma');

    const { status } = z.object({
      status: z.enum(['confirmed', 'processing', 'ready_for_pickup', 'shipping', 'delivered', 'cancelled']),
    }).parse(request.body);

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    });

    // Dispatch webhook event for status change
    dispatchWebhookEvent(shop.id, 'order.status_changed', {
      orderId: id,
      newStatus: status,
      previousStatus: order.status,
    }).catch(() => {});

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // POST /partner/orders/:id/tracking — add tracking number
  // ============================================
  app.post('/partner/orders/:id/tracking', {
    preHandler: [...partnerAuth, requireApiPermission('orders.write')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const order = await prisma.order.findFirst({
      where: { id, items: { some: { shopId: shop.id } } },
    });
    if (!order) throw new NotFoundError('Buyurtma');

    const { trackingNumber, carrier } = z.object({
      trackingNumber: z.string().min(3),
      carrier: z.string().optional(),
    }).parse(request.body);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber,
        ...(carrier && { carrier }),
        status: 'shipping',
      },
      select: { id: true, trackingNumber: true, status: true },
    });

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // GET /partner/categories — full category tree
  // ============================================
  app.get('/partner/categories', {
    preHandler: partnerAuth,
  }, async (_request, reply) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true, nameUz: true, nameRu: true,
        slug: true, parentId: true, level: true,
        children: {
          where: { isActive: true },
          select: { id: true, nameUz: true, nameRu: true, slug: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return reply.send({ success: true, data: categories });
  });

  // ============================================
  // GET /partner/stats — shop statistics
  // ============================================
  app.get('/partner/stats', {
    preHandler: [...partnerAuth, requireApiPermission('stats.read')],
  }, async (request, reply) => {
    const shop = await getVendorShop(request.apiKeyContext!.userId);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayOrders, weekOrders, monthOrders, totalProducts, activeProducts] = await Promise.all([
      prisma.order.count({ where: { items: { some: { shopId: shop.id } }, createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { items: { some: { shopId: shop.id } }, createdAt: { gte: weekStart } } }),
      prisma.order.count({ where: { items: { some: { shopId: shop.id } }, createdAt: { gte: monthStart } } }),
      prisma.product.count({ where: { shopId: shop.id } }),
      prisma.product.count({ where: { shopId: shop.id, status: 'active' } }),
    ]);

    return reply.send({
      success: true,
      data: {
        today: { orders: todayOrders },
        thisWeek: { orders: weekOrders },
        thisMonth: { orders: monthOrders },
        products: { total: totalProducts, active: activeProducts },
        shop: { balance: shop.balance, rating: shop.rating },
      },
    });
  });
}
