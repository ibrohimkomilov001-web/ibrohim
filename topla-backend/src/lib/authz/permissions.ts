/**
 * ============================================
 * TOPLA Permission Catalog (RBAC v2)
 * ============================================
 * Yagona source-of-truth — barcha permissionlar shu yerdan import qilinadi.
 * Har permission'ga o'zgarmas `bit` raqami beriladi (bitmask uchun).
 * YANGI permission qo'shilsa — eng oxiriga qo'shiladi, mavjudlarning biti o'zgartirilmaydi.
 */

/**
 * Permission identifier — `{section}.{action}` formatida.
 */
export const PERM = {
  // users (6)
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_BLOCK: 'users.block',
  USERS_ASSIGN_ROLE: 'users.assign_role',

  // shops (7)
  SHOPS_VIEW: 'shops.view',
  SHOPS_CREATE: 'shops.create',
  SHOPS_UPDATE: 'shops.update',
  SHOPS_DELETE: 'shops.delete',
  SHOPS_APPROVE: 'shops.approve',
  SHOPS_BLOCK: 'shops.block',
  SHOPS_VIEW_FINANCE: 'shops.view_finance',

  // products (8)
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_MODERATE: 'products.moderate',
  PRODUCTS_APPROVE: 'products.approve',
  PRODUCTS_REJECT: 'products.reject',
  PRODUCTS_BULK_IMPORT: 'products.bulk_import',

  // orders (7)
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_REFUND: 'orders.refund',
  ORDERS_ASSIGN_COURIER: 'orders.assign_courier',
  ORDERS_VIEW_ALL_SHOPS: 'orders.view_all_shops',

  // inventory (4)
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_RECEIVE: 'inventory.receive',
  INVENTORY_TRANSFER: 'inventory.transfer',

  // payouts (5)
  PAYOUTS_VIEW: 'payouts.view',
  PAYOUTS_REQUEST: 'payouts.request',
  PAYOUTS_APPROVE: 'payouts.approve',
  PAYOUTS_REJECT: 'payouts.reject',
  PAYOUTS_EXPORT: 'payouts.export',

  // finance (4)
  FINANCE_VIEW_TRANSACTIONS: 'finance.view_transactions',
  FINANCE_VIEW_COMMISSION: 'finance.view_commission',
  FINANCE_VIEW_REPORTS: 'finance.view_reports',
  FINANCE_EXPORT: 'finance.export',

  // promotions (4)
  PROMOTIONS_VIEW: 'promotions.view',
  PROMOTIONS_CREATE: 'promotions.create',
  PROMOTIONS_UPDATE: 'promotions.update',
  PROMOTIONS_DELETE: 'promotions.delete',

  // promo_codes (3)
  PROMO_CODES_VIEW: 'promo_codes.view',
  PROMO_CODES_CREATE: 'promo_codes.create',
  PROMO_CODES_MANAGE: 'promo_codes.manage',

  // banners (3)
  BANNERS_VIEW: 'banners.view',
  BANNERS_CREATE: 'banners.create',
  BANNERS_MANAGE: 'banners.manage',

  // categories (3)
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_MANAGE: 'categories.manage',

  // reviews (4)
  REVIEWS_VIEW: 'reviews.view',
  REVIEWS_MODERATE: 'reviews.moderate',
  REVIEWS_DELETE: 'reviews.delete',
  REVIEWS_RESPOND: 'reviews.respond',

  // penalties (3)
  PENALTIES_VIEW: 'penalties.view',
  PENALTIES_CREATE: 'penalties.create',
  PENALTIES_WAIVE: 'penalties.waive',

  // analytics (3)
  ANALYTICS_VIEW_SHOP: 'analytics.view_shop',
  ANALYTICS_VIEW_PLATFORM: 'analytics.view_platform',
  ANALYTICS_EXPORT: 'analytics.export',

  // content (3) — contentmanager uchun
  CONTENT_VIEW: 'content.view',
  CONTENT_CREATE_SHOTS: 'content.create_shots',
  CONTENT_PUBLISH_SHOTS: 'content.publish_shots',

  // staff (4)
  STAFF_VIEW: 'staff.view',
  STAFF_INVITE: 'staff.invite',
  STAFF_UPDATE_ROLE: 'staff.update_role',
  STAFF_REMOVE: 'staff.remove',

  // settings (3)
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE_SHOP: 'settings.update_shop',
  SETTINGS_UPDATE_PLATFORM: 'settings.update_platform',

  // api_keys (3)
  API_KEYS_VIEW: 'api_keys.view',
  API_KEYS_CREATE: 'api_keys.create',
  API_KEYS_REVOKE: 'api_keys.revoke',

  // audit (2)
  AUDIT_VIEW: 'audit.view',
  AUDIT_EXPORT: 'audit.export',

  // notifications (2)
  NOTIFICATIONS_VIEW: 'notifications.view',
  NOTIFICATIONS_SEND_BROADCAST: 'notifications.send_broadcast',
} as const;

