/**
 * Order Repository \u2014 order queries + mutations.
 */

import { db, type DbClient } from './_db.js';

// ============================================
// Include presets
// ============================================

export const orderListInclude = {
  items: {
    include: {
      product: { select: { id: true, nameUz: true, thumbnailUrl: true } },
      shop: { select: { id: true, name: true } },
    },
  },
  address: true,
} as const;

export const orderDetailInclude = {
  ...orderListInclude,
  user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
  courier: { select: { id: true, fullName: true, phone: true } },
  statusHistory: { orderBy: { createdAt: 'desc' as const } },
} as const;

// ============================================
// Queries
// ============================================

export async function findById(id: string, tx?: DbClient) {
  return db(tx).order.findUnique({
    where: { id },
    include: orderDetailInclude,
  });
}

/**
 * User scope \u2014 faqat o'z buyurtmalari. IDOR-safe.
 */
export async function findByIdForUser(id: string, userId: string, tx?: DbClient) {
  return db(tx).order.findFirst({
    where: { id, userId },
    include: orderDetailInclude,
  });
}

export async function findByUser(
  userId: string,
  opts: { status?: string; skip?: number; take?: number } = {},
  tx?: DbClient,
) {
  const { skip = 0, take = 20, status } = opts;
  const where: Record<string, unknown> = { userId, ...(status && { status }) };

  const [items, total] = await Promise.all([
    db(tx).order.findMany({
      where,
      include: orderListInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    db(tx).order.count({ where }),
  ]);

  return { items, total };
}

/**
 * Vendor orders \u2014 shopId is on OrderItem, so filter via relation.
 */
export async function findByShop(
  shopId: string,
  opts: { status?: string; skip?: number; take?: number } = {},
  tx?: DbClient,
) {
  const { skip = 0, take = 20, status } = opts;
  const where: Record<string, unknown> = {
    items: { some: { shopId } },
    ...(status && { status }),
  };

  const [items, total] = await Promise.all([
    db(tx).order.findMany({
      where,
      include: orderListInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    db(tx).order.count({ where }),
  ]);

  return { items, total };
}

// ============================================
// Mutations
// ============================================

export async function create(data: Record<string, unknown>, tx?: DbClient) {
  return db(tx).order.create({ data, include: orderDetailInclude });
}

export async function update(
  id: string,
  data: Record<string, unknown>,
  tx?: DbClient,
) {
  return db(tx).order.update({ where: { id }, data });
}

/**
 * Status change + audit trail in one transaction-safe operation.
 * Expects caller to wrap in prisma.$transaction and pass tx.
 */
export async function updateStatus(
  id: string,
  newStatus: string,
  changedBy: string | null,
  note: string | null,
  tx?: DbClient,
) {
  const order = await db(tx).order.update({
    where: { id },
    data: { status: newStatus },
  });
  await db(tx).orderStatusHistory.create({
    data: {
      orderId: id,
      status: newStatus,
      changedBy,
      note,
    },
  });
  return order;
}
