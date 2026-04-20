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
