/**
 * ============================================
 * TOPLA Policy Engine (RBAC v2)
 * ============================================
 * Yagona authorization API:
 *   - `can(ctx, permission, opts?)` — boolean, tashlaydigan xato yo'q
 *   - `must(ctx, permission, opts?)` — ruxsat bo'lmasa `ForbiddenError` tashlaydi
 *   - `loadAuthzContext(profileId)` — DB'dan membership to'plamini o'qiydi (cache bilan)
 *
 * Kontekst:
 *   - `memberships`: [{ organizationId, orgType, roleCode, bitmaskHex, extra[] }]
 *   - `isPlatformSuperAdmin`: admin_super rolini qisqa yo'l qilish uchun flag
 *
 * Scope tekshiruvi:
 *   - `opts.organizationId` berilsa — faqat shu org bo'yicha membership'ga qarab ruxsat beriladi
 *   - `opts.shopId` berilsa — shop → organization → parent business zanjirini ko'tarilib tekshiradi
 *   - Berilmasa — hech qaysi orgda permission'i borligi kifoya
 */

import { prisma } from '../../config/database.js';
import { cacheGet, cacheSet, cacheDelete } from '../../config/redis.js';
import {
  bitmaskHasPermission,
  isKnownPermission,
  type PermissionValue,
} from './permissions.js';
import type { OrganizationType, MembershipStatus } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface AuthzMembership {
  membershipId: string;
  organizationId: string;
  orgType: OrganizationType;
  orgParentId: string | null;
  roleCode: string;
  rolePriority: number;
  roleBitmaskHex: string;
  extraPermissions: string[];
  status: MembershipStatus;
}

export interface AuthzContext {
  profileId: string;
  memberships: AuthzMembership[];
  /** Platform darajasida admin_super (yoki boshqa high-priv platform rol) */
  isPlatformSuperAdmin: boolean;
  loadedAt: number;
}

export interface AuthzCheckOptions {
  /** Belgilangan Organization doirasida tekshirish */
  organizationId?: string;
  /** Shop.id bo'yicha — ichida Shop→Organization tuzilmasi ishlatiladi */
  shopId?: string;
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';
  constructor(
    message: string,
    public readonly permission?: string,
  ) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// ============================================
// Cache
// ============================================

const CACHE_TTL_SECONDS = 5 * 60; // 5 daq
const CACHE_KEY_PREFIX = 'authz:ctx:';

function cacheKey(profileId: string) {
  return `${CACHE_KEY_PREFIX}${profileId}`;
}

/**
 * Cache'ni invalidatsiya qilish (membership yoki rol o'zgarganda chaqiriladi).
 */
export async function invalidateAuthzContext(profileId: string): Promise<void> {
  try {
    await cacheDelete(cacheKey(profileId));
  } catch {
    // redis ishlamasa ham davom etadi — kontekst DB'dan qayta o'qiladi
  }
}

// ============================================
// Loading
// ============================================

const PLATFORM_SUPER_ROLES = new Set(['admin_super']);

async function fetchFromDb(profileId: string): Promise<AuthzContext> {
  const rows = await prisma.membership.findMany({
    where: {
      profileId,
      status: 'active',
    },
    include: {
      role: {
        select: { code: true, priority: true, bitmaskHex: true },
      },
      organization: {
        select: { type: true, parentId: true },
      },
    },
  });

  const memberships: AuthzMembership[] = rows.map((r) => ({
    membershipId: r.id,
    organizationId: r.organizationId,
    orgType: r.organization.type,
    orgParentId: r.organization.parentId,
    roleCode: r.role.code,
    rolePriority: r.role.priority,
    roleBitmaskHex: r.role.bitmaskHex,
    extraPermissions: r.extraPermissions ?? [],
    status: r.status,
  }));

  const isPlatformSuperAdmin = memberships.some(
    (m) => m.orgType === 'PLATFORM' && PLATFORM_SUPER_ROLES.has(m.roleCode),
  );

  return {
    profileId,
    memberships,
    isPlatformSuperAdmin,
    loadedAt: Date.now(),
  };
}

/**
 * Profil uchun authz kontekstini yuklaydi. Redis cache (5 daq TTL) ishlatiladi.
 */
export async function loadAuthzContext(profileId: string): Promise<AuthzContext> {
  const key = cacheKey(profileId);

  // 1. Redis'dan
  try {
    const cached = await cacheGet<AuthzContext>(key);
    if (cached) return cached;
  } catch {
    // redis ishlamasa DB'ga tushamiz
  }

  // 2. DB'dan
  const ctx = await fetchFromDb(profileId);

  // 3. Cache'ga yozib qo'yamiz
  try {
    await cacheSet(key, ctx, CACHE_TTL_SECONDS);
  } catch {
    // ignore
  }

  return ctx;
}

// ============================================
// Checks
// ============================================

function membershipHasPermission(m: AuthzMembership, permission: string): boolean {
  if (m.status !== 'active') return false;
  if (bitmaskHasPermission(m.roleBitmaskHex, permission)) return true;
  return m.extraPermissions.includes(permission);
}

/**
 * Biror org zanjirida shu membership qamraydi-yo'qligini aniqlash.
 * BUSINESS membership SHOP ichidagi ruxsatlarni avtomatik beradi (parent → child).
 * PLATFORM membership hamma narsaga ruxsat beradi (o'z perm'lari doirasida).
 */
function membershipCoversOrg(
  m: AuthzMembership,
  targetOrgId: string | undefined,
  targetParentId: string | undefined,
): boolean {
  // Hech qaysi target ko'rsatilmagan — istalgan org'dagi membership ishlaydi
  if (!targetOrgId) return true;

  // Platform membership — barcha orglarga ta'sir qiladi
  if (m.orgType === 'PLATFORM') return true;

  // Direct match
  if (m.organizationId === targetOrgId) return true;

  // Ota-bola: target orgning parenti shu membership bo'lsa
  if (targetParentId && m.organizationId === targetParentId) return true;

  return false;
}

/**
 * Shop.id → (organizationId, parentId) ni topadi (kichik, cachelanadi).
 */
const shopOrgCache = new Map<string, { orgId: string; parentId: string | null; expiresAt: number }>();
const SHOP_CACHE_TTL_MS = 60 * 1000;

async function resolveShopOrg(shopId: string): Promise<{ orgId: string; parentId: string | null } | null> {
  const cached = shopOrgCache.get(shopId);
  if (cached && cached.expiresAt > Date.now()) {
    return { orgId: cached.orgId, parentId: cached.parentId };
  }
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      organizationId: true,
      organization: { select: { parentId: true } },
    },
  });
  if (!shop || !shop.organizationId) return null;
  const entry = {
    orgId: shop.organizationId,
    parentId: shop.organization?.parentId ?? null,
    expiresAt: Date.now() + SHOP_CACHE_TTL_MS,
  };
  shopOrgCache.set(shopId, entry);
  return { orgId: entry.orgId, parentId: entry.parentId };
}

