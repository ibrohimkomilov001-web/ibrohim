import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import * as shopRepo from '../../repositories/shop.repository.js';
import * as shopReviewRepo from '../../repositories/shop-review.repository.js';
import * as shopFollowRepo from '../../repositories/shop-follow.repository.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';

const idParamSchema = z.object({ id: z.string().uuid('Noto\'g\'ri ID formati') });

const createShopSchema = z.object({
  name: z.string().min(2).max(200),
  nameRu: z.string().max(200).optional(),
  description: z.string().optional(),
  descriptionRu: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  telegram: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  fulfillmentType: z.enum(['FBS', 'DBS']).optional(),
  isOpen: z.boolean().optional(),
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

    const { page: pg, limit: lim, skip } = parsePagination({ page, limit });

    const data = await shopRepo.findListCached({
      page: pg,
      limit: lim,
      skip,
      search,
    });

    return reply.send({ success: true, data });
  });

  /**
   * GET /shops/by-slug/:slug
   * Slug bo'yicha do'konni olish (public shop page uchun)
   */
  app.get('/shops/by-slug/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    if (!slug || slug.length < 2) {
      throw new AppError('Slug noto\'g\'ri', 400);
    }

    const shop = await shopRepo.findBySlugPublic(slug.toLowerCase());

    if (!shop || shop.status !== 'active') {
      throw new NotFoundError('Do\'kon');
    }

    return reply.send({ success: true, data: shop });
  });

  /**
   * GET /shops/:id
   */
  app.get('/shops/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const shop = await shopRepo.findByIdPublic(id);

    if (!shop) throw new NotFoundError('Do\'kon');

    return reply.send({ success: true, data: shop });
  });

  /**
   * GET /shops/:id/products
   */
  app.get('/shops/:id/products', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
    const { limit: lim2, skip: skip2 } = parsePagination({ page, limit });

    const data = await shopRepo.findProductsForShop(id, {
      skip: skip2,
      take: lim2,
    });

    return reply.send({ success: true, data });
  });

  /**
   * GET /shops/:id/reviews
   */
  app.get('/shops/:id/reviews', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
    const { page: pg, limit: lim, skip } = parsePagination({ page, limit });

    const { reviews, total } = await shopReviewRepo.findByShop(id, {
      skip,
      take: lim,
    });

    return reply.send({
      success: true,
      data: reviews,
      pagination: paginationMeta(pg, lim, total),
    });
  });

  /**
   * POST /shops/:id/reviews
   */
  const reviewSchema = z.object({
    rating: z.number().int().min(1, 'Baho kamida 1').max(5, 'Baho 5 dan oshmasligi kerak'),
    comment: z.string().max(500).optional(),
  });
  app.post('/shops/:id/reviews', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const { rating, comment } = reviewSchema.parse(request.body);

    await shopReviewRepo.upsert(id, request.user!.userId, { rating, comment });
    await shopReviewRepo.recalcShopRating(id);

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

      // Ownership — Shop.ownerId @unique; repo.updateForOwner queries by id+ownerId,
      // but here we don't have shopId. Lookup first, then update.
      const existingShop = await prisma.shop.findUnique({
        where: { ownerId: request.user!.userId },
      });
      if (!existingShop) throw new NotFoundError('Do\'kon');

      const updatedShop = await prisma.shop.update({
        where: { ownerId: request.user!.userId },
        data: body,
      });

      await shopRepo.invalidateCache(existingShop.id);
      await shopRepo.invalidateListCache();

      return reply.send({ success: true, data: updatedShop });
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

    const existing = await shopFollowRepo.find(userId, id);

    if (existing) {
      return reply.send({ success: true, message: 'Allaqachon obuna bo\'lgansiz', isFollowing: true });
    }

    await shopFollowRepo.follow(userId, id);

    return reply.status(201).send({ success: true, isFollowing: true });
  });

  /**
   * DELETE /shops/:id/follow
   * Do'kondan obunani bekor qilish
   */
  app.delete('/shops/:id/follow', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const existing = await shopFollowRepo.find(userId, id);

    if (!existing) {
      return reply.send({ success: true, message: 'Obuna mavjud emas', isFollowing: false });
    }

    await shopFollowRepo.unfollow(userId, id);

    return reply.send({ success: true, isFollowing: false });
  });

  /**
   * GET /shops/:id/is-following
   * Do'konga obuna bo'lganmi tekshirish
   */
  app.get('/shops/:id/is-following', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const existing = await shopFollowRepo.find(userId, id);

    return reply.send({ success: true, isFollowing: !!existing });
  });

  /**
   * GET /shops/:id/followers/count
   * Do'kon obunachilar soni
   */
  app.get('/shops/:id/followers/count', async (request, reply) => {
    const { id } = request.params as { id: string };

    const count = await shopFollowRepo.countByShop(id);

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

    const { follows, total } = await shopFollowRepo.findByUser(userId, {
      skip,
      take: lim,
    });

    const shops = follows.map((f: { shop: unknown }) => f.shop);

    return reply.send({ success: true, data: { shops, total } });
  });
}
