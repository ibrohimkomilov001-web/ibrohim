"use client";

/**
 * ============================================
 * RBAC v2 — React hooks & <Can> component
 * ============================================
 *
 * Foydalanish:
 *   <Can permission="products.create">
 *     <Button>Mahsulot qo'shish</Button>
 *   </Can>
 *
 *   <Can permission="orders.refund" organizationId={shopOrgId}>
 *     ...
 *   </Can>
 *
 *   <Can anyOf={["users.view", "users.update"]}>...</Can>
 *
 *   const { can, canAny, isPlatformSuperAdmin } = usePermissions();
 *   if (can("shops.approve")) { ... }
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { permissionsApi, type AuthzMembership, type MePermissions } from "@/lib/api/permissions";

// ============================================
// Query
// ============================================

const QUERY_KEY = ["me", "permissions"] as const;

export function useMePermissions() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: permissionsApi.getMyPermissions,
    staleTime: 5 * 60 * 1000, // 5 daq
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}

// ============================================
// Helper — membership scope bo'yicha permission tekshirish
// ============================================

interface ScopeOptions {
  organizationId?: string;
  /** Shop.id — agar kerak bo'lsa pre-resolved organizationId'ni uzatish */
  shopOrgId?: string;
}

function membershipCoversScope(
  m: AuthzMembership,
  scope: ScopeOptions,
  allMemberships: AuthzMembership[],
): boolean {
  // Platform darajadagi membership hamma joyga tegishli
  if (m.organizationType === "PLATFORM") return true;

  const target = scope.organizationId ?? scope.shopOrgId;
  if (!target) return true; // scope ko'rsatilmagan — global check

  // To'g'ridan-to'g'ri mos
  if (m.organizationId === target) return true;

  // Parent → child: masalan BUSINESS membership SHOP uchun amal qiladi
  // Target memberships ro'yxatida bo'lmasligi mumkin, lekin bu yerda darak emas.
  // Biz target Organization'ning parent chain'ini bilmaymiz frontend'da,
  // shuning uchun oddiy qoida: agar m.organizationId target'ning parenti bo'lsa.
  const targetMembership = allMemberships.find((x) => x.organizationId === target);
  if (targetMembership && targetMembership.parentOrganizationId === m.organizationId) {
    return true;
  }

  return false;
}

// ============================================
// usePermissions hook
// ============================================

export interface PermissionsApi {
  isLoading: boolean;
  isReady: boolean;
  data: MePermissions | null;
  isPlatformSuperAdmin: boolean;
  memberships: AuthzMembership[];
  allPermissions: string[];

  /** Biror membership ushbu ruxsatga ega bo'lsa — true */
  can: (permission: string, scope?: ScopeOptions) => boolean;
  /** Ro'yxatdagi kamida bittasi bor bo'lsa — true */
  canAny: (permissions: string[], scope?: ScopeOptions) => boolean;
  /** Barchasi bor bo'lsa — true */
  canAll: (permissions: string[], scope?: ScopeOptions) => boolean;
}

export function usePermissions(): PermissionsApi {
  const { data, isLoading } = useMePermissions();

  return useMemo<PermissionsApi>(() => {
    const perms = data ?? null;
    const memberships = perms?.memberships ?? [];
    const allPermissions = perms?.allPermissions ?? [];
    const isPlatformSuperAdmin = perms?.isPlatformSuperAdmin ?? false;

    const can = (permission: string, scope?: ScopeOptions): boolean => {
      if (isPlatformSuperAdmin) return true;
      if (!scope || (!scope.organizationId && !scope.shopOrgId)) {
        return allPermissions.includes(permission);
      }
      return memberships.some(
        (m: AuthzMembership) =>
          m.permissions.includes(permission) &&
          membershipCoversScope(m, scope, memberships),
      );
    };

    const canAny = (permissions: string[], scope?: ScopeOptions): boolean =>
      permissions.some((p) => can(p, scope));

    const canAll = (permissions: string[], scope?: ScopeOptions): boolean =>
      permissions.every((p) => can(p, scope));

    return {
      isLoading,
      isReady: !isLoading && !!perms,
      data: perms ?? null,
      isPlatformSuperAdmin,
      memberships,
      allPermissions,
      can,
      canAny,
      canAll,
    };
  }, [data, isLoading]);
}

// ============================================
// <Can> component
// ============================================

export interface CanProps {
  children: ReactNode;
  /** Bitta ruxsat — anyOf/allOf bilan birga ishlatilmasin */
  permission?: string;
  /** Kamida bittasi bo'lsa ko'rsatiladi */
  anyOf?: string[];
  /** Barchasi bo'lsa ko'rsatiladi */
  allOf?: string[];
  /** Scope */
  organizationId?: string;
  shopOrgId?: string;
  /** Agar ruxsat bo'lmasa ko'rsatiladigan fallback (default: null) */
  fallback?: ReactNode;
  /** Permissions hali yuklanmaganda nimani ko'rsatish (default: null) */
  loading?: ReactNode;
}

export function Can({
  children,
  permission,
  anyOf,
  allOf,
  organizationId,
  shopOrgId,
  fallback = null,
  loading = null,
}: CanProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  if (isLoading) return <>{loading}</>;

  const scope = { organizationId, shopOrgId };

  let allowed = false;
  if (permission) {
    allowed = can(permission, scope);
  } else if (anyOf && anyOf.length > 0) {
    allowed = canAny(anyOf, scope);
  } else if (allOf && allOf.length > 0) {
    allowed = canAll(allOf, scope);
  } else {
    // Hech qaysi shart ko'rsatilmagan — default: ko'rsatish
    allowed = true;
  }

  return <>{allowed ? children : fallback}</>;
}

// ============================================
// <Cannot> — aksinchasi (UX uchun foydali)
// ============================================

export function Cannot(props: CanProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  if (isLoading) return <>{props.loading}</>;

  const scope = { organizationId: props.organizationId, shopOrgId: props.shopOrgId };

  let allowed = false;
  if (props.permission) {
    allowed = can(props.permission, scope);
  } else if (props.anyOf && props.anyOf.length > 0) {
    allowed = canAny(props.anyOf, scope);
  } else if (props.allOf && props.allOf.length > 0) {
    allowed = canAll(props.allOf, scope);
  }

  return <>{!allowed ? props.children : props.fallback}</>;
}
