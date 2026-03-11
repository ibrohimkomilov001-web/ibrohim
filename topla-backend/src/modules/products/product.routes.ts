import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, optionalAuth } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { validateProduct, calculateQualityScore } from '../../services/product-validation.service.js';
import { indexProduct, removeProductFromIndex, searchProducts } from '../../services/search.service.js';
import { enqueueSearchIndex } from '../../services/queue.service.js';
import { cacheGet, cacheSet, cacheDelete } from '../../config/redis.js';
import { CacheKeys } from '../../utils/constants.js';

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
  warranty: z.string().optional(), // kafolat muddati
  // Variant support
  hasVariants: z.boolean().optional(),
  variants: z.array(z.object({
    colorId: z.string().uuid().nullable().optional(),
    sizeId: z.string().uuid().nullable().optional(),
    price: z.number().positive(),
    compareAtPrice: z.number().positive().nullable().optional(),
    stock: z.number().int().min(0).default(0),
    sku: z.string().nullable().optional(),
    images: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })).optional(),
});

const updateProductSchema = createProductSchema.partial();

const productFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  colorId: z.string().uuid().optional(),
  brandIds: z.string().optional(),
  colorIds: z.string().optional(),
  sizeIds: z.string().optional(),
  shopId: z.string().uuid().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  search: z.string().optional(),
  isFlashSale: z.coerce.boolean().optional(),
  hasDiscount: z.coerce.boolean().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'popular', 'rating', 'discount']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
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
    const cached = await cacheGet<any>(CacheKeys.SEARCH_POPULAR);
    if (cached) return reply.send({ success: true, data: cached });

    const popular = await prisma.searchQuery.findMany({
      orderBy: { count: 'desc' },
      take: 10,
      select: { query: true, count: true },
    });

    await cacheSet(CacheKeys.SEARCH_POPULAR, popular, 300); // 5 min
    return reply.send({ success: true, data: popular });
  });

  /**
   * GET /search/suggest
   * Auto-suggest (debounce bilan ishlatiladi)
   */
  app.get('/search/suggest', async (request, reply) => {
    const { q } = request.query as { q?: string };
    if (!q || q.length < 2) return reply.send({ success: true, data: [] });

    // Track suggest query (3+ characters only, async)
    if (q.length >= 3) {
      const normalizedQ = q.toLowerCase().trim();
      prisma.searchQuery.upsert({
        where: { query: normalizedQ },
        create: { query: normalizedQ, count: 1 },
        update: { count: { increment: 1 }, lastSearchedAt: new Date() },
      }).catch(() => {});
    }

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
      brandIds: z.string().optional(),
      colorIds: z.string().optional(),
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),
      minRating: z.coerce.number().min(0).max(5).optional(),
      inStock: z.coerce.boolean().optional(),
      hasDiscount: z.coerce.boolean().optional(),
      sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'popular']).optional(),
    });
    const params = searchSchema.parse(request.query);
    const offset = (params.page - 1) * params.limit;

    // Check Redis cache first
    const cacheKey = `search:${params.q.toLowerCase().trim()}:${params.page}:${params.limit}:${params.sort || 'default'}:${params.categoryId || ''}:${params.shopId || ''}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return reply.send(cached);

    // Track search query (async, xatolik bo'lsa ham davom etadi)
    const normalizedQuery = params.q.toLowerCase().trim();
    prisma.searchQuery.upsert({
      where: { query: normalizedQuery },
      create: { query: normalizedQuery, count: 1 },
      update: { count: { increment: 1 }, lastSearchedAt: new Date() },
    }).catch(() => {});

    // Build Meilisearch filters
    const filters: string[] = ['status = active'];
    if (params.categoryId) filters.push(`categoryId = "${params.categoryId}"`);
    if (params.shopId) filters.push(`shopId = "${params.shopId}"`);
    if (params.minPrice !== undefined) filters.push(`price >= ${params.minPrice}`);
    if (params.maxPrice !== undefined) filters.push(`price <= ${params.maxPrice}`);
    if (params.minRating !== undefined) filters.push(`rating >= ${params.minRating}`);
    if (params.inStock) filters.push(`stock > 0`);
    if (params.brandIds) {
      const ids = params.brandIds.split(',').filter((id: string) => id.trim());
      if (ids.length > 0) {
        const brandFilter = ids.map((id: string) => `brandId = "${id.trim()}"`).join(' OR ');
        filters.push(`(${brandFilter})`);
      }
    }
    if (params.colorIds) {
      const ids = params.colorIds.split(',').filter((id: string) => id.trim());
      if (ids.length > 0) {
        const colorFilter = ids.map((id: string) => `colorId = "${id.trim()}"`).join(' OR ');
        filters.push(`(${colorFilter})`);
      }
    }

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
      const response = {
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
      };
      // Cache for 45 seconds
      cacheSet(cacheKey, response, 45).catch(() => {});
      return reply.send(response);
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
    if (params.brandIds) {
      const ids = params.brandIds.split(',').filter((id: string) => id.trim());
      if (ids.length > 0) where.brandId = { in: ids };
    }
    if (params.colorIds) {
      const ids = params.colorIds.split(',').filter((id: string) => id.trim());
      if (ids.length > 0) where.colorId = { in: ids };
    }
    if (params.minRating !== undefined) {
      where.rating = { gte: params.minRating };
    }
    if (params.inStock) {
      where.stock = { gt: 0 };
    }
    if (params.hasDiscount) {
      where.discountPercent = { gt: 0 };
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

    const response = {
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
    };
    // Cache for 45 seconds
    cacheSet(cacheKey, response, 45).catch(() => {});
    return reply.send(response);
  });

  /**
   * GET /products
   * Mahsulotlar ro'yxati (filterlash, qidirish, saralash)
   */
  app.get('/products', { preHandler: optionalAuth }, async (request, reply) => {
    const filters = productFilterSchema.parse(request.query);

    const where: any = { isActive: true, status: 'active' };

    // 3-level category: agar L0 yoki L1 tanlangan bo'lsa, barcha avlodlarni topamiz
    if (filters.categoryId) {
      const descendants = await prisma.category.findMany({
        where: {
          OR: [
            { id: filters.categoryId },
            { parentId: filters.categoryId },
            { parent: { parentId: filters.categoryId } },
          ],
        },
        select: { id: true },
      });
      const catIds = descendants.map(d => d.id);
      where.categoryId = catIds.length > 1 ? { in: catIds } : filters.categoryId;
    }
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
    // Size filter (variant-based)
    if (filters.sizeIds) {
      const ids = filters.sizeIds.split(',').filter((id: string) => id.trim());
      if (ids.length > 0) {
        where.variants = { some: { sizeId: { in: ids }, isActive: true } };
      }
    }
    if (filters.shopId) where.shopId = filters.shopId;

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    // Rating filter
    if (filters.minRating !== undefined) {
      where.rating = { gte: filters.minRating };
    }

    // In stock filter
    if (filters.inStock) {
      where.stock = { gt: 0 };
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
        { nameUz: { contains: filters.search, mode: 'insensitive' } },
        { nameRu: { contains: filters.search, mode: 'insensitive' } },
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
      case 'discount': orderBy = { discountPercent: 'desc' }; break;
    }

    const skip = (filters.page - 1) * filters.limit;

    // Cache: mahsulotlar ro'yxati (60 sek)
    const prodCacheKey = `products:${JSON.stringify({w: where, o: orderBy, s: skip, l: filters.limit})}`;
    const cachedProducts = await cacheGet<any>(prodCacheKey);
    if (cachedProducts) {
      return reply.send(cachedProducts);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          shop: { select: { id: true, name: true, logoUrl: true, rating: true } },
          category: {
            select: {
              id: true, nameUz: true, nameRu: true, level: true,
              parent: { select: { id: true, nameUz: true, nameRu: true, parent: { select: { id: true, nameUz: true, nameRu: true } } } },
            },
          },
          brand: { select: { id: true, name: true } },
          color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
        },
        orderBy,
        skip,
        take: filters.limit,
      }),
      prisma.product.count({ where }),
    ]);

    const prodResponse = {
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
    };

    cacheSet(prodCacheKey, prodResponse, 60).catch(() => {});
    return reply.send(prodResponse);
  });

  /**
   * GET /products/featured
   * Tavsiya etilgan mahsulotlar
   * NOTE: Bu route /products/:id dan OLDIN bo'lishi kerak!
   */
  app.get('/products/featured', async (request, reply) => {
    const { limit } = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }).parse(request.query);

    // Cache: featured mahsulotlar (120 sek)
    const featCacheKey = `products:featured:${limit}`;
    const cachedFeat = await cacheGet<any>(featCacheKey);
    if (cachedFeat) return reply.send(cachedFeat);

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        shop: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { salesCount: 'desc' },
      take: limit,
    });

    const featResponse = {
      success: true,
      data: {
        products,
        pagination: { page: 1, limit, total: products.length, totalPages: 1 },
      },
    };

    cacheSet(featCacheKey, featResponse, 120).catch(() => {});
    return reply.send(featResponse);
  });

  /**
   * GET /products/:id
   * Mahsulot tafsilotlari
   */
  app.get('/products/:id', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    // Cache: mahsulot tafsilotlari (60 sek)
    const prodDetailKey = `product:detail:${id}`;
    let product = await cacheGet<any>(prodDetailKey);

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id },
        include: {
          shop: {
            select: { id: true, name: true, logoUrl: true, rating: true, reviewCount: true, phone: true },
          },
          category: {
            include: {
              parent: { include: { parent: true } },
            },
          },
          brand: true,
          color: true,
          variants: {
            where: { isActive: true },
            include: {
              color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
              size: { select: { id: true, nameUz: true, nameRu: true } },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
      if (product) cacheSet(prodDetailKey, product, 60).catch(() => {});
    }

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

    // 🎨 Color siblings: shu mahsulotning boshqa ranglardagi versiyalari
    let colorSiblings: any[] = [];
    if (product.colorId && product.shopId) {
      try {
        const siblings = await prisma.product.findMany({
          where: {
            shopId: product.shopId,
            nameUz: product.nameUz,
            colorId: { not: null },
            isActive: true,
            status: 'active',
            id: { not: product.id }, // o'zini chiqarma
          },
          select: {
            id: true,
            nameUz: true,
            nameRu: true,
            price: true,
            images: true,
            thumbnailUrl: true,
            stock: true,
            color: {
              select: { id: true, nameUz: true, nameRu: true, hexCode: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 10,
        });
        // O'zini ham qo'shamiz (birinchi bo'lib)
        colorSiblings = [
          {
            id: product.id,
            nameUz: product.nameUz,
            nameRu: product.nameRu,
            price: product.price,
            images: product.images,
            thumbnailUrl: product.thumbnailUrl,
            stock: product.stock,
            color: product.color,
          },
          ...siblings,
        ];
      } catch {
        // Xatolik bo'lsa bo'sh ro'yxat
      }
    }

    return reply.send({
      success: true,
      data: { ...product, isFavorite, colorSiblings },
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
    const tree = query.tree === 'true';
    const level = query.level !== undefined ? parseInt(query.level, 10) : undefined;

    // Agar parentId berilgan bo'lsa, shu kategoriyaning children'larini qaytarish
    if (parentId) {
      const cacheKey = `categories:parent:${parentId}`;
      const cached = await cacheGet<any>(cacheKey);
      if (cached) return reply.send({ success: true, data: cached });

      const children = await prisma.category.findMany({
        where: { parentId, isActive: true },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { products: true } },
        },
        orderBy: { sortOrder: 'asc' },
      });

      await cacheSet(cacheKey, children, 300);
      return reply.send({ success: true, data: children });
    }

    // Redis cache — 5 daqiqa
    const treeSuffix = tree ? ':tree' : (level !== undefined ? `:level${level}` : '');
    const cacheKey = `${CacheKeys.CATEGORIES_ALL}${treeSuffix}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return reply.send({ success: true, data: cached });

    // Full 3-level tree
    if (tree) {
      const categories = await prisma.category.findMany({
        where: { isActive: true, level: 0 },
        include: {
          children: {
            where: { isActive: true },
            include: {
              children: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { products: true } },
        },
        orderBy: { sortOrder: 'asc' },
      });
      await cacheSet(cacheKey, categories, 300);
      return reply.send({ success: true, data: categories });
    }

    // Level filter yoki default (L0 + L1 children)
    const categories = await prisma.category.findMany({
      where: { isActive: true, ...(level !== undefined ? { level } : { level: 0 }) },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    await cacheSet(cacheKey, categories, 300);
    return reply.send({ success: true, data: categories });
  });

  /**
   * GET /categories/:id — birta kategoriya
   */
  app.get('/categories/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        parent: { select: { id: true, nameUz: true, nameRu: true, slug: true } },
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
    const cacheKey = categoryId ? CacheKeys.brandsForCategory(categoryId) : CacheKeys.BRANDS_ALL;

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
   * Ranglar ro'yxati (categoryId bilan filtrlanishi mumkin)
   */
  app.get('/colors', async (request, reply) => {
    const { categoryId } = request.query as { categoryId?: string };
    const cacheKey = categoryId ? `colors:cat:${categoryId}` : CacheKeys.COLORS_ALL;

    const cached = await cacheGet<any>(cacheKey);
    if (cached) return reply.send({ success: true, data: cached });

    if (categoryId) {
      // Faqat shu kategoriyada mahsuloti bor ranglar
      const descendants = await prisma.category.findMany({
        where: { OR: [{ id: categoryId }, { parentId: categoryId }, { parent: { parentId: categoryId } }] },
        select: { id: true },
      });
      const catIds = descendants.map(d => d.id);

      const colors = await prisma.color.findMany({
        where: { products: { some: { categoryId: { in: catIds }, isActive: true, status: 'active' } } },
        orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
      });
      await cacheSet(cacheKey, colors, 300);
      return reply.send({ success: true, data: colors });
    }

    const colors = await prisma.color.findMany({ orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }] });
    await cacheSet(CacheKeys.COLORS_ALL, colors, 600);
    return reply.send({ success: true, data: colors });
  });

  /**
   * GET /sizes
   * O'lchamlar ro'yxati (categoryId bilan filtrlanishi mumkin)
   */
  app.get('/sizes', async (request, reply) => {
    const { categoryId } = request.query as { categoryId?: string };
    const cacheKey = categoryId ? `sizes:cat:${categoryId}` : 'sizes:all';

    const cached = await cacheGet<any>(cacheKey);
    if (cached) return reply.send({ success: true, data: cached });

    if (categoryId) {
      const descendants = await prisma.category.findMany({
        where: { OR: [{ id: categoryId }, { parentId: categoryId }, { parent: { parentId: categoryId } }] },
        select: { id: true },
      });
      const catIds = descendants.map(d => d.id);

      const sizes = await prisma.size.findMany({
        where: { variants: { some: { product: { categoryId: { in: catIds }, isActive: true, status: 'active' } } } },
        orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
      });
      await cacheSet(cacheKey, sizes, 300);
      return reply.send({ success: true, data: sizes });
    }

    const sizes = await prisma.size.findMany({ orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }] });
    await cacheSet('sizes:all', sizes, 600);
    return reply.send({ success: true, data: sizes });
  });

  /**
   * GET /products/facets
   * Fasetli filtr ma'lumotlari — kategoriya bo'yicha brendlar, ranglar, o'lchamlar
   * soni bilan, narx oralig'i, chegirmali va stokdagi mahsulotlar soni
   */
  app.get('/products/facets', async (request, reply) => {
    const { categoryId } = z.object({ categoryId: z.string().uuid() }).parse(request.query);

    const facetCacheKey = `facets:${categoryId}`;
    const cached = await cacheGet<any>(facetCacheKey);
    if (cached) return reply.send({ success: true, data: cached });

    // Barcha descendant kategoriyalarni topish
    const descendants = await prisma.category.findMany({
      where: { OR: [{ id: categoryId }, { parentId: categoryId }, { parent: { parentId: categoryId } }] },
      select: { id: true },
    });
    const catIds = descendants.map(d => d.id);
    const baseWhere = { categoryId: { in: catIds }, isActive: true, status: 'active' as const };

    // Parallel so'rovlar
    const [
      brandFacets,
      colorFacets,
      sizeFacets,
      priceAgg,
      discountCount,
      inStockCount,
      totalCount,
    ] = await Promise.all([
      // Brendlar va soni
      prisma.brand.findMany({
        where: { products: { some: baseWhere } },
        select: { id: true, name: true, logoUrl: true, _count: { select: { products: { where: baseWhere } } } },
        orderBy: { name: 'asc' },
      }),
      // Ranglar va soni
      prisma.color.findMany({
        where: { products: { some: baseWhere } },
        select: { id: true, nameUz: true, nameRu: true, hexCode: true, _count: { select: { products: { where: baseWhere } } } },
        orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
      }),
      // O'lchamlar va soni (variantlar orqali)
      prisma.size.findMany({
        where: { variants: { some: { product: baseWhere, isActive: true } } },
        select: {
          id: true, nameUz: true, nameRu: true,
          _count: { select: { variants: { where: { product: baseWhere, isActive: true } } } },
        },
        orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
      }),
      // Min/Max narx
      prisma.product.aggregate({
        where: baseWhere,
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true },
      }),
      // Chegirmali mahsulotlar soni
      prisma.product.count({
        where: { ...baseWhere, discountPercent: { gt: 0 } },
      }),
      // Stokdagi mahsulotlar soni
      prisma.product.count({
        where: { ...baseWhere, stock: { gt: 0 } },
      }),
      // Jami mahsulotlar soni
      prisma.product.count({ where: baseWhere }),
    ]);

    const facets = {
      brands: brandFacets.map(b => ({ id: b.id, name: b.name, logoUrl: b.logoUrl, count: b._count.products })),
      colors: colorFacets.map(c => ({ id: c.id, nameUz: c.nameUz, nameRu: c.nameRu, hexCode: c.hexCode, count: c._count.products })),
      sizes: sizeFacets.map(s => ({ id: s.id, nameUz: s.nameUz, nameRu: s.nameRu, count: s._count.variants })),
      priceRange: {
        min: priceAgg._min.price ? Number(priceAgg._min.price) : 0,
        max: priceAgg._max.price ? Number(priceAgg._max.price) : 0,
        avg: priceAgg._avg.price ? Number(priceAgg._avg.price) : 0,
      },
      discountCount,
      inStockCount,
      totalCount,
    };

    await cacheSet(facetCacheKey, facets, 180); // 3 min cache
    return reply.send({ success: true, data: facets });
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

      const { categoryId, brandId, colorId, variants: variantsData, hasVariants: hasVariantsFlag, ...restBody } = body;

      const product = await prisma.product.create({
        data: {
          ...restBody,
          nameUz: body.nameUz || body.name,
          nameRu: body.nameRu || body.name,
          descriptionUz: body.descriptionUz || body.description || null,
          descriptionRu: body.descriptionRu || body.description || null,
          status,
          qualityScore,
          hasVariants: !!(hasVariantsFlag && variantsData && variantsData.length > 0),
          validationErrors: validation.isValid ? [] : validation.errors.map(e => e.message),
          thumbnailUrl: body.images?.[0] || null,
          moderatedAt: new Date(),
          shop: { connect: { id: shop.id } },
          ...(categoryId && { category: { connect: { id: categoryId } } }),
          ...(brandId && { brand: { connect: { id: brandId } } }),
          ...(colorId && { color: { connect: { id: colorId } } }),
        } as any,
        include: {
          category: { select: { id: true, nameUz: true, nameRu: true } },
          shop: { select: { id: true, name: true } },
        },
      });

      // Create variants if provided
      let createdVariants: any[] = [];
      if (hasVariantsFlag && variantsData && variantsData.length > 0) {
        createdVariants = await Promise.all(
          variantsData.map((v, idx) =>
            prisma.productVariant.create({
              data: {
                productId: product.id,
                colorId: v.colorId || null,
                sizeId: v.sizeId || null,
                price: v.price,
                compareAtPrice: v.compareAtPrice || null,
                stock: v.stock,
                sku: v.sku || null,
                images: v.images || [],
                isActive: v.isActive ?? true,
                sortOrder: v.sortOrder ?? idx,
              },
              include: {
                color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
                size: { select: { id: true, nameUz: true, nameRu: true } },
              },
            })
          )
        );
      }

      // Index in Meilisearch if active (via BullMQ — non-blocking)
      if (status === 'active') {
        enqueueSearchIndex({ type: 'index_product', product }).catch(() => {});
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
          variants: createdVariants,
          qualityScore,
          validationErrors: validation.errors,
          moderationStatus: status,
        },
      });
    },
  );

  // Cache invalidation helper (SCAN-based, production-safe)
  async function invalidateProductCaches(productId?: string) {
    try {
      const { cacheDeletePattern } = await import('../../config/redis.js');
      // Delete specific product cache
      if (productId) await cacheDelete(`product:detail:${productId}`);
      // Delete list/featured caches (SCAN-based pattern)
      await cacheDeletePattern('products:*');
    } catch { /* non-blocking */ }
  }

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

      // Extract variant data and relation IDs from body
      const { categoryId: bodyCategoryId, brandId: bodyBrandId, colorId: bodyColorId, variants: variantsData, hasVariants: hasVariantsFlag, ...updateFields } = body;

      const updated = await prisma.product.update({
        where: { id },
        data: {
          ...updateFields,
          nameUz: merged.nameUz,
          nameRu: merged.nameRu,
          descriptionUz: merged.descriptionUz || null,
          descriptionRu: merged.descriptionRu || null,
          status,
          qualityScore,
          hasVariants: hasVariantsFlag !== undefined ? !!(hasVariantsFlag && variantsData && variantsData.length > 0) : undefined,
          validationErrors: validation.isValid ? [] : validation.errors.map(e => e.message),
          thumbnailUrl: merged.images?.[0] || (product as any).thumbnailUrl,
          moderatedAt: new Date(),
          ...(bodyCategoryId !== undefined && {
            category: bodyCategoryId ? { connect: { id: bodyCategoryId } } : { disconnect: true },
          }),
          ...(bodyBrandId !== undefined && {
            brand: bodyBrandId ? { connect: { id: bodyBrandId } } : { disconnect: true },
          }),
          ...(bodyColorId !== undefined && {
            color: bodyColorId ? { connect: { id: bodyColorId } } : { disconnect: true },
          }),
        } as any,
        include: {
          category: { select: { id: true, nameUz: true, nameRu: true } },
          shop: { select: { id: true, name: true } },
        },
      });

      // Update variants if provided (replace all strategy)
      let updatedVariants: any[] = [];
      if (variantsData !== undefined) {
        // Delete existing variants
        await prisma.productVariant.deleteMany({ where: { productId: id } });
        
        // Create new variants
        if (variantsData && variantsData.length > 0) {
          updatedVariants = await Promise.all(
            variantsData.map((v, idx) =>
              prisma.productVariant.create({
                data: {
                  productId: id,
                  colorId: v.colorId || null,
                  sizeId: v.sizeId || null,
                  price: v.price,
                  compareAtPrice: v.compareAtPrice || null,
                  stock: v.stock,
                  sku: v.sku || null,
                  images: v.images || [],
                  isActive: v.isActive ?? true,
                  sortOrder: v.sortOrder ?? idx,
                },
                include: {
                  color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
                  size: { select: { id: true, nameUz: true, nameRu: true } },
                },
              })
            )
          );
        }
      } else {
        // Fetch existing variants for response
        updatedVariants = await prisma.productVariant.findMany({
          where: { productId: id },
          include: {
            color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
            size: { select: { id: true, nameUz: true, nameRu: true } },
          },
          orderBy: { sortOrder: 'asc' },
        });
      }

      // Update Meilisearch index (via BullMQ — non-blocking)
      if (status === 'active') {
        enqueueSearchIndex({ type: 'index_product', product: updated }).catch(() => {});
      } else {
        enqueueSearchIndex({ type: 'remove_product', productId: id }).catch(() => {});
      }

      // Create moderation log
      await prisma.productModerationLog.create({
        data: {
          productId: id,
          action: 'revalidated',
          reason: `Qayta tekshirildi. Status: ${status}, Sifat: ${qualityScore}/100`,
        },
      });

      // Invalidate caches
      invalidateProductCaches(id).catch(() => {});

      return reply.send({
        success: true,
        data: {
          ...updated,
          variants: updatedVariants,
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

      const deleteResult = await prisma.product.deleteMany({
        where: { id, shopId: shop.id },
      });

      if (deleteResult.count === 0) {
        throw new AppError('Mahsulot topilmadi yoki o\'chirish mumkin emas', 404);
      }

      // Remove from search index (via BullMQ — non-blocking)
      enqueueSearchIndex({ type: 'remove_product', productId: id }).catch(() => {});

      // Invalidate caches
      invalidateProductCaches(id).catch(() => {});

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

  // ============================================
  // Search history: Server-side sync
  // ============================================

  /**
   * GET /search/history
   * Foydalanuvchi qidiruv tarixi
   */
  app.get('/search/history', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const history = await prisma.userSearchHistory.findMany({
      where: { userId },
      orderBy: { searchedAt: 'desc' },
      take: 20,
      select: { query: true, searchedAt: true },
    });
    return reply.send({ success: true, data: history });
  });

  /**
   * POST /search/history
   * Qidiruv tarixiga qo'shish
   */
  app.post('/search/history', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { query } = z.object({ query: z.string().min(1).max(200) }).parse(request.body);
    const normalizedQuery = query.toLowerCase().trim();

    // Upsert - agar mavjud bo'lsa yangilash
    await prisma.userSearchHistory.upsert({
      where: { userId_query: { userId, query: normalizedQuery } },
      create: { userId, query: normalizedQuery },
      update: { searchedAt: new Date() },
    });

    // Maksimal 20 ta saqlash — eng eskilerini o'chirish
    const allHistory = await prisma.userSearchHistory.findMany({
      where: { userId },
      orderBy: { searchedAt: 'desc' },
      select: { id: true },
    });
    if (allHistory.length > 20) {
      const toDelete = allHistory.slice(20).map(h => h.id);
      await prisma.userSearchHistory.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    return reply.send({ success: true });
  });

  /**
   * DELETE /search/history
   * Barcha qidiruv tarixini tozalash
   */
  app.delete('/search/history', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    await prisma.userSearchHistory.deleteMany({ where: { userId } });
    return reply.send({ success: true, message: 'Qidiruv tarixi tozalandi' });
  });

  /**
   * DELETE /search/history/:query
   * Bitta qidiruv so'zini o'chirish
   */
  app.delete('/search/history/:query', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { query } = request.params as { query: string };
    await prisma.userSearchHistory.deleteMany({
      where: { userId, query: query.toLowerCase().trim() },
    });
    return reply.send({ success: true });
  });

  // ============================================
  // ADVANCED-002: AI MAHSULOT TAVSIYASI
  // "Siz ham yoqtirishingiz mumkin", Cross-sell, Up-sell
  // ============================================

  /**
   * GET /products/:id/recommendations
   * Mahsulotga asoslangan tavsiyalar (similar + cross-sell)
   */
  app.get('/products/:id/recommendations', async (request, reply) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, categoryId: true, price: true, shopId: true, name: true },
    });
    if (!product) throw new NotFoundError('Mahsulot');

    // Similar products (same category, similar price range)
    const priceMin = Number(product.price) * 0.5;
    const priceMax = Number(product.price) * 2;

    const similar = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: id },
        status: 'active',
        price: { gte: priceMin, lte: priceMax },
      },
      select: {
        id: true, name: true, price: true,
        images: true, rating: true, salesCount: true, viewCount: true,
        shop: { select: { id: true, name: true } },
      },
      orderBy: { salesCount: 'desc' },
      take: 8,
    });

    // Cross-sell: products bought together (from same orders)
    const orderItemsWithProduct = await prisma.orderItem.findMany({
      where: { productId: id },
      select: { orderId: true },
      take: 50,
    });
    const orderIds = orderItemsWithProduct.map(oi => oi.orderId);

    let crossSell: any[] = [];
    if (orderIds.length > 0) {
      const crossItems = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          orderId: { in: orderIds },
          productId: { not: id },
        },
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 6,
      });

      const crossIds = crossItems.map(c => c.productId);
      crossSell = await prisma.product.findMany({
        where: { id: { in: crossIds }, status: 'active' },
        select: {
          id: true, name: true, price: true,
          images: true, rating: true, salesCount: true,
          shop: { select: { id: true, name: true } },
        },
      });
    }

    // Up-sell: more expensive products in same category
    const upSell = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: id },
        status: 'active',
        price: { gt: product.price },
      },
      select: {
        id: true, name: true, price: true,
        images: true, rating: true, salesCount: true,
        shop: { select: { id: true, name: true } },
      },
      orderBy: [{ rating: 'desc' }, { salesCount: 'desc' }],
      take: 4,
    });

    return reply.send({
      success: true,
      data: { similar, crossSell, upSell },
    });
  });

  /**
   * GET /recommendations/personal
   * Foydalanuvchiga shaxsiy tavsiyalar (browsing history-based)
   */
  app.get('/recommendations/personal', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    // Get user's recently viewed product categories
    const recentViews = await prisma.productView.findMany({
      where: { userId },
      select: { product: { select: { categoryId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const catIds = [...new Set(recentViews.map(v => v.product.categoryId).filter(Boolean))];

    if (catIds.length === 0) {
      // Fallback: trending products
      const trending = await prisma.product.findMany({
        where: { status: 'active' },
        select: {
          id: true, name: true, price: true,
          images: true, rating: true, salesCount: true,
          shop: { select: { id: true, name: true } },
        },
        orderBy: { salesCount: 'desc' },
        take: 12,
      });
      return reply.send({ success: true, data: { type: 'trending', products: trending } });
    }

    // Products from user's interested categories, excluding already viewed
    const viewedProductIds = await prisma.productView.findMany({
      where: { userId },
      select: { productId: true },
      distinct: ['productId'],
    });
    const viewedIds = viewedProductIds.map(v => v.productId);

    const recommendations = await prisma.product.findMany({
      where: {
        categoryId: { in: catIds as string[] },
        status: 'active',
        id: { notIn: viewedIds },
      },
      select: {
        id: true, name: true, price: true,
        images: true, rating: true, salesCount: true,
        shop: { select: { id: true, name: true } },
      },
      orderBy: [{ rating: 'desc' }, { salesCount: 'desc' }],
      take: 12,
    });

    return reply.send({ success: true, data: { type: 'personal', products: recommendations } });
  });

  // ============================================
  // ADVANCED-004: LOYALTY — User-facing endpoints
  // ============================================

  /**
   * GET /loyalty/my-account
   * Foydalanuvchi loyalty hisobi
   */
  app.get('/loyalty/my-account', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        pointLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: { userId },
        include: { pointLogs: { orderBy: { createdAt: 'desc' }, take: 20 } },
      });
    }

    // Tier progress
    const tierThresholds = { bronze: 0, silver: 5000, gold: 20000, platinum: 50000 };
    const nextTier = account.tier === 'platinum' ? null
      : account.tier === 'gold' ? 'platinum'
      : account.tier === 'silver' ? 'gold' : 'silver';
    const nextThreshold = nextTier ? tierThresholds[nextTier as keyof typeof tierThresholds] : null;
    const progress = nextThreshold ? Math.min(100, Math.round((account.lifetimePoints / nextThreshold) * 100)) : 100;

    return reply.send({
      success: true,
      data: {
        ...account,
        tierProgress: { nextTier, nextThreshold, progress },
        tierBenefits: {
          bronze: ['Har xarid uchun 1% ball'],
          silver: ['Har xarid uchun 2% ball', 'Bepul yetkazib berish (50,000+)'],
          gold: ['Har xarid uchun 3% ball', 'Bepul yetkazib berish', 'Maxsus chegirmalar'],
          platinum: ['Har xarid uchun 5% ball', 'Bepul yetkazib berish', 'VIP qo\'llab-quvvatlash', 'Maxsus aksiyalar'],
        },
      },
    });
  });

  /**
   * POST /loyalty/daily-login
   * Kundalik kirish bonusi
   */
  app.post('/loyalty/daily-login', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    let account = await prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) {
      account = await prisma.loyaltyAccount.create({ data: { userId } });
    }

    // Check if already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (account.lastDailyLogin && account.lastDailyLogin >= today) {
      return reply.send({ success: false, message: 'Bugungi bonus allaqachon olingan' });
    }

    const dailyPoints = 10; // 10 points per daily login
    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          availablePoints: { increment: dailyPoints },
          totalPoints: { increment: dailyPoints },
          lifetimePoints: { increment: dailyPoints },
          lastDailyLogin: new Date(),
        },
      }),
      prisma.loyaltyPointLog.create({
        data: {
          accountId: account.id,
          action: 'daily_login',
          points: dailyPoints,
          description: 'Kundalik kirish bonusi',
        },
      }),
    ]);

    return reply.send({ success: true, data: { pointsEarned: dailyPoints } });
  });

  // ============================================
  // ADVANCED-008: FAQ BOT (public)
  // ============================================

  /**
   * GET /faq
   * Public FAQ endpoint
   */
  app.get('/faq', async (request, reply) => {
    const { category, q } = request.query as { category?: string; q?: string };

    const where: any = { isActive: true };
    if (category) where.category = category;

    let entries = await prisma.faqEntry.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    // Simple keyword search
    if (q) {
      const query = q.toLowerCase();
      entries = entries.filter(e =>
        e.question.toLowerCase().includes(query) ||
        e.answer.toLowerCase().includes(query) ||
        e.keywords.some(k => k.toLowerCase().includes(query))
      );
    }

    return reply.send({ success: true, data: entries });
  });

  // ============================================
  // PUBLIC: Kategoriya atributlari (filtr uchun)
  // ============================================

  /**
   * GET /categories/:id/attributes
   * Kategoriyaning filtr atributlari va mavjud qiymatlari
   */
  app.get('/categories/:id/attributes', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const cacheKey = `cat-attrs:${id}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return reply.send({ success: true, data: cached });

    // Kategoriya va uning barcha ota-kategoriyalarining atributlarini topish
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, parentId: true, level: true, parent: { select: { parentId: true } } },
    });
    if (!category) return reply.status(404).send({ success: false, message: 'Kategoriya topilmadi' });

    // Kategoriya o'zi va ota-kategoriyalarining atributlari
    const categoryIds = [id];
    if (category.parentId) categoryIds.push(category.parentId);
    if (category.parent?.parentId) categoryIds.push(category.parent.parentId);

    const attributes = await prisma.categoryAttribute.findMany({
      where: { categoryId: { in: categoryIds }, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        nameUz: true,
        nameRu: true,
        key: true,
        type: true,
        unit: true,
        options: true,
        rangeMin: true,
        rangeMax: true,
        isRequired: true,
        sortOrder: true,
      },
    });

    // Har bir atribut uchun mavjud (ishlatilayotgan) qiymatlarni topish
    if (attributes.length > 0) {
      const descendants = await prisma.category.findMany({
        where: { OR: [{ id }, { parentId: id }, { parent: { parentId: id } }] },
        select: { id: true },
      });
      const catIds = descendants.map(d => d.id);

      const attrValues = await prisma.productAttributeValue.findMany({
        where: {
          attributeId: { in: attributes.map(a => a.id) },
          product: { categoryId: { in: catIds }, isActive: true, status: 'active' },
        },
        select: { attributeId: true, value: true },
      });

      // Atributlarga qiymatlarni birlashtirish
      const valueMap = new Map<string, Set<string>>();
      for (const v of attrValues) {
        if (!valueMap.has(v.attributeId)) valueMap.set(v.attributeId, new Set());
        valueMap.get(v.attributeId)!.add(v.value);
      }

      const enriched = attributes.map(a => ({
        ...a,
        usedValues: Array.from(valueMap.get(a.id) || []).sort(),
      }));

      await cacheSet(cacheKey, enriched, 300);
      return reply.send({ success: true, data: enriched });
    }

    await cacheSet(cacheKey, attributes, 300);
    return reply.send({ success: true, data: attributes });
  });

  // ============================================
  // ADMIN: Kategoriya atributlari CRUD
  // ============================================

  /**
   * GET /admin/category-attributes/:categoryId
   * Kategoriyaning barcha atributlari (admin uchun)
   */
  app.get(
    '/admin/category-attributes/:categoryId',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const { categoryId } = z.object({ categoryId: z.string().uuid() }).parse(request.params);
      const attrs = await prisma.categoryAttribute.findMany({
        where: { categoryId },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { values: true } } },
      });
      return reply.send({ success: true, data: attrs });
    }
  );

  /**
   * POST /admin/category-attributes
   * Yangi atribut yaratish
   */
  app.post(
    '/admin/category-attributes',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const body = z.object({
        categoryId: z.string().uuid(),
        nameUz: z.string().min(1),
        nameRu: z.string().min(1),
        key: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
        type: z.enum(['chips', 'range', 'toggle', 'color', 'radio']).default('chips'),
        unit: z.string().optional(),
        options: z.array(z.string()).optional(),
        rangeMin: z.number().optional(),
        rangeMax: z.number().optional(),
        isRequired: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
      }).parse(request.body);

      const attr = await prisma.categoryAttribute.create({ data: body });
      // Clear cache
      cacheDelete(`cat-attrs:${body.categoryId}`).catch(() => {});
      return reply.status(201).send({ success: true, data: attr });
    }
  );

  /**
   * PUT /admin/category-attributes/:id
   * Atributni yangilash
   */
  app.put(
    '/admin/category-attributes/:id',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = z.object({
        nameUz: z.string().min(1).optional(),
        nameRu: z.string().min(1).optional(),
        key: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/).optional(),
        type: z.enum(['chips', 'range', 'toggle', 'color', 'radio']).optional(),
        unit: z.string().nullable().optional(),
        options: z.array(z.string()).optional(),
        rangeMin: z.number().nullable().optional(),
        rangeMax: z.number().nullable().optional(),
        isRequired: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      }).parse(request.body);

      const attr = await prisma.categoryAttribute.update({ where: { id }, data: body });
      cacheDelete(`cat-attrs:${attr.categoryId}`).catch(() => {});
      return reply.send({ success: true, data: attr });
    }
  );

  /**
   * DELETE /admin/category-attributes/:id
   * Atributni o'chirish
   */
  app.delete(
    '/admin/category-attributes/:id',
    { preHandler: [authMiddleware, requireRole('admin')] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const attr = await prisma.categoryAttribute.delete({ where: { id } });
      cacheDelete(`cat-attrs:${attr.categoryId}`).catch(() => {});
      return reply.send({ success: true, message: 'Atribut o\'chirildi' });
    }
  );

}