/**
 * Repository helpers — tx client type, shared utilities.
 */

import { prisma as defaultPrisma } from '../config/database.js';

/**
 * Har repo funksiyasi ushbu tipdagi client qabul qiladi:
 * - Global `prisma` (extended), yoki
 * - `Prisma.TransactionClient` — `prisma.$transaction` ichidagi tx client.
 *
 * Prisma's extended client and TransactionClient have structurally different
 * internal types (causes "Excessive stack depth" errors). We purposefully
 * erase the type to `any` at the repo boundary — real safety comes from the
 * Prisma model shapes used inside each repo function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbClient = any;

/**
 * Null-safe default — agar caller tx uzatmasa, global prisma.
 */
export function db(tx?: DbClient): DbClient {
  return tx ?? defaultPrisma;
}
