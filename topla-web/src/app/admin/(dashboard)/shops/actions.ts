import { fetchShops, fetchShopStats, updateShopStatus as apiUpdateShopStatus, updateShopCommission as apiUpdateShopCommission } from "@/lib/api/admin";

export type Shop = {
  id: string;
  name: string;
  status: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  logo_url?: string;
  commission_rate: number;
  balance: number;
  created_at: string;
  total_orders: number;
  business_type?: string;
  inn?: string;
  owner?: { full_name?: string; phone?: string; email?: string };
  [key: string]: any;
};

export async function getShops(): Promise<Shop[]> {
  const data = await fetchShops();
  const shops = data.items || data.shops || [];
  return shops.map((s: any) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    phone: s.phone,
    email: s.email,
    address: s.address,
    city: s.city,
    logo_url: s.logoUrl,
    commission_rate: Number(s.commissionRate) || 0,
    balance: Number(s.balance || 0),
    created_at: s.createdAt,
    total_orders: s._count?.orders || s._count?.orderItems || 0,
    business_type: s.businessType,
    inn: s.inn,
    owner: s.owner ? { full_name: s.owner.fullName, phone: s.owner.phone, email: s.owner.email } : undefined,
  }));
}

export async function getShopStats(): Promise<{ total: number; pending: number; active: number; blocked: number }> {
  const data = await fetchShopStats();
  return {
    total: data.total || 0,
    pending: data.pending || 0,
    active: data.active || 0,
    blocked: data.blocked || 0,
  };
}

export async function updateShopStatus(id: string, status: "active" | "blocked" | "inactive"): Promise<void> {
  await apiUpdateShopStatus(id, status);
}

export async function updateShopCommission(id: string, commission: number): Promise<void> {
  await apiUpdateShopCommission(id, commission);
}