import { fetchShops, updateShopStatus as apiUpdateShopStatus, updateShopCommission as apiUpdateShopCommission } from "@/lib/api/admin";

export type Shop = {
  id: string;
  name: string;
  status: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
  commission_rate: number;
  balance: number;
  created_at: string;
  total_orders: number;
  owner?: { full_name?: string; phone?: string };
  [key: string]: any;
};

export async function getShops(): Promise<Shop[]> {
  try {
    const data = await fetchShops();
    const shops = data.items || data.shops || [];
    return shops.map((s: any) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      phone: s.phone,
      email: s.email,
      address: s.address,
      logo_url: s.logoUrl,
      commission_rate: s.commissionRate || 0,
      balance: Number(s.balance || 0),
      created_at: s.createdAt,
      total_orders: s._count?.orders || s._count?.orderItems || 0,
      owner: s.owner ? { full_name: s.owner.fullName, phone: s.owner.phone } : undefined,
    }));
  } catch {
    return [];
  }
}

export async function getShopStats(): Promise<{ total: number; pending: number; active: number; blocked: number }> {
  try {
    const data = await fetchShops();
    const shops = data.items || data.shops || [];
    return {
      total: data.pagination?.total || shops.length,
      pending: shops.filter((s: any) => s.status === 'pending').length,
      active: shops.filter((s: any) => s.status === 'active').length,
      blocked: shops.filter((s: any) => s.status === 'blocked').length,
    };
  } catch {
    return { total: 0, pending: 0, active: 0, blocked: 0 };
  }
}

export async function updateShopStatus(id: string, status: "active" | "blocked" | "inactive"): Promise<void> {
  await apiUpdateShopStatus(id, status);
}

export async function updateShopCommission(id: string, commission: number): Promise<void> {
  await apiUpdateShopCommission(id, commission);
}