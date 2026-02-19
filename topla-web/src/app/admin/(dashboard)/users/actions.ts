import { fetchUsers, updateUserStatus as apiUpdateUserStatus, updateUserRole as apiUpdateUserRole } from "@/lib/api/admin";

export type User = {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  avatar_url?: string;
  created_at?: string;
  [key: string]: any;
};

export async function getUsers(): Promise<User[]> {
  try {
    const data = await fetchUsers();
    const users = data.items || data.users || [];
    return users.map((u: any) => ({
      id: u.id,
      full_name: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      is_active: u.status === 'active' || u.isActive,
      avatar_url: u.avatarUrl,
      created_at: u.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function getUserStats(): Promise<{ total: number; customers: number; vendors: number; admins: number; active: number }> {
  try {
    const data = await fetchUsers();
    const users = data.items || data.users || [];
    return {
      total: data.pagination?.total || users.length,
      customers: users.filter((u: any) => u.role === 'user' || u.role === 'customer').length,
      vendors: users.filter((u: any) => u.role === 'vendor').length,
      admins: users.filter((u: any) => u.role === 'admin').length,
      active: users.filter((u: any) => u.status === 'active' || u.isActive).length,
    };
  } catch {
    return { total: 0, customers: 0, vendors: 0, admins: 0, active: 0 };
  }
}

export async function updateUserRole(id: string, role: string): Promise<void> {
  await apiUpdateUserRole(id, role);
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<void> {
  await apiUpdateUserStatus(id, isActive ? 'active' : 'blocked');
}