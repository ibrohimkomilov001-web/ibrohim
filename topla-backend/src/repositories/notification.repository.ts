/**
 * Notification Repository.
 */

import { db, type DbClient } from './_db.js';

export async function findByUser(
  userId: string,
  opts: { skip: number; take: number },
  tx?: DbClient,
) {
  const client = db(tx);
  const [notifications, total, unreadCount] = await Promise.all([
    client.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.take,
    }),
    client.notification.count({ where: { userId } }),
    client.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { notifications, total, unreadCount };
}

export async function markRead(id: string, userId: string, tx?: DbClient) {
  const result = await db(tx).notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
  return result.count > 0;
}

export async function markAllRead(userId: string, tx?: DbClient) {
  return db(tx).notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function unreadCount(userId: string, tx?: DbClient) {
  return db(tx).notification.count({
    where: { userId, isRead: false },
  });
}

export async function create(
  data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    data?: unknown;
  },
  tx?: DbClient,
) {
  return db(tx).notification.create({ data: data as never });
}
