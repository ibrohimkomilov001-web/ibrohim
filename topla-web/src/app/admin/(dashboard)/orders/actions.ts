import { fetchOrders, updateOrderStatus as apiUpdateOrderStatus } from "@/lib/api/admin";
import { PaginationMeta } from "@/components/ui/data-table-pagination";

export type Order = {
  id: string;
  order_number?: string;
  customer?: { full_name?: string; phone?: string };
  shop?: { name?: string };
  total_amount: number;
  payment_method?: string;
  status: string;
  created_at: string;
};

export type OrdersParams = {
  page?: number;
  search?: string;
  status?: string;
};

const defaultPagination: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false };

export async function getOrders(params?: OrdersParams): Promise<{ orders: Order[]; pagination: PaginationMeta }> {
  try {
    const data = await fetchOrders({
      search: params?.search || undefined,
      status: params?.status && params.status !== 'all' ? params.status : undefined,
      page: params?.page || 1,
    });
    const items = data.items || data.orders || [];
    const orders = items.map((o: any) => ({
      id: o.id,
      order_number: o.orderNumber,
      customer: o.user ? { full_name: o.user.fullName, phone: o.user.phone } : (o.customer ? { full_name: o.customer.fullName, phone: o.customer.phone } : undefined),
      shop: o.shop ? { name: o.shop.name } : (o.items?.[0]?.shop ? { name: o.items[0].shop.name } : undefined),
      total_amount: Number(o.totalAmount || 0),
      payment_method: o.paymentMethod,
      status: o.status,
      created_at: o.createdAt,
    }));
    return {
      orders,
      pagination: data.pagination || { ...defaultPagination, total: orders.length, totalPages: 1 },
    };
  } catch {
    return { orders: [], pagination: defaultPagination };
  }
}

export async function updateOrderStatus(id: string, status: string, note?: string): Promise<void> {
  await apiUpdateOrderStatus(id, status, note);
}