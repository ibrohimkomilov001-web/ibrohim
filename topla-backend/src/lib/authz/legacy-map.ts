/**
 * ============================================
 * Legacy → RBAC v2 Permission Mapping
 * ============================================
 * Eski "{section}.manage" umumlashtirilgan permissionlar endi yangi fine-grained
 * permissionlarga map qilinadi. Route'lardagi `requirePermission('xxx.manage')`
 * chaqiruvlari o'zgarmaydi — shu faylda mapping orqali yangi sistemaga ulanadi.
 *
 * Default semantika: legacy `.manage` → eng keng huquqqa teng keluvchi yangi perms OR.
 * V2 can() biror bittasi bor bo'lsa ruxsat beradi.
 */

import type { PermissionValue } from './permissions.js';
import { PERM, isKnownPermission } from './permissions.js';

/**
 * Bitta legacy permission → bir nechta yangi permission.
 * Birortasi bo'lsa ruxsat beriladi (OR semantikasi).
 */
export const LEGACY_PERMISSION_MAP: Record<string, PermissionValue[]> = {
  // .manage umumiy qoplamalar
  'users.manage': [PERM.USERS_UPDATE, PERM.USERS_BLOCK, PERM.USERS_DELETE, PERM.USERS_ASSIGN_ROLE],
  'shops.manage': [PERM.SHOPS_UPDATE, PERM.SHOPS_APPROVE, PERM.SHOPS_BLOCK, PERM.SHOPS_DELETE],
  'products.manage': [PERM.PRODUCTS_UPDATE, PERM.PRODUCTS_MODERATE, PERM.PRODUCTS_APPROVE, PERM.PRODUCTS_DELETE],
  'orders.manage': [PERM.ORDERS_UPDATE, PERM.ORDERS_CANCEL, PERM.ORDERS_REFUND],
  'payouts.manage': [PERM.PAYOUTS_APPROVE, PERM.PAYOUTS_REJECT, PERM.PAYOUTS_EXPORT],
  'finance.manage': [PERM.FINANCE_VIEW_TRANSACTIONS, PERM.FINANCE_VIEW_COMMISSION, PERM.FINANCE_EXPORT],
  'moderation.manage': [
    PERM.PRODUCTS_MODERATE,
    PERM.PRODUCTS_APPROVE,
    PERM.PRODUCTS_REJECT,
    PERM.REVIEWS_MODERATE,
    PERM.REVIEWS_DELETE,
    PERM.SHOPS_APPROVE,
  ],
  'roles.manage': [PERM.USERS_ASSIGN_ROLE, PERM.STAFF_UPDATE_ROLE],
  'settings.manage': [PERM.SETTINGS_UPDATE_PLATFORM],
  'categories.manage': [PERM.CATEGORIES_CREATE, PERM.CATEGORIES_MANAGE],
  'banners.manage': [PERM.BANNERS_CREATE, PERM.BANNERS_MANAGE],
  'promotions.manage': [PERM.PROMOTIONS_CREATE, PERM.PROMOTIONS_UPDATE, PERM.PROMOTIONS_DELETE],
  'promo_codes.manage': [PERM.PROMO_CODES_CREATE, PERM.PROMO_CODES_MANAGE],
  'reviews.manage': [PERM.REVIEWS_MODERATE, PERM.REVIEWS_DELETE, PERM.REVIEWS_RESPOND],
  'penalties.manage': [PERM.PENALTIES_CREATE, PERM.PENALTIES_WAIVE],
  'notifications.manage': [PERM.NOTIFICATIONS_SEND_BROADCAST],
  'analytics.manage': [PERM.ANALYTICS_VIEW_PLATFORM, PERM.ANALYTICS_EXPORT],
  'audit.manage': [PERM.AUDIT_VIEW, PERM.AUDIT_EXPORT],
  'content.manage': [PERM.CONTENT_CREATE_SHOTS, PERM.CONTENT_PUBLISH_SHOTS],
};

/**
 * Input permission ro'yxatini yangi katalogdagi permissionlarga kengaytiradi.
 * Yangi perm lar o'zgarishsiz o'tadi.
 */
export function expandLegacyPermissions(perms: readonly string[]): PermissionValue[] {
  const result = new Set<PermissionValue>();
  for (const p of perms) {
    if (isKnownPermission(p)) {
      result.add(p);
      continue;
    }
    const mapped = LEGACY_PERMISSION_MAP[p];
    if (mapped) {
      for (const m of mapped) result.add(m);
    }
    // Noma'lum — e'tiborsiz qoldiramiz (fail-closed ostida keyin must() tekshiradi)
  }
  return [...result];
}
