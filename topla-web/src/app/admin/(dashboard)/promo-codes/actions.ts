import { fetchPromoCodes, createPromoCode as apiCreatePromoCode, updatePromoCode as apiUpdatePromoCode, deletePromoCode as apiDeletePromoCode } from "@/lib/api/admin";

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
  [key: string]: any;
};

export async function getPromoCodes(): Promise<PromoCode[]> {
  try {
    const data = await fetchPromoCodes();
    return (data || []).map((p: any) => ({
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
  } catch {
    return [];
  }
}

export async function getPromoCodeStats(): Promise<{ total: number; active: number; inactive: number; totalUsage: number }> {
  try {
    const codes = await getPromoCodes();
    return {
      total: codes.length,
      active: codes.filter(c => c.is_active).length,
      inactive: codes.filter(c => !c.is_active).length,
      totalUsage: codes.reduce((sum, c) => sum + (c.used_count || 0), 0),
    };
  } catch {
    return { total: 0, active: 0, inactive: 0, totalUsage: 0 };
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
  });
}

export async function togglePromoCodeStatus(id: string, currentIsActive: boolean): Promise<void> {
  await apiUpdatePromoCode(id, { isActive: !currentIsActive });
}

export async function deletePromoCode(id: string): Promise<void> {
  await apiDeletePromoCode(id);
}