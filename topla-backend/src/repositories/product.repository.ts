/**
 * Product Repository — markazlashgan mahsulot ma'lumotlari kirish qatlami.
 */

import { db, type DbClient } from './_db.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';

// ============================================
// Include presets — markazlashtirilgan eager-load pattern'lari.
// ============================================

/**
 * "Card" view — list/grid uchun. Minimal, tezkor.
 */
export const productCardInclude = {
  shop: { select: { id: true, name: true, logoUrl: true, status: true } },
  category: { select: { id: true, nameUz: true, nameRu: true, slug: true } },
  brand: { select: { id: true, name: true, logoUrl: true } },
} as const;

/**
 * "Detail" view — product detail page uchun. Variants, options, attributes.
 */
export const productDetailInclude = {
  ...productCardInclude,
  color: { select: { id: true, nameUz: true, nameRu: true, hexCode: true } },
  variants: {
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  optionLinks: {
    include: {
      optionType: { include: { values: true } },
    },
  },
  defaultVariant: true,
  attributeValues: {
    include: { attribute: true },
  },
} as const;

/**
 * Vendor admin view — vendor o'z mahsulotini ko'rganda kerak bo'ladigan qo'shimchalar.
 */
export const productVendorInclude = {
  ...productDetailInclude,
  moderationLogs: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
  },
} as const;

// ============================================
// Queries
// ============================================

/**
 * ID bo'yicha topish — ruxsat tekshiruvi YO'Q (caller'ga bog'liq).
 * Public product detail uchun (moderated products).
 */
export async function findById(id: string, tx?: DbClient) {
  return db(tx).product.findUnique({
    where: { id },
    include: productDetailInclude,
  });
}

/**
 * Cache-backed public product fetch. TTL 5 min.
 * Faqat o'zgarmas yoki kam o'zgaradigan ma'lumotlar uchun.
 */
export async function findByIdCached(id: string): Promise<any | null> {
  const key = `product:${id}:detail`;
  const cached = await cacheGet<any>(key);
  if (cached) return cached;
  const product = await findById(id);
  if (product) {
    await cacheSet(key, product, 300); // 5 min
  }
  return product;
}

/**
 * Vendor scope — faqat o'z shop mahsuloti. IDOR-safe.
 */
export async function findByIdForShop(
  id: string,
  shopId: string,
  tx?: DbClient,
) {
  return db(tx).product.findFirst({
    where: { id, shopId },
    include: productVendorInclude,
  });
}

/**
 * Shop bo'yicha ro'yxat. Status, kategoriya, narx filter'lari.
 */
export interface FindByShopOpts {
  status?: string | { in: string[] };
  categoryId?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  search?: string; // nameUz/name ichida
}

export async function findByShop(
  shopId: string,
  opts: FindByShopOpts = {},
  tx?: DbClient,
) {
  const { skip = 0, take = 20, orderBy = { createdAt: 'desc' as const }, search, ...filters } = opts;
  const where: Record<string, unknown> = {
    shopId,
    ...(filters.status && { status: filters.status }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(typeof filters.isActive === 'boolean' && { isActive: filters.isActive }),
    ...(search && {
      OR: [
        { nameUz: { contains: search, mode: 'insensitive' } },
        { nameRu: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db(tx).product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip,
      take,
    }),
    db(tx).product.count({ where }),
  ]);

  return { items, total };
}

/**
 * Public catalog search — active + approved products only.
 */
export async function findPublic(
  opts: {
    categoryId?: string;
    brandId?: string;
    shopId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
    skip?: number;
    take?: number;
  } = {},
  tx?: DbClient,
) {
  const { skip = 0, take = 20, sort = 'newest', search, minPrice, maxPrice, ...filters } = opts;

  const where: Record<string, unknown> = {
    isActive: true,
    status: 'active',
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.brandId && { brandId: filters.brandId }),
    ...(filters.shopId && { shopId: filters.shopId }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
    ...(search && {
      OR: [
        { nameUz: { contains: search, mode: 'insensitive' } },
        { nameRu: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const orderBy: Record<string, 'asc' | 'desc'> =
    sort === 'price_asc' ? { price: 'asc' }
    : sort === 'price_desc' ? { price: 'desc' }
    : sort === 'popular' ? { salesCount: 'desc' }
    : sort === 'rating' ? { rating: 'desc' }
    : { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    db(tx).product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip,
      take,
    }),
    db(tx).product.count({ where }),
  ]);

  return { items, total };
}

// ============================================
// Mutations
// ============================================

export async function create(
  data: Record<string, unknown>,
  tx?: DbClient,
) {
  const product = await db(tx).product.create({ data });
  await invalidateCache(product.id);
  return product;
}

export async function update(
  id: string,
  data: Record<string, unknown>,
  tx?: DbClient,
) {
  const product = await db(tx).product.update({ where: { id }, data });
  await invalidateCache(id);
  return product;
}

/**
 * Vendor-safe update — faqat o'z shop mahsulotini o'zgartira oladi.
 */
export async function updateForShop(
  id: string,
  shopId: string,
  data: Record<string, unknown>,
  tx?: DbClient,
) {
  // Ownership check + update bir tranzaksiyada
  const result = await db(tx).product.updateMany({
    where: { id, shopId },
    data,
  });
  if (result.count === 0) return null;
  await invalidateCache(id);
  return db(tx).product.findUnique({ where: { id }, include: productVendorInclude });
}

export async function softDelete(id: string, tx?: DbClient) {
  const product = await db(tx).product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  await invalidateCache(id);
  return product;
}

/**
 * Vendor-safe soft delete.
 */
export async function softDeleteForShop(
  id: string,
  shopId: string,
  tx?: DbClient,
) {
  const result = await db(tx).product.updateMany({
    where: { id, shopId },
    data: { deletedAt: new Date(), isActive: false },
  });
  if (result.count === 0) return false;
  await invalidateCache(id);
  return true;
}

// ============================================
// Cache invalidation
// ============================================

export async function invalidateCache(productId: string): Promise<void> {
  await cacheDelete(`product:${productId}:detail`);
}