/**
 * Boolean tekshirish — xato tashlamaydi.
 */
export async function can(
  ctx: AuthzContext,
  permission: PermissionValue | string,
  opts: AuthzCheckOptions = {},
): Promise<boolean> {
  // Noma'lum permission — xavfsizlik uchun rad
  if (!isKnownPermission(permission)) return false;

  // Platform super admin bypass
  if (ctx.isPlatformSuperAdmin) return true;

  // Target organizatsiyani aniqlash
  let targetOrgId = opts.organizationId;
  let targetParentId: string | null = null;

  if (opts.shopId && !targetOrgId) {
    const resolved = await resolveShopOrg(opts.shopId);
    if (!resolved) return false;
    targetOrgId = resolved.orgId;
    targetParentId = resolved.parentId;
  } else if (opts.organizationId) {
    // Parent'ni topish (cache'dan)
    const org = await prisma.organization.findUnique({
      where: { id: opts.organizationId },
      select: { parentId: true },
    });
    targetParentId = org?.parentId ?? null;
  }

  for (const m of ctx.memberships) {
    if (!membershipCoversOrg(m, targetOrgId, targetParentId ?? undefined)) continue;
    if (membershipHasPermission(m, permission)) return true;
  }

  return false;
}

/**
 * Ruxsat majburiy — yo'q bo'lsa `ForbiddenError`.
 */
export async function must(
  ctx: AuthzContext,
  permission: PermissionValue | string,
  opts: AuthzCheckOptions = {},
): Promise<void> {
  const ok = await can(ctx, permission, opts);
  if (!ok) {
    throw new ForbiddenError(
      `"${permission}" uchun ruxsat yo'q`,
      permission,
    );
  }
}

/**
 * Birdan ko'p permission — biror bittasi bo'lsa bo'ldi.
 */
export async function canAny(
  ctx: AuthzContext,
  permissions: (PermissionValue | string)[],
  opts: AuthzCheckOptions = {},
): Promise<boolean> {
  for (const p of permissions) {
    if (await can(ctx, p, opts)) return true;
  }
  return false;
}

/**
 * Barcha permission'lar talab qilinadi.
 */
export async function canAll(
  ctx: AuthzContext,
  permissions: (PermissionValue | string)[],
  opts: AuthzCheckOptions = {},
): Promise<boolean> {
  for (const p of permissions) {
    if (!(await can(ctx, p, opts))) return false;
  }
  return true;
}
