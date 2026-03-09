/**
 * Prisma Soft-Delete Extension (Prisma v6 Client Extensions API)
 * 
 * deletedAt != null bo'lgan yozuvlarni avtomatik filtrlab tashlaydi.
 * Bu extension faqat Profile, Product, Shop, Order modellariga ta'sir qiladi.
 *
 * Agar o'chirilgan yozuvlarni ham ko'rish kerak bo'lsa:
 *   prisma.profile.findMany({ where: { deletedAt: { not: null } } })
 *
 * Prisma v6 da $use() middleware olib tashlangan, shuning uchun
 * Prisma.defineExtension + $extends() ishlatiladi.
 */

import { Prisma } from '@prisma/client';

const SOFT_DELETE_MODELS = new Set(['Profile', 'Product', 'Shop', 'Order']);

/**
 * Read query larda avtomatik `deletedAt: null` filter qo'shuvchi helper
 */
function addSoftDeleteFilter(model: string, args: any): any {
  if (!SOFT_DELETE_MODELS.has(model)) return args;
  if (args.where && 'deletedAt' in args.where) return args;
  return { ...args, where: { ...args.where, deletedAt: null } };
}

/**
 * Prisma Client Extension — soft-delete
 * 
 * Read operatsiyalarida avtomatik `deletedAt: null` filter.
 * Delete uchun application kodda `update({ data: { deletedAt: new Date() } })` 
 * ishlatilishi kerak — transparent delete→update interceptor type-safe emas.
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',
  query: {
    $allModels: {
      async findFirst({ model, args, query }) {
        return query(addSoftDeleteFilter(model, args));
      },
      async findFirstOrThrow({ model, args, query }) {
        return query(addSoftDeleteFilter(model, args));
      },
      async findMany({ model, args, query }) {
        return query(addSoftDeleteFilter(model, args));
      },
      async count({ model, args, query }) {
        return query(addSoftDeleteFilter(model, args));
      },
      async aggregate({ model, args, query }) {
        return query(addSoftDeleteFilter(model, args));
      },
      async groupBy({ model, args, query }) {
        return query(addSoftDeleteFilter(model, args));
      },
    },
  },
});
