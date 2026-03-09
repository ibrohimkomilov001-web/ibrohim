import { fetchUsers, updateUserStatus as apiUpdateUserStatus, updateUserRole as apiUpdateUserRole } from "@/lib/api/admin";
import { PaginationMeta } from "@/components/ui/data-table-pagination";

export type User = {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  avatar_url?: string;
  created_at?: string;
};

export type UsersParams = {
  page?: number;
  search?: string;
  role?: string;
};

const defaultPagination: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false };

export async function getUsers(params?: UsersParams): Promise<{ users: User[]; pagination: PaginationMeta }> {
  try {
    const data = await fetchUsers({
      search: params?.search || undefined,
      role: params?.role && params.role !== 'all' ? params.role : undefined,
      page: params?.page || 1,
    });
    const items = data.items || data.users || [];
    const users = items.map((u: any) => ({
      id: u.id,
      full_name: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      is_active: u.status === 'active' || u.isActive,
      avatar_url: u.avatarUrl,
      created_at: u.createdAt,
    }));
    return {
      users,
      pagination: data.pagination || { ...defaultPagination, total: users.length, totalPages: 1 },
    };
  } catch {
    return { users: [], pagination: defaultPagination };
  }
}

export async function updateUserRole(id: string, role: string): Promise<void> {
  await apiUpdateUserRole(id, role);
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<void> {
  await apiUpdateUserStatus(id, isActive ? 'active' : 'blocked');
}