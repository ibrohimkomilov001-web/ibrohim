/**
 * Banner Repository — aktiv banner'lar (1-daqiqalik cache).
 */

import { db, type DbClient } from './_db.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';

const CACHE_KEY = 'banners:active';
const CACHE_TTL = 60; // 1 daqiqa — kampaniya vaqtlari tezroq aks etsin

export async function findActive(tx?: DbClient) {
  return db(tx).banner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function findActiveCached() {
  const cached = await cacheGet<unknown[]>(CACHE_KEY);
  if (cached) return cached;
  const banners = await findActive();
  cacheSet(CACHE_KEY, banners, CACHE_TTL).catch(() => {});
  return banners;
}

export async function incrementClick(id: string, tx?: DbClient) {
  try {
    await db(tx).banner.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    });
  } catch {
    // banner silingan bo'lishi mumkin — ignore
  }
}

export async function incrementView(id: string, tx?: DbClient) {
  try {
    await db(tx).banner.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // ignore
  }
}

export async function invalidateCache() {
  await cacheDelete(CACHE_KEY);
}
