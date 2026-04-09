import { fetchProducts, approveProduct as apiApproveProduct, rejectProduct as apiRejectProduct, deleteProduct as apiDeleteProduct } from "@/lib/api/admin";
import { resolveImageUrl } from "@/lib/api/upload";
import type { PaginationMeta } from "@/components/ui/data-table-pagination";

export type Product = {
  id: string;
  name_uz: string;
  shop?: { name?: string };
  thumbnail_url?: string;
  category?: { name_uz?: string };
  price: number;
  status: "pending" | "approved" | "rejected" | "draft";
  created_at?: string;
  quality_score?: number;
  validation_errors?: any;
};

export type ProductsParams = {
  page?: number;
  search?: string;
  status?: string;
};

// Map frontend tab values to backend status values
const statusToBackend: Record<string, string> = {
  pending: 'on_review',
  approved: 'active',
  rejected: 'has_errors',
};

export async function getProducts(params?: ProductsParams): Promise<{
  products: Product[];
  stats: { total: number; pending: number; approved: number; rejected: number };
  pagination: PaginationMeta;
}> {
  try {
    const backendStatus = params?.status ? statusToBackend[params.status] || params.status : undefined;
    const data = await fetchProducts({
      search: params?.search,
      status: backendStatus,
      page: params?.page,
    });
    const items = data.items || data.products || [];
    const products = items.map((p: any) => ({
      id: p.id,
      name_uz: p.nameUz || p.name_uz || p.name || 'Nomsiz',
      shop: p.shop ? { name: p.shop.name } : undefined,
      thumbnail_url: resolveImageUrl(p.thumbnailUrl || p.thumbnail_url || p.images?.[0]),
      category: p.category ? { name_uz: p.category.nameUz || p.category.name_uz } : undefined,
      price: Number(p.price) || 0,
      status: p.status === 'active' ? 'approved' : p.status === 'has_errors' ? 'rejected' : p.status === 'on_review' ? 'pending' : p.status,
      created_at: p.createdAt || p.created_at,
      quality_score: p.qualityScore || p.quality_score,
      validation_errors: p.validationErrors || p.validation_errors,
    }));
    const s = data.stats || {};
    const pagination = data.pagination || { page: 1, limit: 20, total: products.length, totalPages: 1, hasMore: false };
    return {
      products,
      stats: {
        total: s.total || pagination.total || 0,
        pending: s.onReview || s.on_review || 0,
        approved: s.active || 0,
        rejected: (s.hasErrors || s.has_errors || 0) + (s.blocked || 0),
      },
      pagination,
    };
  } catch {
    return {
      products: [],
      stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false },
    };
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