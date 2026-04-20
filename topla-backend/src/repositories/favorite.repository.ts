/**
 * Favorite Repository \u2014 foydalanuvchining sevimlilari.
 */

import { db, type DbClient } from './_db.js';

export const favoriteInclude = {
  product: {
    include: {
      shop: { select: { id: true, name: true, logoUrl: true } },
    },
  },
} as const;

export async function findByUser(
  userId: string,
  opts: { skip?: number; take?: number } = {},
  tx?: DbClient,
) {
  const { skip = 0, take = 20 } = opts;
  const where = { userId };

  const [items, total] = await Promise.all([
    db(tx).favorite.findMany({
      where,
      include: favoriteInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    db(tx).favorite.count({ where }),
  ]);

  return { items, total };
}

export async function add(userId: string, productId: string, tx?: DbClient) {
  return db(tx).favorite.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

export async function remove(userId: string, productId: string, tx?: DbClient) {
  return db(tx).favorite.deleteMany({
    where: { userId, productId },
  });
}
