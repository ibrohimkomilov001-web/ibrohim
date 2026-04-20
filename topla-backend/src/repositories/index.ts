/**
 * ============================================
 * Repository Layer — Centralized data access
 * ============================================
 *
 * Maqsad: Prisma chaqiriq'larini route'lardan chiqarib, markazlashtirish.
 *
 * Tamoyillar:
 * 1. **Function-first** — har repo oddiy named export'lar bilan
 *    (`findProductById`, `findByShop`...), class-wrapper emas. TS idiomatic,
 *    testga oson, tree-shake do'st.
 *
 * 2. **Transaction-aware** — har funksiya optional `tx` parametri oladi
 *    (`Prisma.TransactionClient | PrismaClient`). Default — global `prisma`.
 *    Shu orqali bir nechta repo chaqiriq'larini bitta tranzaksiyaga birlashtirish
 *    oson.
 *
 * 3. **Tenant-scoped** — `userId`/`shopId`/`organizationId` filter'lar har doim
 *    birinchi argument sifatida majburiy (IDOR himoyasi markazlashtirilgan).
 *
 * 4. **Include pattern'lar markazlashtirilgan** — har domain uchun "default
 *    include"/"list include"/"detail include" const'lar. Route'lar o'zlarining
 *    include'ini o'ylab topmaydi.
 *
 * 5. **Cache integration** — qaysi repo'da cache ishlatilishi kerak bo'lsa,
 *    o'sha joyda get-or-set + invalidation qilinadi. Route bilmaydi.
 *
 * Foydalanish:
 *   import { productRepo } from '../../repositories/index.js';
 *   const product = await productRepo.findByIdForShop(id, shopId);
 */

export * as productRepo from './product.repository.js';
export * as orderRepo from './order.repository.js';
export * as userRepo from './user.repository.js';
export * as shopRepo from './shop.repository.js';
export * as shopReviewRepo from './shop-review.repository.js';
export * as shopFollowRepo from './shop-follow.repository.js';
export * as favoriteRepo from './favorite.repository.js';
export * as addressRepo from './address.repository.js';
export * as cartRepo from './cart.repository.js';
export * as notificationRepo from './notification.repository.js';
export * as bannerRepo from './banner.repository.js';
export * as categoryRepo from './category.repository.js';
export * as brandRepo from './brand.repository.js';
export * as returnRepo from './return.repository.js';
export * as pickupPointRepo from './pickup-point.repository.js';
