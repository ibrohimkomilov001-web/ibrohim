/**
 * Category Repository — cached, rarely-changing reference data.
 */

import { db, type DbClient } from './_db.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';

const CACHE_TTL = 60 * 30; // 30 daqiqa
const TREE_KEY = 'categories:tree';
const ACTIVE_KEY = 'categories:active';

export async function findActive(tx?: DbClient) {
  return db(tx).category.findMany({
    where: { isActive: true },
    orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
  });
}

export async function findActiveCached() {
  const cached = await cacheGet<unknown[]>(ACTIVE_KEY);
  if (cached) return cached;
  const rows = await findActive();
  cacheSet(ACTIVE_KEY, rows, CACHE_TTL).catch(() => {});
  return rows;
}

export async function findTree(tx?: DbClient) {
  return db(tx).category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });
}

export async function findTreeCached() {
  const cached = await cacheGet<unknown[]>(TREE_KEY);
  if (cached) return cached;
  const rows = await findTree();
  cacheSet(TREE_KEY, rows, CACHE_TTL).catch(() => {});
  return rows;
}

export async function findById(id: string, tx?: DbClient) {
  return db(tx).category.findUnique({ where: { id } });
}

export async function findBySlug(slug: string, tx?: DbClient) {
  return db(tx).category.findUnique({ where: { slug } });
}

export async function invalidateCache() {
  await Promise.all([cacheDelete(TREE_KEY), cacheDelete(ACTIVE_KEY)]);
}
