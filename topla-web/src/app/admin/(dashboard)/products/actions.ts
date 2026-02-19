import { fetchProducts, approveProduct as apiApproveProduct, rejectProduct as apiRejectProduct, deleteProduct as apiDeleteProduct } from "@/lib/api/admin";

export type Product = {
  id: string;
  name_uz: string;
  shop?: { name?: string };
  thumbnail_url?: string;
  category?: { name_uz?: string };
  price: number;
  status: "pending" | "approved" | "rejected" | "draft";
  created_at?: string;
  [key: string]: any;
};

export async function getProducts(): Promise<Product[]> {
  try {
    const data = await fetchProducts();
    const items = data.items || data.products || [];
    return items.map((p: any) => ({
      id: p.id,
      name_uz: p.nameUz || p.name_uz || p.name || 'Nomsiz',
      shop: p.shop ? { name: p.shop.name } : undefined,
      thumbnail_url: p.thumbnailUrl || p.thumbnail_url || p.images?.[0],
      category: p.category ? { name_uz: p.category.nameUz || p.category.name_uz } : undefined,
      price: Number(p.price) || 0,
      status: p.status === 'active' ? 'approved' : p.status === 'has_errors' ? 'rejected' : p.status === 'on_review' ? 'pending' : p.status,
      created_at: p.createdAt || p.created_at,
      quality_score: p.qualityScore || p.quality_score,
      validation_errors: p.validationErrors || p.validation_errors,
    }));
  } catch {
    return [];
  }
}

export async function getProductStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
  try {
    const data = await fetchProducts();
    const s = data.stats || {};
    return {
      total: s.total || (data.items || data.products || []).length || 0,
      pending: s.onReview || s.on_review || 0,
      approved: s.active || 0,
      rejected: (s.hasErrors || s.has_errors || 0) + (s.blocked || 0),
    };
  } catch {
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
}

export async function approveProduct(id: string): Promise<void> {
  await apiApproveProduct(id);
}

export async function rejectProduct(id: string, reason: string): Promise<void> {
  await apiRejectProduct(id, reason);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiDeleteProduct(id);
}