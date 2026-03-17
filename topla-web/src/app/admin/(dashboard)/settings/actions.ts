import { fetchSettings, updateSettings as apiUpdateSettings, fetchUsers, updateUserRole } from "@/lib/api/admin";
import { createRequest } from "@/lib/api/base-client";

export type PlatformSettings = {
  [key: string]: any;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
};

export type Session = {
  id: string;
  deviceName: string | null;
  platform: string | null;
  browser: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
};

// base-client factory orqali yaratilgan request (autoUnwrap: false — eski logika saqlanadi)
const authRequest = createRequest({
  tokenKey: 'admin',
  loginRedirect: '/admin/login',
  useRelativeUrl: true,
  autoUnwrap: false,
});

// Session Management
export async function getSessions(): Promise<Session[]> {
  try {
    const res = await authRequest<{ success: boolean; data: { sessions: Session[] } }>('/auth/sessions');
    return res.data?.sessions || [];
  } catch {
    return [];
  }
}

export async function revokeSession(deviceId: string): Promise<void> {
  await authRequest(`/auth/sessions/${deviceId}`, { method: 'DELETE' });
}

export async function revokeAllOtherSessions(): Promise<void> {
  await authRequest('/auth/sessions/revoke-all', { method: 'POST' });
}

// Password Change
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await authRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const data = await fetchSettings();
    return data || {};
  } catch {
    return {};
  }
}

export async function updatePlatformSettings(settings: PlatformSettings): Promise<void> {
  await apiUpdateSettings(settings);
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const data = await fetchUsers({ role: 'admin' });
    const users = data.users || data || [];
    return users.map((u: any) => ({
      id: u.id,
      fullName: u.fullName || u.full_name || '',
      email: u.email,
      phone: u.phone,
      role: u.role || 'admin',
    }));
  } catch {
    return [];
  }
}

export async function searchUsers(query: string): Promise<AdminUser[]> {
  try {
    const data = await fetchUsers({ search: query });
    const users = data.users || data || [];
    return users
      .filter((u: any) => u.role !== 'admin')
      .map((u: any) => ({
        id: u.id,
        fullName: u.fullName || u.full_name || '',
        email: u.email,
        phone: u.phone,
        role: u.role || 'user',
      }));
  } catch {
    return [];
  }
}

export async function promoteToAdmin(userId: string): Promise<void> {
  await updateUserRole(userId, 'admin');
}

export async function removeAdmin(userId: string): Promise<void> {
  await updateUserRole(userId, 'user');
}