import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { cacheGet, cacheSet } from '../../config/redis.js';

const createShopSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  telegram: z.string().optional(),
  instagram: z.string().optional(),
  minOrderAmount: z.number().optional(),
  deliveryFee: z.number().optional(),
  freeDeliveryFrom: z.number().optional(),
  deliveryRadius: z.number().optional(),
});

export async function shopRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /shops
   * Do'konlar ro'yxati
   */
  app.get('/shops', async (request, reply) => {
    const { page = '1', limit = '20', search } = request.query as {
      page?: string;
      limit?: string;
      search?: string;
    };

    const where: any = { status: 'active' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { page: pg, limit: lim, skip } = parsePagination({ page, limit });

    // Cache: do'konlar ro'yxati (120 sek)
    const shopsCacheKey = `shops:list:${pg}:${lim}:${search || ''}`;
    const cachedShops = await cacheGet<any>(shopsCacheKey);
    if (cachedShops) return reply.send(cachedShops);

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        select: {
          id: true, name: true, description: true, logoUrl: true, bannerUrl: true,
          rating: true, reviewCount: true, address: true, isOpen: true,
          deliveryFee: true, freeDeliveryFrom: true, minOrderAmount: true,
          _count: { select: { products: true } },
        },
        orderBy: { rating: 'desc' },
        skip,
        take: lim,
      }),
      prisma.shop.count({ where }),
    ]);

    const shopsResponse = { success: true, data: { shops, total } };
    cacheSet(shopsCacheKey, shopsResponse, 120).catch(() => {});
    return reply.send(shopsResponse);
  });

  /**
   * GET /shops/:id
   */
  app.get('/shops/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // UUID format tekshiruvi
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundError('Do\'kon');
    }

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, reviews: true } },
      },
    });

    if (!shop) throw new NotFoundError('Do\'kon');

    return reply.send({ success: true, data: shop });
  });

  /**
   * GET /shops/:id/products
   */
  app.get('/shops/:id/products', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
    const { page: pg2, limit: lim2, skip: skip2 } = parsePagination({ page, limit });

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { shopId: id, isActive: true },
        include: {
          category: { select: { id: true, nameUz: true, nameRu: true } },
          brand: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: skip2,
        take: lim2,
      }),
      prisma.product.count({ where: { shopId: id, isActive: true } }),
    ]);

    return reply.send({ success: true, data: { products, total } });
  });

  /**
   * GET /shops/:id/reviews
   */
  app.get('/shops/:id/reviews', async (request, reply) => {
    const { id } = request.params as { id: string };

    const reviews = await prisma.shopReview.findMany({
      where: { shopId: id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reply.send({ success: true, data: reviews });
  });

  /**
   * POST /shops/:id/reviews
   */
  const reviewSchema = z.object({
    rating: z.number().int().min(1, 'Baho kamida 1').max(5, 'Baho 5 dan oshmasligi kerak'),
    comment: z.string().max(500).optional(),
  });
  const idParamSchema = z.object({ id: z.string().uuid() });

  app.post('/shops/:id/reviews', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const { rating, comment } = reviewSchema.parse(request.body);

    await prisma.shopReview.upsert({
      where: {
        shopId_userId: { shopId: id, userId: request.user!.userId },
      },
      update: { rating, comment },
      create: { shopId: id, userId: request.user!.userId, rating, comment },
    });

    // Ratingni qayta hisoblash
    const avg = await prisma.shopReview.aggregate({
      where: { shopId: id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.shop.update({
      where: { id },
      data: {
        rating: avg._avg.rating || 0,
        reviewCount: avg._count || 0,
      },
    });

    return reply.send({ success: true });
  });

  // ============================================
  // VENDOR: Do'kon boshqarish
  // ============================================

  /**
   * POST /vendor/shop
   * Do'kon yaratish
   */
  app.post(
    '/vendor/shop',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const body = createShopSchema.parse(request.body);
      const userId = request.user!.userId;

      // Telefon tasdiqlangan ekanligini tekshirish
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { phone: true, status: true },
      });
      if (!profile?.phone) {
        throw new AppError('Do\'kon yaratish uchun telefon raqamingiz tasdiqlangan bo\'lishi kerak', 400);
      }
      if (profile.status === 'blocked') {
        throw new AppError('Hisobingiz bloklangan', 403);
      }

      const existing = await prisma.shop.findUnique({ where: { ownerId: userId } });
      if (existing) throw new AppError('Sizda allaqachon do\'kon bor');

      const result = await prisma.$transaction(async (tx) => {
        const shop = await tx.shop.create({
          data: { 
            ...body,
            status: 'pending', // Admin tasdiqlashi kerak
            owner: { connect: { id: userId } }
          } as any,
        });

        // Vendor rolini admin tasdiqlagandan keyin beriladi
        // Hozircha foydalanuvchi o'z rolini saqlaydi

        return shop;
      });

      return reply.status(201).send({ 
        success: true, 
        data: result,
        message: 'Do\'kon yaratildi. Admin tasdiqlashini kuting.',
      });
    },
  );

  /**
   * PUT /vendor/shop
   * Do'kon ma'lumotlarini yangilash
   */
  app.put(
    '/vendor/shop',
    { preHandler: [authMiddleware, requireRole('vendor', 'admin')] },
    async (request, reply) => {
      const body = createShopSchema.partial().parse(request.body);

      const shop = await prisma.shop.update({
        where: { ownerId: request.user!.userId },
        data: body,
      });

      // Invalidate shops cache (SCAN-based, production-safe)
      try {
        const { cacheDeletePattern } = await import('../../config/redis.js');
        await cacheDeletePattern('shops:*');
      } catch { /* non-blocking */ }

      return reply.send({ success: true, data: shop });
    },
  );

  /**
   * GET /vendor/dashboard
   * Vendor statistika
   */
  app.get(
    '/vendor/dashboard',
    { preHandler: [authMiddleware, requireRole('vendor', 'admin')] },
    async (request, reply) => {
      const shop = await prisma.shop.findUnique({
        where: { ownerId: request.user!.userId },
      });

      if (!shop) throw new NotFoundError('Do\'kon');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalOrders, todayOrders, pendingOrders, productsCount] = await Promise.all([
        prisma.order.count({
          where: { items: { some: { shopId: shop.id } } },
        }),
        prisma.order.count({
          where: {
            items: { some: { shopId: shop.id } },
            createdAt: { gte: today },
          },
        }),
        prisma.order.count({
          where: {
            items: { some: { shopId: shop.id } },
            status: 'pending',
          },
        }),
        prisma.product.count({ where: { shopId: shop.id } }),
      ]);

      return reply.send({
        success: true,
        data: {
          shop,
          stats: {
            totalOrders,
            todayOrders,
            pendingOrders,
            productsCount,
            balance: Number(shop.balance),
          },
        },
      });
    },
  );

  // ============================================
  // SHOP FOLLOW / UNFOLLOW
  // ============================================

  /**
   * POST /shops/:id/follow
   * Do'konga obuna bo'lish
   */
  app.post('/shops/:id/follow', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    // Do'kon mavjudligini tekshirish
    const shop = await prisma.shop.findUnique({ where: { id }, select: { id: true } });
    if (!shop) throw new NotFoundError('Do\'kon');

    // Allaqachon follow qilganmi?
    const existing = await prisma.shopFollow.findUnique({
      where: { shopId_userId: { shopId: id, userId } },
    });

    if (existing) {
      return reply.send({ success: true, message: 'Allaqachon obuna bo\'lgansiz', isFollowing: true });
    }

    await prisma.shopFollow.create({
      data: { shopId: id, userId },
    });

    return reply.status(201).send({ success: true, isFollowing: true });
  });

  /**
   * DELETE /shops/:id/follow
   * Do'kondan obunani bekor qilish
   */
  app.delete('/shops/:id/follow', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const existing = await prisma.shopFollow.findUnique({
      where: { shopId_userId: { shopId: id, userId } },
    });

    if (!existing) {
      return reply.send({ success: true, message: 'Obuna mavjud emas', isFollowing: false });
    }

    await prisma.shopFollow.delete({
      where: { shopId_userId: { shopId: id, userId } },
    });

    return reply.send({ success: true, isFollowing: false });
  });

  /**
   * GET /shops/:id/is-following
   * Do'konga obuna bo'lganmi tekshirish
   */
  app.get('/shops/:id/is-following', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const existing = await prisma.shopFollow.findUnique({
      where: { shopId_userId: { shopId: id, userId } },
    });

    return reply.send({ success: true, isFollowing: !!existing });
  });

  /**
   * GET /shops/:id/followers/count
   * Do'kon obunachilar soni
   */
  app.get('/shops/:id/followers/count', async (request, reply) => {
    const { id } = request.params as { id: string };

    const count = await prisma.shopFollow.count({ where: { shopId: id } });

    return reply.send({ success: true, data: { count } });
  });

  /**
   * GET /user/followed-shops
   * Foydalanuvchi obuna bo'lgan do'konlar
   */
  app.get('/user/followed-shops', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
    const { skip, limit: lim } = parsePagination({ page, limit });

    const [follows, total] = await Promise.all([
      prisma.shopFollow.findMany({
        where: { userId },
        include: {
          shop: {
            select: {
              id: true, name: true, description: true, logoUrl: true,
              rating: true, reviewCount: true, isOpen: true,
              _count: { select: { products: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: lim,
      }),
      prisma.shopFollow.count({ where: { userId } }),
    ]);

    const shops = follows.map(f => f.shop);

    return reply.send({ success: true, data: { shops, total } });
  });
}
