/**
 * Shop Review Repository.
 */

import { db, type DbClient } from './_db.js';

export const reviewWithUserInclude = {
  user: { select: { id: true, fullName: true, avatarUrl: true } },
} as const;

export async function findByShop(
  shopId: string,
  opts: { skip: number; take: number },
  tx?: DbClient,
) {
  const client = db(tx);
  const [reviews, total] = await Promise.all([
    client.shopReview.findMany({
      where: { shopId },
      include: reviewWithUserInclude,
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.take,
    }),
    client.shopReview.count({ where: { shopId } }),
  ]);
  return { reviews, total };
}

export async function upsert(
  shopId: string,
  userId: string,
  data: { rating: number; comment?: string },
  tx?: DbClient,
) {
  return db(tx).shopReview.upsert({
    where: { shopId_userId: { shopId, userId } },
    update: data,
    create: { shopId, userId, ...data },
  });
}

/**
 * Do'kon ratingini yana hisoblab, shop.rating + reviewCount'ni yangilaydi.
 */
export async function recalcShopRating(shopId: string, tx?: DbClient) {
  const client = db(tx);
  const avg = await client.shopReview.aggregate({
    where: { shopId },
    _avg: { rating: true },
    _count: true,
  });
  await client.shop.update({
    where: { id: shopId },
    data: {
      rating: avg._avg.rating || 0,
      reviewCount: avg._count || 0,
    },
  });
}
