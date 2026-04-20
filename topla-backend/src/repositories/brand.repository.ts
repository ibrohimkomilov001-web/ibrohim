/**
 * Brand Repository — cached, rarely-changing reference data.
 */

import { db, type DbClient } from './_db.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';

const CACHE_TTL = 60 * 30; // 30 daqiqa
const ALL_KEY = 'brands:all';

export async function findAll(tx?: DbClient) {
  return db(tx).brand.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function findAllCached() {
  const cached = await cacheGet<unknown[]>(ALL_KEY);
  if (cached) return cached;
  const rows = await findAll();
  cacheSet(ALL_KEY, rows, CACHE_TTL).catch(() => {});
  return rows;
}

export async function findById(id: string, tx?: DbClient) {
  return db(tx).brand.findUnique({ where: { id } });
}

export async function invalidateCache() {
  await cacheDelete(ALL_KEY);
}