export type PermissionKey = keyof typeof PERM;
export type PermissionValue = (typeof PERM)[PermissionKey];

/**
 * Bitmask registratsiyasi.
 * MUHIM: ketma-ketlik O'ZGARMAYDI. Yangi permission faqat oxiriga qo'shiladi.
 * Chunki JWT'dagi va DB'dagi bitmask hex qiymatlari shu biylab tarqaladi.
 */
export const PERMISSION_BITS: readonly PermissionValue[] = [
  PERM.USERS_VIEW,
  PERM.USERS_CREATE,
  PERM.USERS_UPDATE,
  PERM.USERS_DELETE,
  PERM.USERS_BLOCK,
  PERM.USERS_ASSIGN_ROLE,

  PERM.SHOPS_VIEW,
  PERM.SHOPS_CREATE,
  PERM.SHOPS_UPDATE,
  PERM.SHOPS_DELETE,
  PERM.SHOPS_APPROVE,
  PERM.SHOPS_BLOCK,
  PERM.SHOPS_VIEW_FINANCE,

  PERM.PRODUCTS_VIEW,
  PERM.PRODUCTS_CREATE,
  PERM.PRODUCTS_UPDATE,
  PERM.PRODUCTS_DELETE,
  PERM.PRODUCTS_MODERATE,
  PERM.PRODUCTS_APPROVE,
  PERM.PRODUCTS_REJECT,
  PERM.PRODUCTS_BULK_IMPORT,

  PERM.ORDERS_VIEW,
  PERM.ORDERS_CREATE,
  PERM.ORDERS_UPDATE,
  PERM.ORDERS_CANCEL,
  PERM.ORDERS_REFUND,
  PERM.ORDERS_ASSIGN_COURIER,
  PERM.ORDERS_VIEW_ALL_SHOPS,

  PERM.INVENTORY_VIEW,
  PERM.INVENTORY_UPDATE,
  PERM.INVENTORY_RECEIVE,
  PERM.INVENTORY_TRANSFER,

  PERM.PAYOUTS_VIEW,
  PERM.PAYOUTS_REQUEST,
  PERM.PAYOUTS_APPROVE,
  PERM.PAYOUTS_REJECT,
  PERM.PAYOUTS_EXPORT,

  PERM.FINANCE_VIEW_TRANSACTIONS,
  PERM.FINANCE_VIEW_COMMISSION,
  PERM.FINANCE_VIEW_REPORTS,
  PERM.FINANCE_EXPORT,

  PERM.PROMOTIONS_VIEW,
  PERM.PROMOTIONS_CREATE,
  PERM.PROMOTIONS_UPDATE,
  PERM.PROMOTIONS_DELETE,

  PERM.PROMO_CODES_VIEW,
  PERM.PROMO_CODES_CREATE,
  PERM.PROMO_CODES_MANAGE,

  PERM.BANNERS_VIEW,
  PERM.BANNERS_CREATE,
  PERM.BANNERS_MANAGE,

  PERM.CATEGORIES_VIEW,
  PERM.CATEGORIES_CREATE,
  PERM.CATEGORIES_MANAGE,

  PERM.REVIEWS_VIEW,
  PERM.REVIEWS_MODERATE,
  PERM.REVIEWS_DELETE,
  PERM.REVIEWS_RESPOND,

  PERM.PENALTIES_VIEW,
  PERM.PENALTIES_CREATE,
  PERM.PENALTIES_WAIVE,

  PERM.ANALYTICS_VIEW_SHOP,
  PERM.ANALYTICS_VIEW_PLATFORM,
  PERM.ANALYTICS_EXPORT,

  PERM.CONTENT_VIEW,
  PERM.CONTENT_CREATE_SHOTS,
  PERM.CONTENT_PUBLISH_SHOTS,

  PERM.STAFF_VIEW,
  PERM.STAFF_INVITE,
  PERM.STAFF_UPDATE_ROLE,
  PERM.STAFF_REMOVE,

  PERM.SETTINGS_VIEW,
  PERM.SETTINGS_UPDATE_SHOP,
  PERM.SETTINGS_UPDATE_PLATFORM,

  PERM.API_KEYS_VIEW,
  PERM.API_KEYS_CREATE,
  PERM.API_KEYS_REVOKE,

  PERM.AUDIT_VIEW,
  PERM.AUDIT_EXPORT,

  PERM.NOTIFICATIONS_VIEW,
  PERM.NOTIFICATIONS_SEND_BROADCAST,
];

