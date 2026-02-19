import { fetchDashboardStats } from "@/lib/api/admin";

export type DashboardStats = {
  revenue: number;
  todayOrders: number;
  pendingShops: number;
  pendingProducts: number;
};

export type RecentOrder = {
  id: string;
  order_number: string;
  customer: string;
  shop: string;
  total: number;
  status: string;
  date: string;
};

export type PendingShop = {
  id: string;
  name: string;
  owner: string;
  phone?: string;
  date?: string;
  email?: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await fetchDashboardStats();
    const stats = data.stats || data;
    return {
      revenue: stats.totalRevenue || data.totalRevenue || 0,
      todayOrders: stats.todayOrders || data.todayOrders || 0,
      pendingShops: stats.pendingShops || data.pendingShops || 0,
      pendingProducts: stats.pendingProducts || data.pendingProducts || 0,
    };
  } catch {
    return { revenue: 0, todayOrders: 0, pendingShops: 0, pendingProducts: 0 };
  }
}

export async function getRecentOrders(): Promise<RecentOrder[]> {
  try {
    const data = await fetchDashboardStats();
    return (data.recentOrders || []).map((o: any) => ({
      id: o.id,
      order_number: o.orderNumber || `#${o.id.slice(0, 8)}`,
      customer: o.user?.fullName || o.customer?.fullName || o.customer?.phone || '-',
      shop: o.items?.[0]?.shop?.name || o.shop?.name || '-',
      total: Number(o.totalAmount || 0),
      status: o.status,
      date: new Date(o.createdAt).toLocaleDateString('uz-UZ'),
    }));
  } catch {
    return [];
  }
}

export async function getPendingShops(): Promise<PendingShop[]> {
  try {
    const data = await fetchDashboardStats();
    return (data.pendingShopsList || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      owner: s.owner?.fullName || '-',
      phone: s.owner?.phone,
      email: s.email,
      date: s.createdAt ? new Date(s.createdAt).toLocaleDateString('uz-UZ') : undefined,
    }));
  } catch {
    return [];
  }
}