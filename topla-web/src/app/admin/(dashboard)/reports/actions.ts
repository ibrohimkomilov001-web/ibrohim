import { fetchReports } from "@/lib/api/admin";

export type ReportData = {
  salesOverview: {
    totalRevenue: number;
    previousRevenue: number;
    totalOrders: number;
    previousOrders: number;
    averageOrderValue: number;
  };
  userStats: {
    totalUsers: number;
    newUsersThisMonth: number;
  };
  ordersByStatus: { status: string; count: number }[];
  topShops: { id: string; name: string; revenue: number; orders_count: number }[];
  topProducts: { id: string; name: string; revenue: number; orders_count: number }[];
  revenueByDay: { date: string; revenue: number }[];
};

export async function getReportData(period: "week" | "month" | "year"): Promise<ReportData> {
  try {
    const data = await fetchReports(period);
    return {
      salesOverview: {
        totalRevenue: data.orderStats?.totalRevenue || 0,
        previousRevenue: 0,
        totalOrders: data.orderStats?.totalOrders || 0,
        previousOrders: 0,
        averageOrderValue: data.orderStats?.avgOrderValue || 0,
      },
      userStats: {
        totalUsers: data.newUsers?.length || 0,
        newUsersThisMonth: data.newUsers?.length || 0,
      },
      ordersByStatus: [],
      topShops: (data.revenueByShop || []).map((s: any) => ({
        id: s.shopId || s.id,
        name: s.shopName || s.name,
        revenue: Number(s.revenue || 0),
        orders_count: s.orderCount || 0,
      })),
      topProducts: (data.topProducts || []).map((p: any) => ({
        id: p.productId || p.id,
        name: p.productName || p.name,
        revenue: Number(p.revenue || 0),
        orders_count: p.orderCount || 0,
      })),
      revenueByDay: [],
    };
  } catch {
    return {
      salesOverview: { totalRevenue: 0, previousRevenue: 0, totalOrders: 0, previousOrders: 0, averageOrderValue: 0 },
      userStats: { totalUsers: 0, newUsersThisMonth: 0 },
      ordersByStatus: [],
      topShops: [],
      topProducts: [],
      revenueByDay: [],
    };
  }
}