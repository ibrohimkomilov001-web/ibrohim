/**
 * ============================================
 * TOPLA Role Templates (RBAC v2)
 * ============================================
 * 21 ta tizim rol shabloni (Yandex Market/Delivery 1:1).
 *
 * Har shablon:
 *   code        — noyob identifier (DB'da Role.code)
 *   name        — odamga ko'rinadigan nom (rus tilida, Yandex bilan bir xil)
 *   description — izoh
 *   scope       — qaysi Organization turida ishlatiladi
 *   priority    — ierarxiyada o'rni (kattaroq = yuqori)
 *   permissions — katalogdan ruxsatlar
 *
 * YANGI rol qo'shilsa bu ro'yxatga qo'shiladi; seed script keyingi `db seed` da avtomatik yuklaydi.
 */

import { PERM, type PermissionValue } from './permissions.js';

export type OrgScope =
  | 'PLATFORM'
  | 'BUSINESS_GROUP'
  | 'BUSINESS'
  | 'SHOP'
  | 'COURIER_COMPANY';

export interface RoleTemplate {
  code: string;
  name: string;
  description: string;
  scope: OrgScope;
  priority: number;
  permissions: PermissionValue[];
}

// ============================================
// Helpers — permission to'plami
// ============================================

const ALL_PERMS = Object.values(PERM) as PermissionValue[];

const SHOP_READ_ONLY: PermissionValue[] = [
  PERM.SHOPS_VIEW,
  PERM.PRODUCTS_VIEW,
  PERM.ORDERS_VIEW,
  PERM.INVENTORY_VIEW,
  PERM.REVIEWS_VIEW,
  PERM.ANALYTICS_VIEW_SHOP,
  PERM.STAFF_VIEW,
  PERM.SETTINGS_VIEW,
];

const SHOP_OPERATOR_BASE: PermissionValue[] = [
  ...SHOP_READ_ONLY,
  PERM.ORDERS_UPDATE,
  PERM.ORDERS_CANCEL,
];

// ============================================
// ROL SHABLONLARI
// ============================================

