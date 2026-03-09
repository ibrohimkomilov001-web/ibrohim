import { fetchDashboardStats, fetchAnalyticsRevenue, fetchAnalyticsOrders, fetchAnalyticsCategories } from "@/lib/api/admin";

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

export async function getAllDashboardData(): Promise<{
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  pendingShops: PendingShop[];
}> {
  try {
    const data = await fetchDashboardStats();
    const s = data.stats || data;
    return {
      stats: {
        revenue: s.totalRevenue || data.totalRevenue || 0,
        todayOrders: s.todayOrders || data.todayOrders || 0,
        pendingShops: s.pendingShops || data.pendingShops || 0,
        pendingProducts: s.pendingProducts || data.pendingProducts || 0,
      },
      recentOrders: (data.recentOrders || []).map((o: any) => ({
        id: o.id,
        order_number: o.orderNumber || `#${o.id.slice(0, 8)}`,
        customer: o.user?.fullName || o.customer?.fullName || o.customer?.phone || '-',
        shop: o.items?.[0]?.shop?.name || o.shop?.name || '-',
        total: Number(o.totalAmount || 0),
        status: o.status,
        date: new Date(o.createdAt).toLocaleDateString('uz-UZ'),
      })),
      pendingShops: (data.pendingShopsList || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        owner: s.owner?.fullName || '-',
        phone: s.owner?.phone,
        email: s.email,
        date: s.createdAt ? new Date(s.createdAt).toLocaleDateString('uz-UZ') : undefined,
      })),
    };
  } catch {
    return {
      stats: { revenue: 0, todayOrders: 0, pendingShops: 0, pendingProducts: 0 },
      recentOrders: [],
      pendingShops: [],
    };
  }
}

// Chart data types
export type RevenuePoint = { date: string; revenue: number; orders: number };
export type StatusCount = { status: string; count: number };
export type CategoryStat = { name: string; count: number; revenue: number };

export type DashboardChartData = {
  revenueTrend: RevenuePoint[];
  statusBreakdown: StatusCount[];
  topCategories: CategoryStat[];
};

export async function getDashboardChartData(): Promise<DashboardChartData> {
  try {
    const [revenueData, ordersData, categoriesData] = await Promise.all([
      fetchAnalyticsRevenue('7d').catch(() => null),
      fetchAnalyticsOrders('30d').catch(() => null),
      fetchAnalyticsCategories('30d').catch(() => null),
    ]);

    return {
      revenueTrend: (revenueData?.current || []).map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }),
        revenue: Number(d.revenue || 0),
        orders: Number(d.orders || 0),
      })),
      statusBreakdown: (ordersData?.statusBreakdown || []).map((d: any) => ({
        status: d.status,
        count: Number(d.count || d._count?.id || 0),
      })),
      topCategories: (categoriesData || []).slice(0, 6).map((d: any) => ({
        name: d.name || d.nameUz || '-',
        count: Number(d.count || 0),
        revenue: Number(d.revenue || 0),
      })),
    };
  } catch {
    return { revenueTrend: [], statusBreakdown: [], topCategories: [] };
  }
}