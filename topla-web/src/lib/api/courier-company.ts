import api from './client';

// ============================================
// Types
// ============================================

export interface CourierCompanyOrg {
  id: string;
  type: 'COURIER_COMPANY';
  name: string;
  legalName?: string | null;
  inn?: string | null;
  logoUrl?: string | null;
  status: string;
  createdAt: string;
}

export interface CourierCompanyRole {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  priority: number;
  permissions: string[];
}

export interface CourierCompanyMembership {
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

export interface CourierCompanyInvite {
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

export interface CourierInFleet {
  id: string;
  companyId?: string | null;
  vehicleType: 'walking' | 'bicycle' | 'motorcycle' | 'car';
  vehicleNumber?: string | null;
  status: 'online' | 'offline' | 'on_break' | 'busy';
  isVerified: boolean;
  rating: number;
  totalDeliveries: number;
  profile: {
    id: string;
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
}

export interface CourierCompanyOverview {
  organization: CourierCompanyOrg;
  memberships: CourierCompanyMembership[];
  couriers: CourierInFleet[];
}

type Wrap<T> = { success: true; data: T };

// ============================================
// API
// ============================================

export const courierCompanyApi = {
  create: (body: { name: string; legalName?: string; inn?: string }) =>
    api.post<Wrap<CourierCompanyOrg>>('/courier-company', body).then((r) => r.data),

  getOverview: () =>
    api.get<Wrap<CourierCompanyOverview>>('/courier-company').then((r) => r.data),

  listRoles: () =>
    api.get<Wrap<CourierCompanyRole[]>>('/courier-company/roles').then((r) => r.data),

  listStaff: () =>
    api.get<Wrap<CourierCompanyMembership[]>>('/courier-company/staff').then((r) => r.data),

  listInvites: () =>
    api.get<Wrap<CourierCompanyInvite[]>>('/courier-company/staff/invites').then((r) => r.data),

  createInvite: (body: { email: string; roleCode: string; expiresInDays?: number }) =>
    api
      .post<Wrap<{ email: string; roleCode: string; expiresAt: string; inviteUrl?: string; token?: string }>>(
        '/courier-company/staff/invites',
        body,
      )
      .then((r) => r.data),

  cancelInvite: (id: string) =>
    api.delete<{ success: true; message: string }>(`/courier-company/staff/invites/${id}`),

  acceptInvite: (token: string) =>
    api
      .post<Wrap<CourierCompanyMembership>>(`/courier-company/staff/invites/${token}/accept`)
      .then((r) => r.data),

  updateStaff: (
    membershipId: string,
    body: { roleCode?: string; status?: 'active' | 'suspended'; extraPermissions?: string[] },
  ) =>
    api
      .put<Wrap<CourierCompanyMembership>>(`/courier-company/staff/${membershipId}`, body)
      .then((r) => r.data),

  removeStaff: (membershipId: string) =>
    api.delete<{ success: true; message: string }>(`/courier-company/staff/${membershipId}`),

  listFleet: () =>
    api.get<Wrap<CourierInFleet[]>>('/courier-company/couriers').then((r) => r.data),

  attachCourier: (courierId: string) =>
    api
      .post<Wrap<CourierInFleet>>(`/courier-company/couriers/${courierId}/attach`)
      .then((r) => r.data),

  detachCourier: (courierId: string) =>
    api.delete<{ success: true; message: string }>(`/courier-company/couriers/${courierId}/detach`),
};
