import { fetchPromoCodes, createPromoCode as apiCreatePromoCode, updatePromoCode as apiUpdatePromoCode, deletePromoCode as apiDeletePromoCode } from "@/lib/api/admin";
import type { PaginationMeta } from "@/components/ui/data-table-pagination";

export type PromoCode = {
  id: string;
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
};

export type PromoCodesParams = {
  page?: number;
  search?: string;
};

export async function getPromoCodes(params?: PromoCodesParams): Promise<{
  codes: PromoCode[];
  pagination: PaginationMeta;
}> {
  try {
    const data = await fetchPromoCodes({
      search: params?.search,
      page: params?.page,
    });
    const items = data.items || data || [];
    const codes = (Array.isArray(items) ? items : []).map((p: any) => ({
      id: p.id,
      code: p.code,
      description: p.description,
      discount_type: p.discountType,
      discount_value: Number(p.discountValue),
      min_order_amount: p.minOrderAmount ? Number(p.minOrderAmount) : undefined,
      max_discount_amount: p.maxDiscountAmount ? Number(p.maxDiscountAmount) : undefined,
      usage_limit: p.usageLimit,
      used_count: p.usedCount,
      is_active: p.isActive,
    }));
    const pagination = data.pagination || { page: 1, limit: 20, total: codes.length, totalPages: 1, hasMore: false };
    return { codes, pagination };
  } catch {
    return { codes: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false } };
  }
}

export async function createPromoCode(data: Partial<PromoCode>): Promise<void> {
  await apiCreatePromoCode({
    code: data.code,
    description: data.description,
    discountType: data.discount_type,
    discountValue: data.discount_value,
    minOrderAmount: data.min_order_amount,
    maxDiscountAmount: data.max_discount_amount,
    usageLimit: data.usage_limit,
    isActive: data.is_active,
    startDate: data.start_date,
    endDate: data.end_date,
  });
}

export async function togglePromoCodeStatus(id: string, newIsActive: boolean): Promise<void> {
  await apiUpdatePromoCode(id, { isActive: newIsActive });
}

export async function deletePromoCode(id: string): Promise<void> {
  await apiDeletePromoCode(id);
}