export const ROLE_TEMPLATES: RoleTemplate[] = [
  // ─── Platform admin (7) ──────────────────────────────
  {
    code: 'admin_super',
    name: 'Super Admin',
    description: 'Platformani to‘liq boshqaruv. Barcha ruxsatlar. Rol o‘zini olib tashlay olmaydi.',
    scope: 'PLATFORM',
    priority: 100,
    permissions: ALL_PERMS,
  },
  {
    code: 'admin_manager',
    name: 'Admin Menejeri',
    description: 'Platform bo‘yicha kundalik boshqaruv. Foydalanuvchi va do‘konlar.',
    scope: 'PLATFORM',
    priority: 80,
    permissions: [
      PERM.USERS_VIEW, PERM.USERS_UPDATE, PERM.USERS_BLOCK,
      PERM.SHOPS_VIEW, PERM.SHOPS_UPDATE, PERM.SHOPS_APPROVE, PERM.SHOPS_BLOCK, PERM.SHOPS_VIEW_FINANCE,
      PERM.PRODUCTS_VIEW, PERM.PRODUCTS_MODERATE, PERM.PRODUCTS_APPROVE, PERM.PRODUCTS_REJECT,
      PERM.ORDERS_VIEW, PERM.ORDERS_VIEW_ALL_SHOPS, PERM.ORDERS_UPDATE, PERM.ORDERS_REFUND,
      PERM.REVIEWS_VIEW, PERM.REVIEWS_MODERATE,
      PERM.PROMOTIONS_VIEW, PERM.PROMOTIONS_CREATE, PERM.PROMOTIONS_UPDATE, PERM.PROMOTIONS_DELETE,
      PERM.PROMO_CODES_VIEW, PERM.PROMO_CODES_CREATE, PERM.PROMO_CODES_MANAGE,
      PERM.BANNERS_VIEW, PERM.BANNERS_CREATE, PERM.BANNERS_MANAGE,
      PERM.CATEGORIES_VIEW, PERM.CATEGORIES_CREATE, PERM.CATEGORIES_MANAGE,
      PERM.ANALYTICS_VIEW_PLATFORM, PERM.ANALYTICS_EXPORT,
      PERM.STAFF_VIEW, PERM.STAFF_INVITE, PERM.STAFF_UPDATE_ROLE, PERM.STAFF_REMOVE,
      PERM.NOTIFICATIONS_VIEW, PERM.NOTIFICATIONS_SEND_BROADCAST,
      PERM.AUDIT_VIEW,
    ],
  },
  {
    code: 'admin_moderator',
    name: 'Moderator',
    description: 'Kontent moderatsiyasi: mahsulotlar, sharhlar, do‘konlar.',
    scope: 'PLATFORM',
    priority: 60,
    permissions: [
      PERM.USERS_VIEW,
      PERM.SHOPS_VIEW, PERM.SHOPS_APPROVE,
      PERM.PRODUCTS_VIEW, PERM.PRODUCTS_MODERATE, PERM.PRODUCTS_APPROVE, PERM.PRODUCTS_REJECT,
      PERM.REVIEWS_VIEW, PERM.REVIEWS_MODERATE, PERM.REVIEWS_DELETE,
      PERM.CONTENT_VIEW, PERM.CONTENT_PUBLISH_SHOTS,
      PERM.PENALTIES_VIEW, PERM.PENALTIES_CREATE,
    ],
  },
  {
    code: 'admin_support',
    name: 'Qo‘llab-quvvatlash',
    description: 'Mijozlar va do‘konlar uchun qo‘llab-quvvatlash.',
    scope: 'PLATFORM',
    priority: 50,
    permissions: [
      PERM.USERS_VIEW, PERM.USERS_UPDATE,
      PERM.SHOPS_VIEW,
      PERM.PRODUCTS_VIEW,
      PERM.ORDERS_VIEW, PERM.ORDERS_VIEW_ALL_SHOPS, PERM.ORDERS_UPDATE, PERM.ORDERS_CANCEL,
      PERM.REVIEWS_VIEW,
      PERM.NOTIFICATIONS_VIEW,
    ],
  },
  {
    code: 'admin_finance',
    name: 'Moliyachi',
    description: 'To‘lovlar, komissiyalar, payout’lar.',
    scope: 'PLATFORM',
    priority: 70,
    permissions: [
      PERM.SHOPS_VIEW, PERM.SHOPS_VIEW_FINANCE,
      PERM.ORDERS_VIEW, PERM.ORDERS_VIEW_ALL_SHOPS, PERM.ORDERS_REFUND,
      PERM.PAYOUTS_VIEW, PERM.PAYOUTS_APPROVE, PERM.PAYOUTS_REJECT, PERM.PAYOUTS_EXPORT,
      PERM.FINANCE_VIEW_TRANSACTIONS, PERM.FINANCE_VIEW_COMMISSION, PERM.FINANCE_VIEW_REPORTS, PERM.FINANCE_EXPORT,
      PERM.PENALTIES_VIEW, PERM.PENALTIES_CREATE, PERM.PENALTIES_WAIVE,
      PERM.AUDIT_VIEW,
    ],
  },
  {
    code: 'admin_analyst',
    name: 'Analitik',
    description: 'Analitika va hisobotlarni ko‘rish/eksport.',
    scope: 'PLATFORM',
    priority: 40,
    permissions: [
      PERM.USERS_VIEW,
      PERM.SHOPS_VIEW,
      PERM.PRODUCTS_VIEW,
      PERM.ORDERS_VIEW, PERM.ORDERS_VIEW_ALL_SHOPS,
      PERM.ANALYTICS_VIEW_SHOP, PERM.ANALYTICS_VIEW_PLATFORM, PERM.ANALYTICS_EXPORT,
      PERM.FINANCE_VIEW_REPORTS,
    ],
  },
  {
    code: 'admin_viewer',
    name: 'Ko‘ruvchi',
    description: 'Faqat ko‘rish uchun (read-only).',
    scope: 'PLATFORM',
    priority: 10,
    permissions: [
      PERM.USERS_VIEW, PERM.SHOPS_VIEW, PERM.PRODUCTS_VIEW,
      PERM.ORDERS_VIEW, PERM.REVIEWS_VIEW, PERM.ANALYTICS_VIEW_PLATFORM,
    ],
  },

  // ─── BusinessGroup / Business (3) ──────────────────────
  {
    code: 'business_owner',
    name: 'Egasi (Владелец)',
    description: 'Biznesning egasi. Kabinet va do‘konlarni to‘liq boshqaradi.',
    scope: 'BUSINESS',
    priority: 100,
    permissions: [
      PERM.SHOPS_VIEW, PERM.SHOPS_CREATE, PERM.SHOPS_UPDATE, PERM.SHOPS_DELETE, PERM.SHOPS_VIEW_FINANCE,
      PERM.PRODUCTS_VIEW, PERM.PRODUCTS_CREATE, PERM.PRODUCTS_UPDATE, PERM.PRODUCTS_DELETE, PERM.PRODUCTS_BULK_IMPORT,
      PERM.ORDERS_VIEW, PERM.ORDERS_UPDATE, PERM.ORDERS_CANCEL, PERM.ORDERS_REFUND,
      PERM.INVENTORY_VIEW, PERM.INVENTORY_UPDATE, PERM.INVENTORY_RECEIVE, PERM.INVENTORY_TRANSFER,
      PERM.PAYOUTS_VIEW, PERM.PAYOUTS_REQUEST, PERM.PAYOUTS_EXPORT,
      PERM.FINANCE_VIEW_TRANSACTIONS, PERM.FINANCE_VIEW_COMMISSION, PERM.FINANCE_VIEW_REPORTS, PERM.FINANCE_EXPORT,
      PERM.PROMOTIONS_VIEW, PERM.PROMOTIONS_CREATE, PERM.PROMOTIONS_UPDATE, PERM.PROMOTIONS_DELETE,
      PERM.PROMO_CODES_VIEW, PERM.PROMO_CODES_CREATE, PERM.PROMO_CODES_MANAGE,
      PERM.REVIEWS_VIEW, PERM.REVIEWS_RESPOND,
      PERM.ANALYTICS_VIEW_SHOP, PERM.ANALYTICS_EXPORT,
      PERM.STAFF_VIEW, PERM.STAFF_INVITE, PERM.STAFF_UPDATE_ROLE, PERM.STAFF_REMOVE,
      PERM.SETTINGS_VIEW, PERM.SETTINGS_UPDATE_SHOP,
      PERM.API_KEYS_VIEW, PERM.API_KEYS_CREATE, PERM.API_KEYS_REVOKE,
    ],
  },
  {
    code: 'business_admin',
    name: 'Kabinet administratori (Администратор кабинета)',
    description: 'Kabinet va do‘konlarni boshqaradi. Owner huquqlarisiz.',
    scope: 'BUSINESS',
    priority: 80,
    permissions: [
      PERM.SHOPS_VIEW, PERM.SHOPS_UPDATE, PERM.SHOPS_VIEW_FINANCE,
      PERM.PRODUCTS_VIEW, PERM.PRODUCTS_CREATE, PERM.PRODUCTS_UPDATE, PERM.PRODUCTS_DELETE, PERM.PRODUCTS_BULK_IMPORT,
      PERM.ORDERS_VIEW, PERM.ORDERS_UPDATE, PERM.ORDERS_CANCEL,
      PERM.INVENTORY_VIEW, PERM.INVENTORY_UPDATE, PERM.INVENTORY_RECEIVE,
      PERM.FINANCE_VIEW_TRANSACTIONS, PERM.FINANCE_VIEW_REPORTS,
      PERM.PROMOTIONS_VIEW, PERM.PROMOTIONS_CREATE, PERM.PROMOTIONS_UPDATE,
      PERM.PROMO_CODES_VIEW, PERM.PROMO_CODES_CREATE,
      PERM.REVIEWS_VIEW, PERM.REVIEWS_RESPOND,
      PERM.ANALYTICS_VIEW_SHOP,
      PERM.STAFF_VIEW, PERM.STAFF_INVITE, PERM.STAFF_UPDATE_ROLE,
      PERM.SETTINGS_VIEW, PERM.SETTINGS_UPDATE_SHOP,
    ],
  },
  {
    code: 'content_manager',
    name: 'Kontent-menejer (Контент-менеджер)',
    description: 'Shot va kontentlarni yaratish, chop etish.',
    scope: 'BUSINESS',
    priority: 50,
    permissions: [
      PERM.CONTENT_VIEW, PERM.CONTENT_CREATE_SHOTS, PERM.CONTENT_PUBLISH_SHOTS,
      PERM.PRODUCTS_VIEW,
      PERM.SHOPS_VIEW,
    ],
  },

  // ─── Shop (Магазин) darajasi (6) ───────────────────────
  {
    code: 'shop_admin',
    name: 'Do‘kon administratori',
    description: 'Bitta do‘konni to‘liq boshqaradi.',
    scope: 'SHOP',
    priority: 90,
    permissions: [
      PERM.SHOPS_VIEW, PERM.SHOPS_UPDATE, PERM.SHOPS_VIEW_FINANCE,
      PERM.PRODUCTS_VIEW, PERM.PRODUCTS_CREATE, PERM.PRODUCTS_UPDATE, PERM.PRODUCTS_DELETE, PERM.PRODUCTS_BULK_IMPORT,
      PERM.ORDERS_VIEW, PERM.ORDERS_UPDATE, PERM.ORDERS_CANCEL,
      PERM.INVENTORY_VIEW, PERM.INVENTORY_UPDATE, PERM.INVENTORY_RECEIVE, PERM.INVENTORY_TRANSFER,
      PERM.PAYOUTS_VIEW, PERM.PAYOUTS_REQUEST,
      PERM.FINANCE_VIEW_TRANSACTIONS, PERM.FINANCE_VIEW_REPORTS,
      PERM.PROMOTIONS_VIEW, PERM.PROMOTIONS_CREATE, PERM.PROMOTIONS_UPDATE,
      PERM.PROMO_CODES_VIEW, PERM.PROMO_CODES_CREATE,
      PERM.REVIEWS_VIEW, PERM.REVIEWS_RESPOND,
      PERM.ANALYTICS_VIEW_SHOP,
      PERM.STAFF_VIEW, PERM.STAFF_INVITE,
      PERM.SETTINGS_VIEW, PERM.SETTINGS_UPDATE_SHOP,
    ],
  },
  {
    code: 'shop_manager',
    name: 'Do‘kon menejeri',
    description: 'Operatsion ish: buyurtmalar, tovarlar, aktsiyalar.',
    scope: 'SHOP',
    priority: 70,
    permissions: [
      PERM.SHOPS_VIEW,
      PERM.PRODUCTS_VIEW, PERM.PRODUCTS_CREATE, PERM.PRODUCTS_UPDATE,
      PERM.ORDERS_VIEW, PERM.ORDERS_UPDATE, PERM.ORDERS_CANCEL,
      PERM.INVENTORY_VIEW, PERM.INVENTORY_UPDATE, PERM.INVENTORY_RECEIVE,
      PERM.PROMOTIONS_VIEW, PERM.PROMOTIONS_CREATE,
      PERM.PROMO_CODES_VIEW,
      PERM.REVIEWS_VIEW, PERM.REVIEWS_RESPOND,
      PERM.ANALYTICS_VIEW_SHOP,
      PERM.SETTINGS_VIEW,
    ],
  },
  {
    code: 'shop_accountant',
    name: 'Buxgalter (Бухгалтер)',
    description: 'Moliyaviy bo‘limlar: payout’lar, hisobotlar, komissiyalar.',
    scope: 'SHOP',
    priority: 60,
    permissions: [
      PERM.SHOPS_VIEW, PERM.SHOPS_VIEW_FINANCE,
      PERM.PRODUCTS_VIEW,
      PERM.ORDERS_VIEW,
      PERM.PAYOUTS_VIEW, PERM.PAYOUTS_REQUEST, PERM.PAYOUTS_EXPORT,
      PERM.FINANCE_VIEW_TRANSACTIONS, PERM.FINANCE_VIEW_COMMISSION, PERM.FINANCE_VIEW_REPORTS, PERM.FINANCE_EXPORT,
      PERM.ANALYTICS_VIEW_SHOP, PERM.ANALYTICS_EXPORT,
    ],
  },
  {
    code: 'shop_operator',
    name: 'Operator (DBS)',
    description: 'Buyurtmalar bilan ishlash — DBS model uchun.',
    scope: 'SHOP',
    priority: 40,
    permissions: [
      ...SHOP_OPERATOR_BASE,
      PERM.ORDERS_ASSIGN_COURIER,
    ],
  },
  {
    code: 'shop_developer',
    name: 'Dasturchi (Разработчик)',
    description: 'API kalitlari va integratsiyalar.',
    scope: 'SHOP',
    priority: 50,
    permissions: [
      PERM.SHOPS_VIEW,
      PERM.PRODUCTS_VIEW, PERM.PRODUCTS_BULK_IMPORT,
      PERM.ORDERS_VIEW,
      PERM.API_KEYS_VIEW, PERM.API_KEYS_CREATE, PERM.API_KEYS_REVOKE,
      PERM.SETTINGS_VIEW,
    ],
  },
  {
    code: 'shop_cashier',
    name: 'Kassir (Кассир)',
    description: 'Offline to‘lovlar va buyurtma holati.',
    scope: 'SHOP',
    priority: 20,
    permissions: [
      PERM.SHOPS_VIEW,
      PERM.ORDERS_VIEW, PERM.ORDERS_UPDATE,
    ],
  },

  // ─── CourierCompany (5) ────────────────────────────────
  {
    code: 'courier_company_owner',
    name: 'Kuryer kompaniyasi egasi',
    description: 'Kuryer kompaniyasining egasi.',
    scope: 'COURIER_COMPANY',
    priority: 100,
    permissions: [
      PERM.ORDERS_VIEW, PERM.ORDERS_UPDATE, PERM.ORDERS_ASSIGN_COURIER,
      PERM.PAYOUTS_VIEW, PERM.PAYOUTS_REQUEST, PERM.PAYOUTS_EXPORT,
      PERM.FINANCE_VIEW_TRANSACTIONS, PERM.FINANCE_VIEW_REPORTS, PERM.FINANCE_EXPORT,
      PERM.ANALYTICS_VIEW_SHOP, PERM.ANALYTICS_EXPORT,
      PERM.STAFF_VIEW, PERM.STAFF_INVITE, PERM.STAFF_UPDATE_ROLE, PERM.STAFF_REMOVE,
      PERM.SETTINGS_VIEW, PERM.SETTINGS_UPDATE_SHOP,
    ],
  },
  {
    code: 'courier_dispatcher',
    name: 'Dispetcher',
    description: 'Buyurtmalarni kuryerlarga taqsimlaydi.',
    scope: 'COURIER_COMPANY',
    priority: 70,
    permissions: [
      PERM.ORDERS_VIEW, PERM.ORDERS_UPDATE, PERM.ORDERS_ASSIGN_COURIER,
      PERM.STAFF_VIEW,
      PERM.ANALYTICS_VIEW_SHOP,
    ],
  },
  {
    code: 'courier_fleet_manager',
    name: 'Avto-park menejeri',
    description: 'Kuryerlar va transportni boshqaradi.',
    scope: 'COURIER_COMPANY',
    priority: 60,
    permissions: [
      PERM.ORDERS_VIEW,
      PERM.STAFF_VIEW, PERM.STAFF_INVITE, PERM.STAFF_UPDATE_ROLE,
      PERM.ANALYTICS_VIEW_SHOP,
      PERM.SETTINGS_VIEW,
    ],
  },
  {
    code: 'courier_accountant',
    name: 'Kompaniya buxgalteri',
    description: 'Kuryer kompaniyasi moliya bo‘limi.',
    scope: 'COURIER_COMPANY',
    priority: 55,
    permissions: [
      PERM.PAYOUTS_VIEW, PERM.PAYOUTS_REQUEST, PERM.PAYOUTS_EXPORT,
      PERM.FINANCE_VIEW_TRANSACTIONS, PERM.FINANCE_VIEW_REPORTS, PERM.FINANCE_EXPORT,
      PERM.ANALYTICS_VIEW_SHOP, PERM.ANALYTICS_EXPORT,
    ],
  },
  {
    code: 'courier_staff',
    name: 'Kuryer',
    description: 'Yetkazib beradigan kuryer.',
    scope: 'COURIER_COMPANY',
    priority: 20,
    permissions: [
      PERM.ORDERS_VIEW, PERM.ORDERS_UPDATE,
    ],
  },
];

export const ROLE_TEMPLATES_BY_CODE: Record<string, RoleTemplate> = Object.freeze(
  ROLE_TEMPLATES.reduce<Record<string, RoleTemplate>>((acc, t) => {
    acc[t.code] = t;
    return acc;
  }, {}),
);
