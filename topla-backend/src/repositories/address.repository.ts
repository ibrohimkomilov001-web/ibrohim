/**
 * Address Repository — foydalanuvchi manzillari.
 */

import { db, type DbClient } from './_db.js';

export async function findByUser(userId: string, tx?: DbClient) {
  return db(tx).address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function findByIdForUser(id: string, userId: string, tx?: DbClient) {
  return db(tx).address.findFirst({ where: { id, userId } });
}

/**
 * Create — if isDefault true, unset all other user addresses' default in one tx.
 */
export async function createForUser(
  userId: string,
  data: Record<string, unknown>,
  tx?: DbClient,
) {
  const client = db(tx);
  if (data.isDefault) {
    await client.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }
  return client.address.create({
    data: { ...data, user: { connect: { id: userId } } },
  });
}

export async function updateForUser(
  id: string,
  userId: string,
  data: Record<string, unknown>,
  tx?: DbClient,
) {
  const client = db(tx);
  if (data.isDefault) {
    await client.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }
  const result = await client.address.updateMany({
    where: { id, userId },
    data,
  });
  if (result.count === 0) return null;
  return client.address.findUnique({ where: { id } });
}

export async function deleteForUser(id: string, userId: string, tx?: DbClient) {
  const result = await db(tx).address.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
