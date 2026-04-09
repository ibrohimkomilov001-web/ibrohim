import { fetchShops, fetchShopStats, updateShopStatus as apiUpdateShopStatus, updateShopCommission as apiUpdateShopCommission, deleteShop as apiDeleteShop, sendShopContract as apiSendContract, getShopContractStatus as apiGetContractStatus } from "@/lib/api/admin";
import type { PaginationMeta } from "@/components/ui/data-table-pagination";

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
  total_products?: number;
  slug?: string;
  business_type?: string;
  inn?: string;
  contract_status?: string;
  contract_url?: string;
  contract_sent_at?: string;
  contract_signed_at?: string;
  owner?: { full_name?: string; phone?: string; email?: string };
};

export type ShopsParams = {
  page?: number;
  search?: string;
  status?: string;
};

export async function getShops(params?: ShopsParams): Promise<{ shops: Shop[]; pagination: PaginationMeta }> {
  try {
    const data = await fetchShops({
      search: params?.search,
      status: params?.status,
      page: params?.page,
    });
    const shops = (data.items || data.shops || []).map((s: any) => ({
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
      total_products: s._count?.products || 0,
      slug: s.slug,
      business_type: s.businessType,
      inn: s.inn,
      contract_status: s.contractStatus,
      contract_url: s.contractUrl,
      contract_sent_at: s.contractSentAt,
      contract_signed_at: s.contractSignedAt,
      owner: s.owner ? { full_name: s.owner.fullName, phone: s.owner.phone, email: s.owner.email } : undefined,
    }));
    const pagination = data.pagination || { page: 1, limit: 20, total: shops.length, totalPages: 1, hasMore: false };
    return { shops, pagination };
  } catch {
    return { shops: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false } };
  }
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

export async function deleteShop(id: string): Promise<void> {
  await apiDeleteShop(id);
}

export async function sendContract(id: string): Promise<void> {
  await apiSendContract(id);
}

export async function checkContractStatus(id: string): Promise<{ contractStatus: string; contractUrl?: string; contractSignedAt?: string; didoxStatus?: string }> {
  return await apiGetContractStatus(id);
}