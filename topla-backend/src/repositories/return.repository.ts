/**
 * Return Repository.
 */

import { db, type DbClient } from './_db.js';

export const returnListInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      total: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          price: true,
        },
      },
    },
  },
} as const;

export const returnDetailInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      total: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          price: true,
          imageUrl: true,
        },
      },
    },
  },
} as const;

export const returnAdminInclude = {
  user: { select: { id: true, fullName: true, phone: true } },
  order: {
    select: {
      id: true,
      orderNumber: true,
      total: true,
      items: {
        select: { name: true, quantity: true, price: true, imageUrl: true },
      },
    },
  },
} as const;

export async function findByUser(
  userId: string,
  opts: { status?: string; take?: number },
  tx?: DbClient,
) {
  const where: Record<string, unknown> = { userId };
  if (opts.status) where.status = opts.status;
  return db(tx).return.findMany({
    where,
    include: returnListInclude,
    orderBy: { createdAt: 'desc' },
    take: opts.take ?? 100,
  });
}

export async function findByIdForUser(id: string, userId: string, tx?: DbClient) {
  return db(tx).return.findFirst({
    where: { id, userId },
    include: returnDetailInclude,
  });
}

export async function findById(id: string, tx?: DbClient) {
  return db(tx).return.findUnique({ where: { id } });
}

export async function findExistingActive(
  orderId: string,
  userId: string,
  tx?: DbClient,
) {
  return db(tx).return.findFirst({
    where: {
      orderId,
      userId,
      status: { in: ['pending', 'approved'] },
    },
  });
}

export async function create(
  data: {
    orderId: string;
    userId: string;
    reason: string;
    description?: string;
    images: string[];
    refundAmount: number;
  },
  tx?: DbClient,
) {
  return db(tx).return.create({
    data,
    include: {
      order: {
        select: { id: true, orderNumber: true, total: true },
      },
    },
  });
}

export async function deleteForUser(id: string, userId: string, tx?: DbClient) {
  const result = await db(tx).return.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

export async function findAllForAdmin(
  opts: { status?: string; skip: number; take: number },
  tx?: DbClient,
) {
  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;
  const client = db(tx);
  const [returns, total] = await Promise.all([
    client.return.findMany({
      where,
      include: returnAdminInclude,
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.take,
    }),
    client.return.count({ where }),
  ]);
  return { returns, total };
}

export async function updateStatus(
  id: string,
  data: { status: string; adminNote?: string; refundAmount?: number },
  tx?: DbClient,
) {
  return db(tx).return.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, fullName: true, phone: true } },
      order: { select: { id: true, orderNumber: true, total: true } },
    },
  });
}
