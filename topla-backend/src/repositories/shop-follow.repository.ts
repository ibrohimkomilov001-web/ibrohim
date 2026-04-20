/**
 * Shop Follow Repository.
 */

import { db, type DbClient } from './_db.js';

export async function find(userId: string, shopId: string, tx?: DbClient) {
  return db(tx).shopFollow.findUnique({
    where: { shopId_userId: { shopId, userId } },
  });
}

export async function follow(userId: string, shopId: string, tx?: DbClient) {
  return db(tx).shopFollow.create({ data: { shopId, userId } });
}

export async function unfollow(userId: string, shopId: string, tx?: DbClient) {
  return db(tx).shopFollow.delete({
    where: { shopId_userId: { shopId, userId } },
  });
}

export async function countByShop(shopId: string, tx?: DbClient) {
  return db(tx).shopFollow.count({ where: { shopId } });
}

export async function findByUser(
  userId: string,
  opts: { skip: number; take: number },
  tx?: DbClient,
) {
  const client = db(tx);
  const [follows, total] = await Promise.all([
    client.shopFollow.findMany({
      where: { userId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            rating: true,
            reviewCount: true,
            isOpen: true,
            _count: { select: { products: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.take,
    }),
    client.shopFollow.count({ where: { userId } }),
  ]);
  return { follows, total };
}
