import { fetchSettings, updateSettings as apiUpdateSettings, fetchUsers } from "@/lib/api/admin";

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