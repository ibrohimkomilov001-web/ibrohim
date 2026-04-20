/**
 * Cart Repository — savat.
 */

import { db, type DbClient } from './_db.js';

export const cartItemInclude = {
  product: {
    include: {
      shop: { select: { id: true, name: true } },
    },
  },
} as const;

export async function findByUser(userId: string, tx?: DbClient) {
  return db(tx).cartItem.findMany({
    where: { userId },
    include: cartItemInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function findItem(
  userId: string,
  productId: string,
  variantId: string | null,
  tx?: DbClient,
) {
  return db(tx).cartItem.findFirst({
    where: { userId, productId, variantId },
  });
}

export async function addOrIncrement(
  userId: string,
  productId: string,
  variantId: string | null,
  quantity: number,
  tx?: DbClient,
) {
  const client = db(tx);
  const existing = await client.cartItem.findFirst({
    where: { userId, productId, variantId },
  });

  if (existing) {
    return client.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: { product: true },
    });
  }

  return client.cartItem.create({
    data: { userId, productId, variantId, quantity },
    include: { product: true },
  });
}

export async function setQuantity(
  userId: string,
  productId: string,
  quantity: number,
  tx?: DbClient,
) {
  const client = db(tx);
  if (quantity <= 0) {
    await client.cartItem.deleteMany({ where: { userId, productId } });
    return null;
  }
  await client.cartItem.updateMany({
    where: { userId, productId },
    data: { quantity },
  });
  return client.cartItem.findFirst({
    where: { userId, productId },
    include: { product: true },
  });
}

export async function removeProduct(
  userId: string,
  productId: string,
  tx?: DbClient,
) {
  return db(tx).cartItem.deleteMany({ where: { userId, productId } });
}

export async function clear(userId: string, tx?: DbClient) {
  return db(tx).cartItem.deleteMany({ where: { userId } });
}
