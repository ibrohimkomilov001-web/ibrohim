import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, optionalAuth } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { validateProduct, calculateQualityScore } from '../../services/product-validation.service.js';
import { indexProduct, removeProductFromIndex, searchProducts } from '../../services/search.service.js';
import { cacheGet, cacheSet } from '../../config/redis.js';

// ============================================
// Validation Schemas
// ============================================

const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  nameUz: z.string().min(3).max(200).optional(),
  nameRu: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  descriptionUz: z.string().optional(),
  descriptionRu: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  colorId: z.string().uuid().optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  images: z.array(z.string()).default([]),
  stock: z.number().int().min(0).default(0),
  unit: z.string().default('dona'),
  minOrder: z.number().int().min(1).default(1),
  sku: z.string().optional(),
  weight: z.number().optional(),
});

const updateProductSchema = createProductSchema.partial();

const productFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  colorId: z.string().uuid().optional(),
  brandIds: z.string().optional(),
  colorIds: z.string().optional(),
  shopId: z.string().uuid().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  isFlashSale: z.coerce.boolean().optional(),
  hasDiscount: z.coerce.boolean().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'popular', 'rating']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

// ============================================
// Routes
// ============================================

export async function productRoutes(app: FastifyInstance): Promise<void> {

  // ============================================
  // PUBLIC: Qidiruv
  // ============================================

  /**
   * GET /search/popular
   * Mashhur qidiruv so'zlari (top 10)
   */
  app.get('/search/popular', async (_request, reply) => {
    const cached = await cacheGet<any>('search:popular');
    if (cached) return reply.send({ success: true, data: cached });

    const popular = await prisma.searchQuery.findMany({
      orderBy: { count: 'desc' },
      take: 10,
      select: { query: true, count: true },
    });

    await cacheSet('search:popular', popular, 300); // 5 min
    return reply.send({ success: true, data: popular });
  });

  /**
   * GET /search/suggest
   * Auto-suggest (debounce bilan ishlatiladi)
   */
  app.get('/search/suggest', async (request, reply) => {
    const { q } = request.query as { q?: string };
    if (!q || q.length < 2) return reply.send({ success: true, data: [] });

    // Avval Meilisearch'dan qidirish
    const meiliResult = await searchProducts(q, { limit: 5 });
    if (meiliResult && meiliResult.hits.length > 0) {
      const suggestions = meiliResult.hits.map((h: any) => ({
        id: h.id,
        name: h.nameUz || h.name,
        nameRu: h.nameRu,
        price: h.price,
        image: h.images?.[0] || null,
      }));
      return reply.send({ success: true, data: suggestions });
    }

    // DB fallback
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        status: 'active',
        OR: [
          { nameUz: { contains: q, mode: 'insensitive' } },
          { nameRu: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        nameUz: true,
        nameRu: true,
        price: true,
        images: true,
      },
      take: 5,
      orderBy: { salesCount: 'desc' },
    });

    const suggestions = products.map(p => ({
      id: p.id,
      name: p.nameUz || p.name,
      nameRu: p.nameRu,
      price: p.price,
      image: p.images?.[0] || null,
    }));

    return reply.send({ success: true, data: suggestions });
  });

  // ============================================
  // PUBLIC: Mahsulotlar
  // ============================================

  /**
   * GET /products/search
   * Meilisearch yordamida tezkor qidirish (fuzzy matching, typo tolerance)
   * Fallback: Database LIKE qidirish
   */
  app.get('/products/search', async (request, reply) => {
    const searchSchema = z.object({
      q: z.string().min(1).max(200),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      categoryId: z.string().uuid().optional(),
      shopId: z.string().uuid().optional(),
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),
      sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'popular']).optional(),
    });
    const params = searchSchema.parse(request.query);
    const offset = (params.page - 1) * params.limit;

    // Track search query (async, xatolik bo'lsa ham davom etadi)
    const normalizedQuery = params.q.toLowerCase().trim();
    prisma.searchQuery.upsert({
      where: { query: normalizedQuery },
      create: { query: normalizedQuery, count: 1 },
      update: { count: { increment: 1 }, lastSearchedAt: new Date() },
    }).catch(() => {});

    // Build Meilisearch filters
    const filters: string[] = ['status = active', 'stock > 0'];
    if (params.categoryId) filters.push(`categoryId = "${params.categoryId}"`);
    if (params.shopId) filters.push(`shopId = "${params.shopId}"`);
    if (params.minPrice !== undefined) filters.push(`price >= ${params.minPrice}`);
    if (params.maxPrice !== undefined) filters.push(`price <= ${params.maxPrice}`);

    // Build sort
    const sortMap: Record<string, string[]> = {
      price_asc: ['price:asc'],
      price_desc: ['price:desc'],
      rating: ['rating:desc'],
      newest: ['createdAt:desc'],
      popular: ['salesCount:desc'],
    };
    const sort = params.sort ? sortMap[params.sort] : undefined;

    // Try Meilisearch first
    const meiliResult = await searchProducts(params.q, {
      limit: params.limit,
      offset,
      filter: filters,
      sort,
    });

    if (meiliResult) {
      return reply.send({
        success: true,
        data: meiliResult.hits,
        meta: {
          total: meiliResult.totalHits,
          page: params.page,
          limit: params.limit,
          totalPages: Math.ceil(meiliResult.totalHits / params.limit),
          query: meiliResult.query,
          engine: 'meilisearch',
        },
      });
    }

    // Database fallback
    const where: any = {
      isActive: true,
      status: 'active',
      OR: [
        { name: { contains: params.q, mode: 'insensitive' } },
        { nameUz: { contains: params.q, mode: 'insensitive' } },
        { nameRu: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ],
    };
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.shopId) where.shopId = params.shopId;
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) where.price.gte = params.minPrice;
      if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (params.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (params.sort === 'price_desc') orderBy = { price: 'desc' };
    else if (params.sort === 'rating') orderBy = { rating: 'desc' };
    else if (params.sort === 'popular') orderBy = { salesCount: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, nameUz: true, nameRu: true } },
          brand: { select: { id: true, name: true } },
          shop: { select: { id: true, name: true } },
        },
        orderBy,
        skip: offset,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: products,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
        query: params.q,
        engine: 'database',
      },
    });
  });

  /**
   * GET /products
   * Mahsulotlar ro'yxati (filterlash, qidirish, saralash)
   */
  app.get('/products', { preHandler: optionalAuth }, async (request, reply) => {
    const filters = productFilterSchema.parse(request.query);

    const where: any = { isActive: true, status: 'active' };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.subcategoryId) where.subcategoryId = filters.subcategoryId;
    if (filters.brandIds) {
      const ids = filters.brandIds.split(',').filter((id: string) => id.trim());
      if (ids.length > 0) where.brandId = { in: ids };
    } else if (filters.brandId) {
      where.brandId = filters.brandId;
    }
    if (filters.colorIds) {
      const ids = filters.colorIds.split(',').filter((id: string) => id.trim());
      if (ids.length > 0) where.colorId = { in: ids };
    } else if (filters.colorId) {
      where.colorId = filters.colorId;
    }
    if (filters.shopId) where.shopId = filters.shopId;

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    // Flash sale filter
    if (filters.isFlashSale) {
      where.isFlashSale = true;
      where.flashSaleEnd = { gte: new Date() };
    }

    // Discount filter
    if (filters.hasDiscount) {
      where.discountPercent = { gt: 0 };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Saralash
    let orderBy: any = { createdAt: 'desc' };
    switch (filters.sortBy) {
      case 'price_asc': orderBy = { price: 'asc' }; break;
      case 'price_desc': orderBy = { price: 'desc' }; break;
      case 'newest': orderBy = { createdAt: 'desc' }; break;
      case 'popular': orderBy = { salesCount: 'desc' }; break;
      case 'rating': orderBy = { rating: 'desc' }; break;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          shop: { select: { id: true, name: true, logoUrl: true, rating: true } },
          category: { select: { id: true, nameUz: true, nameRu: true } },
          subcategory: { select: { id: true, nameUz: true, nameRu: true } },
          brand: { select: { id: true, name: true } },
          color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
        },
        orderBy,
        skip,
        take: filters.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        products,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      },
    });
  });

  /**
   * GET /products/featured
   * Tavsiya etilgan mahsulotlar
   * NOTE: Bu route /products/:id dan OLDIN bo'lishi kerak!
   */
  app.get('/products/featured', async (request, reply) => {
    const { limit } = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }).parse(request.query);

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        shop: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { salesCount: 'desc' },
      take: limit,
    });

    return reply.send({
      success: true,
      data: {
        products,
        pagination: { page: 1, limit, total: products.length, totalPages: 1 },
      },
    });
  });

  /**
   * GET /products/:id
   * Mahsulot tafsilotlari
   */
  app.get('/products/:id', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        shop: {
          select: { id: true, name: true, logoUrl: true, rating: true, reviewCount: true, phone: true },
        },
        category: true,
        subcategory: true,
        brand: true,
        color: true,
      },
    });

    if (!product) throw new NotFoundError('Mahsulot');

    // Ko'rish sonini oshirish (faqat autentifikatsiya qilingan foydalanuvchilar uchun, deduplicated)
    if (request.user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alreadyViewed = await prisma.productView.findFirst({
        where: {
          productId: id,
          userId: request.user.userId,
          createdAt: { gte: today },
        },
      });

      if (!alreadyViewed) {
        await prisma.product.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
        await prisma.productView.create({
          data: { productId: id, userId: request.user.userId },
        });
      }
    } else {
      // Anonim foydalanuvchilar: IP-based deduplikatsiya (1 soatda 1 marta)
      // Bu bot spam'dan himoya qiladi
      try {
        const { getRedis } = await import('../../config/redis.js');
        const redis = getRedis();
        const ip = request.ip || 'unknown';
        const cacheKey = `pv:${id}:${ip}`;
        
        if (redis && typeof redis.get === 'function') {
          const cached = await redis.get(cacheKey);
          if (!cached) {
            await prisma.product.update({
              where: { id },
              data: { viewCount: { increment: 1 } },
            });
            await redis.set(cacheKey, '1', { EX: 3600 }); // 1 soat
          }
        }
        // Redis yo'q bo'lsa — anonim viewCount o'smaydi (xavfsiz default)
      } catch {
        // Redis xatosi bo'lsa, viewCount increment qilmaymiz
      }
    }

    // Sevimlilarmi tekshirish
    let isFavorite = false;
    if (request.user) {
      const fav = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId: request.user.userId,
            productId: id,
          },
        },
      });
      isFavorite = !!fav;
    }

    return reply.send({
      success: true,
      data: { ...product, isFavorite },
    });
  });

  // ============================================
  // CATEGORIES
  // ============================================

  /**
   * GET /categories
   */
  app.get('/categories', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const parentId = query.parentId;

    // Agar parentId berilgan bo'lsa, shu kategoriyaning subcategory-larini qaytarish
    if (parentId) {
      const cacheKey = `categories:parent:${parentId}`;
      const cached = await cacheGet<any>(cacheKey);
      if (cached) return reply.send({ success: true, data: cached });

      const subcategories = await prisma.subcategory.findMany({
        where: { categoryId: parentId, isActive: true },
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { sortOrder: 'asc' },
      });

      await cacheSet(cacheKey, subcategories, 300);
      return reply.send({ success: true, data: subcategories });
    }

    // Redis cache — 5 daqiqa (kategoriyalar kamdan-kam o'zgaradi)
    const cached = await cacheGet<any>('categories:all');
    if (cached) return reply.send({ success: true, data: cached });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    await cacheSet('categories:all', categories, 300); // 5 min
    return reply.send({ success: true, data: categories });
  });

  /**
   * GET /categories/:id — birta kategoriya
   */
  app.get('/categories/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
    });
    if (!category) {
      return reply.status(404).send({ success: false, message: 'Kategoriya topilmadi' });
    }
    return reply.send({ success: true, data: category });
  });

  /**
   * GET /brands
   */
  app.get('/brands', async (request, reply) => {
    const { categoryId } = request.query as { categoryId?: string };
    const cacheKey = categoryId ? `brands:cat:${categoryId}` : 'brands:all';

    const cached = await cacheGet<any>(cacheKey);
    if (cached) return reply.send({ success: true, data: cached });

    const where: any = {};
    if (categoryId) {
      where.products = { some: { categoryId } };
    }
    const brands = await prisma.brand.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });

    await cacheSet(cacheKey, brands, 300); // 5 min
    return reply.send({ success: true, data: brands });
  });

  /**
   * GET /colors
   */
  app.get('/colors', async (request, reply) => {
    const cached = await cacheGet<any>('colors:all');
    if (cached) return reply.send({ success: true, data: cached });

    const colors = await prisma.color.findMany({ orderBy: { nameUz: 'asc' } });
    await cacheSet('colors:all', colors, 600); // 10 min
    return reply.send({ success: true, data: colors });
  });

  // ============================================
  // VENDOR: Mahsulot boshqarish
  // ============================================

  /**
   * POST /vendor/products
   * Yangi mahsulot qo'shish
   */
  app.post(
    '/vendor/products',
    { preHandler: [authMiddleware, requireRole('vendor', 'admin')] },
    async (request, reply) => {
      const body = createProductSchema.parse(request.body);

      const shop = await prisma.shop.findUnique({
        where: { ownerId: request.user!.userId },
      });

      if (!shop) throw new AppError('Do\'kon topilmadi');

      // Shop tasdiqlanganligini tekshirish
      if (shop.status !== 'active') {
        throw new AppError('Do\'koningiz hali tasdiqlanmagan. Mahsulot qo\'shish uchun admin tasdig\'ini kuting', 403);
      }

      // Auto-moderation: validate product data
      const validation = validateProduct({
        nameUz: body.nameUz || body.name,
        nameRu: body.nameRu || body.name,
        descriptionUz: body.descriptionUz || body.description || '',
        descriptionRu: body.descriptionRu || body.description || '',
        images: body.images,
        price: body.price,
        categoryId: body.categoryId,
        stock: body.stock,
      });

      const qualityScore = calculateQualityScore({
        nameUz: body.nameUz || body.name,
        nameRu: body.nameRu || body.name,
        descriptionUz: body.descriptionUz || body.description || '',
        descriptionRu: body.descriptionRu || body.description || '',
        images: body.images,
        price: body.price,
        originalPrice: body.originalPrice,
        categoryId: body.categoryId,
        brandId: body.brandId,
        colorId: body.colorId,
        sku: body.sku,
        weight: body.weight,
        stock: body.stock,
      });

      // Determine status based on validation
      const status = validation.isValid ? 'active' : 'has_errors';

      const { categoryId, subcategoryId, brandId, colorId, ...restBody } = body;

      const product = await prisma.product.create({
        data: {
          ...restBody,
          nameUz: body.nameUz || body.name,
          nameRu: body.nameRu || body.name,
          descriptionUz: body.descriptionUz || body.description || null,
          descriptionRu: body.descriptionRu || body.description || null,
          status,
          qualityScore,
          validationErrors: validation.isValid ? [] : validation.errors.map(e => e.message),
          thumbnailUrl: body.images?.[0] || null,
          moderatedAt: new Date(),
          shop: { connect: { id: shop.id } },
          ...(categoryId && { category: { connect: { id: categoryId } } }),
          ...(subcategoryId && { subcategory: { connect: { id: subcategoryId } } }),
          ...(brandId && { brand: { connect: { id: brandId } } }),
          ...(colorId && { color: { connect: { id: colorId } } }),
        } as any,
        include: {
          category: { select: { id: true, nameUz: true, nameRu: true } },
          shop: { select: { id: true, name: true } },
        },
      });

      // Index in Meilisearch if active
      if (status === 'active') {
        try { await indexProduct(product); } catch (e) { /* non-blocking */ }
      }

      // Create moderation log
      await prisma.productModerationLog.create({
        data: {
          productId: product.id,
          action: status === 'active' ? 'auto_approved' : 'auto_rejected',
          reason: status === 'active' 
            ? `Avtomatik tasdiqlandi. Sifat balli: ${qualityScore}/100`
            : `Xatoliklar topildi: ${validation.errors.map(e => e.message).join(', ')}`,
        },
      });

      return reply.status(201).send({
        success: true,
        data: {
          ...product,
          qualityScore,
          validationErrors: validation.errors,
          moderationStatus: status,
        },
      });
    },
  );

  /**
   * PUT /vendor/products/:id
   */
  app.put(
    '/vendor/products/:id',
    { preHandler: [authMiddleware, requireRole('vendor', 'admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateProductSchema.parse(request.body);

      const shop = await prisma.shop.findUnique({
        where: { ownerId: request.user!.userId },
      });

      if (!shop) throw new AppError('Do\'kon topilmadi');

      const product = await prisma.product.findFirst({
        where: { id, shopId: shop.id },
      });

      if (!product) throw new NotFoundError('Mahsulot');

      // Merge existing data with updates for validation
      const merged = {
        nameUz: body.nameUz || body.name || (product as any).nameUz || product.name,
        nameRu: body.nameRu || body.name || (product as any).nameRu || product.name,
        descriptionUz: body.descriptionUz || body.description || (product as any).descriptionUz || product.description || '',
        descriptionRu: body.descriptionRu || body.description || (product as any).descriptionRu || product.description || '',
        images: body.images || product.images as string[],
        price: body.price || Number(product.price),
        categoryId: body.categoryId || product.categoryId,
        stock: body.stock ?? product.stock,
        originalPrice: body.originalPrice || (product.originalPrice ? Number(product.originalPrice) : undefined),
        brandId: body.brandId || product.brandId,
        colorId: body.colorId || product.colorId,
        sku: body.sku || (product as any).sku,
        weight: body.weight || (product as any).weight,
      };

      const validation = validateProduct(merged);
      const qualityScore = calculateQualityScore(merged);
      const status = validation.isValid ? 'active' : 'has_errors';

      const updated = await prisma.product.update({
        where: { id },
        data: {
          ...body,
          nameUz: merged.nameUz,
          nameRu: merged.nameRu,
          descriptionUz: merged.descriptionUz || null,
          descriptionRu: merged.descriptionRu || null,
          status,
          qualityScore,
          validationErrors: validation.isValid ? [] : validation.errors.map(e => e.message),
          thumbnailUrl: merged.images?.[0] || (product as any).thumbnailUrl,
          moderatedAt: new Date(),
        } as any,
        include: {
          category: { select: { id: true, nameUz: true, nameRu: true } },
          shop: { select: { id: true, name: true } },
        },
      });

      // Update Meilisearch index
      try {
        if (status === 'active') {
          await indexProduct(updated);
        } else {
          await removeProductFromIndex(id);
        }
      } catch (e) { /* non-blocking */ }

      // Create moderation log
      await prisma.productModerationLog.create({
        data: {
          productId: id,
          action: 'revalidated',
          reason: `Qayta tekshirildi. Status: ${status}, Sifat: ${qualityScore}/100`,
        },
      });

      return reply.send({
        success: true,
        data: {
          ...updated,
          qualityScore,
          validationErrors: validation.errors,
          moderationStatus: status,
        },
      });
    },
  );

  /**
   * DELETE /vendor/products/:id
   */
  app.delete(
    '/vendor/products/:id',
    { preHandler: [authMiddleware, requireRole('vendor', 'admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const shop = await prisma.shop.findUnique({
        where: { ownerId: request.user!.userId },
      });

      if (!shop) throw new AppError('Do\'kon topilmadi');

      await prisma.product.deleteMany({
        where: { id, shopId: shop.id },
      });

      // Remove from search index
      try { await removeProductFromIndex(id); } catch (e) { /* non-blocking */ }

      return reply.send({ success: true });
    },
  );

  // ============================================
  // Product Reviews
  // ============================================

  const createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
    images: z.array(z.string().url()).max(5).default([]),
    orderId: z.string().uuid().optional(),
  });

  /**
   * GET /products/:id/reviews
   * Mahsulot sharhlari
   */
  app.get('/products/:id/reviews', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };

    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pg - 1) * lim;

    const [reviews, total, stats] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId: id },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: lim,
      }),
      prisma.productReview.count({ where: { productId: id } }),
      prisma.productReview.aggregate({
        where: { productId: id },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Rating taqsimoti
    const ratingDistribution = await prisma.productReview.groupBy({
      by: ['rating'],
      where: { productId: id },
      _count: { rating: true },
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach(r => { distribution[r.rating] = r._count.rating; });

    return reply.send({
      success: true,
      data: reviews,
      meta: {
        total,
        page: pg,
        limit: lim,
        totalPages: Math.ceil(total / lim),
        averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
        totalReviews: stats._count.rating,
        ratingDistribution: distribution,
      },
    });
  });

  /**
   * POST /products/:id/reviews
   * Sharh qoldirish (faqat autentifikatsiya qilingan foydalanuvchilar)
   */
  app.post('/products/:id/reviews', { preHandler: authMiddleware }, async (request, reply) => {
    const { id: productId } = request.params as { id: string };
    const userId = request.user!.userId;
    const body = createReviewSchema.parse(request.body);

    // Mahsulot mavjudligini tekshirish
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true },
    });
    if (!product) throw new NotFoundError('Mahsulot');

    // Foydalanuvchi bu mahsulotga allaqachon sharh qoldirganmi
    const existingReview = await prisma.productReview.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existingReview) {
      throw new AppError('Siz bu mahsulotga allaqachon sharh qoldirgansiz', 409);
    }

    // Agar orderId berilgan bo'lsa — buyurtma tegishli ekanligini tekshirish
    if (body.orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: body.orderId,
          userId,
          status: 'delivered',
          items: { some: { productId } },
        },
      });
      if (!order) {
        throw new AppError('Bu buyurtma topilmadi yoki hali yetkazilmagan', 400);
      }
    }

    const review = await prisma.productReview.create({
      data: {
        productId,
        userId,
        orderId: body.orderId || null,
        rating: body.rating,
        comment: body.comment,
        images: body.images,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return reply.status(201).send({ success: true, data: review });
  });

  /**
   * PUT /products/:id/reviews
   * O'z sharhini yangilash
   */
  app.put('/products/:id/reviews', { preHandler: authMiddleware }, async (request, reply) => {
    const { id: productId } = request.params as { id: string };
    const userId = request.user!.userId;
    const body = createReviewSchema.partial().parse(request.body);

    const existing = await prisma.productReview.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (!existing) throw new NotFoundError('Sharh');

    const review = await prisma.productReview.update({
      where: { id: existing.id },
      data: {
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.comment !== undefined && { comment: body.comment }),
        ...(body.images !== undefined && { images: body.images }),
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return reply.send({ success: true, data: review });
  });

  /**
   * DELETE /products/:id/reviews
   * O'z sharhini o'chirish
   */
  app.delete('/products/:id/reviews', { preHandler: authMiddleware }, async (request, reply) => {
    const { id: productId } = request.params as { id: string };
    const userId = request.user!.userId;

    const existing = await prisma.productReview.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (!existing) throw new NotFoundError('Sharh');

    await prisma.productReview.delete({ where: { id: existing.id } });
    return reply.send({ success: true, message: 'Sharh o\'chirildi' });
  });
}
