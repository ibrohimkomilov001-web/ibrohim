/**
 * User (Profile) Repository \u2014 markazlashgan user ma'lumot kirish qatlami.
 */

import { db, type DbClient } from './_db.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';

export const userBasicSelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  avatarUrl: true,
  role: true,
} as const;

export async function findById(id: string, tx?: DbClient) {
  return db(tx).profile.findUnique({ where: { id } });
}

export async function findByIdCached(id: string) {
  const key = `user:${id}`;
  const cached = await cacheGet<any>(key);
  if (cached) return cached;
  const user = await findById(id);
  if (user) await cacheSet(key, user, 300);
  return user;
}

export async function findByPhone(phone: string, tx?: DbClient) {
  return db(tx).profile.findUnique({ where: { phone } });
}

export async function findByEmail(email: string, tx?: DbClient) {
  return db(tx).profile.findUnique({ where: { email } });
}

export async function create(data: Record<string, unknown>, tx?: DbClient) {
  return db(tx).profile.create({ data });
}

export async function update(
  id: string,
  data: Record<string, unknown>,
  tx?: DbClient,
) {
  const user = await db(tx).profile.update({ where: { id }, data });
  await invalidateCache(id);
  return user;
}

export async function invalidateCache(id: string): Promise<void> {
  await cacheDelete(`user:${id}`);
}
