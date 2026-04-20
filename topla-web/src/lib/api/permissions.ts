/**
 * ============================================
 * RBAC v2 — Permissions API client & types
 * ============================================
 */
import api from './client';

export interface AuthzMembership {
  membershipId: string;
  organizationId: string;
  organizationType: 'PLATFORM' | 'BUSINESS_GROUP' | 'BUSINESS' | 'SHOP' | 'COURIER_COMPANY';
  organizationName: string | null;
  parentOrganizationId: string | null;
  roleCode: string;
  roleName: string;
  rolePriority: number;
  permissions: string[];
}

export interface MePermissions {
  profileId: string;
  isPlatformSuperAdmin: boolean;
  memberships: AuthzMembership[];
  allPermissions: string[];
}

type Wrap<T> = { success: true; data: T };

export const permissionsApi = {
  getMyPermissions: () =>
    api.get<Wrap<MePermissions>>('/auth/me/permissions').then((r) => r.data),
};
