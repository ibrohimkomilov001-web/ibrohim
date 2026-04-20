/**
 * Pickup Point Repository — faqat public (mijoz) endpoint'lar uchun.
 * Admin endpoint'lari alohida orchestratsiya talab qiladi (uniqueness, bcrypt).
 */

import { db, type DbClient } from './_db.js';

export const publicPointSelect = {
  id: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  workingHours: true,
} as const;

export async function findActive(tx?: DbClient) {
  return db(tx).pickupPoint.findMany({
    where: { isActive: true },
    select: publicPointSelect,
    orderBy: { name: 'asc' },
  });
}

export async function findActiveById(id: string, tx?: DbClient) {
  return db(tx).pickupPoint.findFirst({
    where: { id, isActive: true },
    select: publicPointSelect,
  });
}

export async function findById(id: string, tx?: DbClient) {
  return db(tx).pickupPoint.findUnique({ where: { id } });
}

export async function findByLoginCode(loginCode: string, tx?: DbClient) {
  return db(tx).pickupPoint.findUnique({ where: { loginCode } });
}
