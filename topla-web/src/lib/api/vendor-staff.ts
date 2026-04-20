import api from './client';

// ============================================
// Types
// ============================================

export interface StaffRole {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  priority: number;
  permissions: string[];
}

export interface StaffMembership {
  id: string;
  profileId: string;
  organizationId: string;
  roleId: string;
  status: 'pending' | 'active' | 'suspended' | 'revoked';
  invitedEmail?: string | null;
  invitedAt: string;
  acceptedAt?: string | null;
  expiresAt?: string | null;
  extraPermissions: string[];
  profile: {
    id: string;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  role: {
    id: string;
    code: string;
    name: string;
    priority: number;
  };
}

export interface StaffInvite {
  id: string;
  invitedEmail?: string | null;
  invitedAt: string;
  expiresAt?: string | null;
  role: { code: string; name: string };
  profile?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
  } | null;
}

export interface BusinessStructure {
  shop: { id: string; name: string };
  organization: {
    id: string;
    name: string;
    memberships: Array<{
      id: string;
      profileId: string;
      role: { code: string; name: string };
    }>;
  } | null;
  business: {
    id: string;
    name: string;
    children: Array<{ id: string; type: string; name: string }>;
  } | null;
}

type Wrap<T> = { success: true; data: T };

// ============================================
// API
// ============================================

export const vendorStaffApi = {
  listRoles: () =>
    api.get<Wrap<StaffRole[]>>('/vendor/staff/roles').then((r) => r.data),

  listStaff: () =>
    api.get<Wrap<StaffMembership[]>>('/vendor/staff').then((r) => r.data),

  listInvites: () =>
    api.get<Wrap<StaffInvite[]>>('/vendor/staff/invites').then((r) => r.data),

  createInvite: (body: { email: string; roleCode: string; expiresInDays?: number }) =>
    api
      .post<Wrap<{ email: string; roleCode: string; expiresAt: string; inviteUrl?: string; token?: string }>>(
        '/vendor/staff/invites',
        body,
      )
      .then((r) => r.data),

  cancelInvite: (id: string) =>
    api.delete<{ success: true; message: string }>(`/vendor/staff/invites/${id}`),

  acceptInvite: (token: string) =>
    api
      .post<Wrap<StaffMembership>>(`/vendor/staff/invites/${token}/accept`)
      .then((r) => r.data),

  updateStaff: (
    membershipId: string,
    body: { roleCode?: string; status?: 'active' | 'suspended'; extraPermissions?: string[] },
  ) =>
    api
      .put<Wrap<StaffMembership>>(`/vendor/staff/${membershipId}`, body)
      .then((r) => r.data),

  removeStaff: (membershipId: string) =>
    api.delete<{ success: true; message: string }>(`/vendor/staff/${membershipId}`),

  getBusiness: () =>
    api.get<Wrap<BusinessStructure>>('/vendor/business').then((r) => r.data),
};