/** Permission -> bit index (O(1) lookup). */
export const PERMISSION_BIT_INDEX: Record<string, number> = Object.freeze(
  PERMISSION_BITS.reduce<Record<string, number>>((acc, perm, idx) => {
    acc[perm] = idx;
    return acc;
  }, {}),
);

/** Permission string valid katalogda bor-yo'qligini tekshirish. */
export function isKnownPermission(p: string): p is PermissionValue {
  return p in PERMISSION_BIT_INDEX;
}

// ============================================
// Bitmask helpers
// ============================================

/**
 * Permission ro'yxatini bitmask hex stringga aylantiradi.
 * Little-endian bo'yicha: bit 0 = eng past bit.
 * Noma'lum permission'lar jimgina skip qilinadi (kelajakda o'chirilgan perm'lar uchun).
 */
export function permissionsToBitmaskHex(permissions: readonly string[]): string {
  const bytesNeeded = Math.ceil(PERMISSION_BITS.length / 8);
  const buf = new Uint8Array(bytesNeeded);
  for (const p of permissions) {
    const idx = PERMISSION_BIT_INDEX[p];
    if (idx === undefined) continue;
    const byteIdx = idx >> 3;
    buf[byteIdx] = (buf[byteIdx] ?? 0) | (1 << (idx & 7));
  }
  let hex = '';
  for (const b of buf) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/**
 * Bitmask hex stringni permission ro'yxatiga qaytaradi.
 */
export function bitmaskHexToPermissions(hex: string): PermissionValue[] {
  if (!hex) return [];
  const clean = hex.toLowerCase().replace(/[^0-9a-f]/g, '');
  const out: PermissionValue[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    const byte = parseInt(clean.slice(i, i + 2), 16);
    if (!byte) continue;
    const byteIdx = i / 2;
    for (let bit = 0; bit < 8; bit++) {
      if (byte & (1 << bit)) {
        const permIdx = byteIdx * 8 + bit;
        const perm = PERMISSION_BITS[permIdx];
        if (perm) out.push(perm);
      }
    }
  }
  return out;
}

/**
 * Bitmask ichida ma'lum permission bor-yo'qligini tekshirish (O(1)).
 */
export function bitmaskHasPermission(hex: string, permission: string): boolean {
  const idx = PERMISSION_BIT_INDEX[permission];
  if (idx === undefined || !hex) return false;
  const byteIdx = idx >> 3;
  const bit = idx & 7;
  const hexOffset = byteIdx * 2;
  if (hexOffset + 2 > hex.length) return false;
  const byte = parseInt(hex.slice(hexOffset, hexOffset + 2), 16);
  if (Number.isNaN(byte)) return false;
  return (byte & (1 << bit)) !== 0;
}

/**
 * Ikkita bitmask'ni OR qiladi (bir nechta membership permission'larini birlashtirish).
 */
export function mergeBitmaskHex(a: string, b: string): string {
  const len = Math.max(a.length, b.length);
  const aP = a.padStart(len, '0');
  const bP = b.padStart(len, '0');
  let out = '';
  for (let i = 0; i < len; i += 2) {
    const av = parseInt(aP.slice(i, i + 2) || '00', 16) || 0;
    const bv = parseInt(bP.slice(i, i + 2) || '00', 16) || 0;
    out += (av | bv).toString(16).padStart(2, '0');
  }
  return out;
}
