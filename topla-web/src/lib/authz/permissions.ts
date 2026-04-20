/**
 * ============================================
 * RBAC v2 — Permission string constants (frontend)
 * ============================================
 * Backend `src/lib/authz/permissions.ts` bilan sinxron. Bu yerda faqat
 * string literallar — bitmask/buffer logikasi frontendda kerak emas.
 *
 * YANGI permission qo'shish: avval backend PERM ga qo'shing, keyin shu yerga.
 */

export const PERM = {
  // users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_BLOCK: 'users.block',
  USERS_ASSIGN_ROLE: 'users.assign_role',

  // shops
  SHOPS_VIEW: 'shops.view',
  SHOPS_CREATE: 'shops.create',
  SHOPS_UPDATE: 'shops.update',
  SHOPS_DELETE: 'shops.delete',
  SHOPS_APPROVE: 'shops.approve',
  SHOPS_BLOCK: 'shops.block',
  SHOPS_VIEW_FINANCE: 'shops.view_finance',

  // products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_MODERATE: 'products.moderate',
  PRODUCTS_APPROVE: 'products.approve',
  PRODUCTS_REJECT: 'products.reject',
  PRODUCTS_BULK_IMPORT: 'products.bulk_import',

  // orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_REFUND: 'orders.refund',
  ORDERS_ASSIGN_COURIER: 'orders.assign_courier',
  ORDERS_VIEW_ALL_SHOPS: 'orders.view_all_shops',

  // finance
  FINANCE_VIEW: 'finance.view',
  FINANCE_PAYOUTS_APPROVE: 'finance.payouts_approve',
  FINANCE_REFUNDS_APPROVE: 'finance.refunds_approve',

  // reviews
  REVIEWS_VIEW: 'reviews.view',
  REVIEWS_MODERATE: 'reviews.moderate',
  REVIEWS_REPLY: 'reviews.reply',

  // analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',

  // couriers
  COURIERS_VIEW: 'couriers.view',
  COURIERS_ASSIGN: 'couriers.assign',
  COURIERS_MANAGE: 'couriers.manage',
} as const;

export type PermissionKey = keyof typeof PERM;
export type PermissionValue = (typeof PERM)[PermissionKey];
