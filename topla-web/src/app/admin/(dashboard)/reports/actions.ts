import { fetchReports, fetchAnalyticsRevenue, fetchAnalyticsOrders, fetchAnalyticsUsers } from "@/lib/api/admin";

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

const periodMap: Record<string, string> = {
  week: '7d',
  month: '30d',
  year: '1y',
};

export async function getReportData(period: string): Promise<ReportData> {
  const apiPeriod = periodMap[period] || '30d';

  try {
    const [reportData, revenueData, ordersData, usersData] = await Promise.all([
      fetchReports(apiPeriod).catch(() => null),
      fetchAnalyticsRevenue(apiPeriod, true).catch(() => null),
      fetchAnalyticsOrders(apiPeriod).catch(() => null),
      fetchAnalyticsUsers(apiPeriod, true).catch(() => null),
    ]);

    // Revenue summary from analytics (has compare data)
    const summary = revenueData?.summary || {};
    const currentRevSeries = revenueData?.current || [];
    const previousRevSeries = revenueData?.previous || [];

    const totalRevenue = summary.totalRevenue || 0;
    const totalOrders = summary.totalOrders || 0;
    const avgOrderValue = summary.avgOrderValue || (totalOrders > 0 ? totalRevenue / totalOrders : 0);

    // Calculate previous period totals
    const previousRevenue = previousRevSeries.reduce((sum: number, d: any) => sum + Number(d.revenue || 0), 0);
    const previousOrders = previousRevSeries.reduce((sum: number, d: any) => sum + Number(d.orders || 0), 0);

    // Order status breakdown from analytics
    const ordersByStatus = (ordersData?.statusBreakdown || reportData?.orderStats || []).map((d: any) => ({
      status: d.status,
      count: Number(d.count || d._count?.id || d._count || 0),
    })).filter((d: { status: string; count: number }) => d.count > 0);

    // User stats from analytics
    const userSummary = usersData?.summary || {};
    const newUsers = userSummary.totalNew || reportData?.newUsers || 0;

    // Revenue by day from analytics time series
    const revenueByDay = currentRevSeries.map((d: any) => ({
      date: d.date,
      revenue: Number(d.revenue || 0),
    }));

    return {
      salesOverview: {
        totalRevenue,
        previousRevenue,
        totalOrders,
        previousOrders,
        averageOrderValue: avgOrderValue,
      },
      userStats: {
        totalUsers: newUsers,
        newUsersThisMonth: newUsers,
      },
      ordersByStatus,
      topShops: (reportData?.revenueByShop || []).map((s: any) => ({
        id: s.shopId || s.id || '',
        name: s.shopName || s.name || '-',
        revenue: Number(s.amount || s.revenue || 0),
        orders_count: Number(s.orderCount || 0),
      })),
      topProducts: (reportData?.topProducts || []).map((p: any) => ({
        id: p.id || p.productId || '',
        name: p.nameUz || p.productName || p.name || '-',
        revenue: Number(p.price || 0) * Number(p.salesCount || 0),
        orders_count: Number(p.salesCount || p.orderCount || 0),
      })),
      revenueByDay,
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