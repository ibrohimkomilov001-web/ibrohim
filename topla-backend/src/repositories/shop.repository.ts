/**
 * Shop Repository \u2014 markazlashgan vendor magazin ma'lumot qatlami.
 */

import { db, type DbClient } from './_db.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';

export const shopCardInclude = {
  owner: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
  shopCategory: { select: { id: true, nameUz: true, nameRu: true } },
} as const;

export async function findById(id: string, tx?: DbClient) {
  return db(tx).shop.findUnique({ where: { id }, include: shopCardInclude });
}

export async function findByIdCached(id: string) {
  const key = `shop:${id}`;
  const cached = await cacheGet<any>(key);
  if (cached) return cached;
  const shop = await findById(id);
  if (shop) await cacheSet(key, shop, 300);
  return shop;
}

export async function findBySlug(slug: string, tx?: DbClient) {
  return db(tx).shop.findUnique({
    where: { slug },
    include: shopCardInclude,
  });
}

export async function findByOwner(ownerId: string, tx?: DbClient) {
  return db(tx).shop.findUnique({
    where: { ownerId },
    include: shopCardInclude,
  });
}

export async function create(data: Record<string, unknown>, tx?: DbClient) {
  return db(tx).shop.create({ data, include: shopCardInclude });
}

export async function update(
  id: string,
  data: Record<string, unknown>,
  tx?: DbClient,
) {
  const shop = await db(tx).shop.update({ where: { id }, data });
  await invalidateCache(id);
  return shop;
}

/**
 * Vendor-safe update \u2014 faqat egasi o'zgartira oladi.
 */
export async function updateForOwner(
  id: string,
  ownerId: string,
  data: Record<string, unknown>,
  tx?: DbClient,
) {
  const result = await db(tx).shop.updateMany({
    where: { id, ownerId },
    data,
  });
  if (result.count === 0) return null;
  await invalidateCache(id);
  return db(tx).shop.findUnique({ where: { id }, include: shopCardInclude });
}

export async function invalidateCache(id: string): Promise<void> {
  await cacheDelete(`shop:${id}`);
}

export async function invalidateListCache(): Promise<void> {
  try {
    const { cacheDeletePattern } = await import('../config/redis.js');
    await cacheDeletePattern('shops:*');
  } catch {
    /* non-blocking */
  }
}

// ============================================
// Public listing + detail
// ============================================

export const shopListSelect = {
  id: true,
  name: true,
  description: true,
  logoUrl: true,
  bannerUrl: true,
  rating: true,
  reviewCount: true,
  totalSales: true,
  shopType: true,
  address: true,
  isOpen: true,
  createdAt: true,
  deliveryFee: true,
  freeDeliveryFrom: true,
  minOrderAmount: true,
  _count: { select: { products: true, followers: true } },
} as const;

export const shopDetailInclude = {
  _count: {
    select: {
      products: true,
      reviews: true,
      followers: true,
      orderItems: true,
    },
  },
} as const;

export const shopPublicInclude = {
  _count: { select: { products: true, reviews: true, followers: true } },
} as const;

export async function findList(
  opts: { skip: number; take: number; search?: string },
  tx?: DbClient,
) {
  const where: Record<string, unknown> = { status: 'active' };
  if (opts.search) {
    (where as { OR?: unknown[] }).OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { description: { contains: opts.search, mode: 'insensitive' } },
    ];
  }
  const client = db(tx);
  const [shops, total] = await Promise.all([
    client.shop.findMany({
      where,
      select: shopListSelect,
      orderBy: { rating: 'desc' },
      skip: opts.skip,
      take: opts.take,
    }),
    client.shop.count({ where }),
  ]);
  return { shops, total };
}

export async function findListCached(opts: {
  page: number;
  limit: number;
  skip: number;
  search?: string;
}) {
  const key = `shops:list:${opts.page}:${opts.limit}:${opts.search || ''}`;
  const cached = await cacheGet<{ shops: unknown[]; total: number }>(key);
  if (cached) return cached;
  const data = await findList({
    skip: opts.skip,
    take: opts.limit,
    search: opts.search,
  });
  cacheSet(key, data, 120).catch(() => {});
  return data;
}

export async function findBySlugPublic(slug: string, tx?: DbClient) {
  return db(tx).shop.findUnique({
    where: { slug },
    include: shopPublicInclude,
  });
}

export async function findByIdPublic(id: string, tx?: DbClient) {
  return db(tx).shop.findUnique({
    where: { id },
    include: shopDetailInclude,
  });
}

export async function findProductsForShop(
  shopId: string,
  opts: { skip: number; take: number },
  tx?: DbClient,
) {
  const client = db(tx);
  const where = { shopId, isActive: true };
  const [products, total] = await Promise.all([
    client.product.findMany({
      where,
      include: {
        category: { select: { id: true, nameUz: true, nameRu: true } },
        brand: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.take,
    }),
    client.product.count({ where }),
  ]);
  return { products, total };
}
