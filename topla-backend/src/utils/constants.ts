/**
 * Application-wide constants — eliminates magic strings
 */

// ─── User Roles ──────────────────────────
export const Roles = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  USER: 'user',
  COURIER: 'courier',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

// ─── Cache Keys ──────────────────────────
export const CacheKeys = {
  CATEGORIES_ALL: 'categories:all',
  BRANDS_ALL: 'brands:all',
  COLORS_ALL: 'colors:all',
  SEARCH_POPULAR: 'search:popular',
  PRODUCTS_PATTERN: 'products:*',
  SHOPS_PATTERN: 'shops:*',
  productDetail: (id: string) => `product:detail:${id}`,
  brandsForCategory: (catId: string) => `brands:cat:${catId}`,
  categoriesParent: (parentId: string) => `categories:parent:${parentId}`,
} as const;

// ─── Pagination Defaults ─────────────────
export const Pagination = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
