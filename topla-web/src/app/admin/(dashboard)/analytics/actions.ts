import {
  fetchAnalyticsRevenue,
  fetchAnalyticsOrders,
  fetchAnalyticsUsers,
  fetchAnalyticsCategories,
  fetchAnalyticsRegions,
} from "@/lib/api/admin";

// ============================================
// Types
// ============================================
export type TimeSeriesPoint = { date: string; revenue?: number; orders?: number; count?: number };
export type RevenueSummary = { totalRevenue: number; totalOrders: number; growthPercent: number; avgOrderValue: number };
export type UsersSummary = { totalNew: number; growthPercent: number };
export type StatusBreakdown = { status: string; count: number };
export type PaymentBreakdown = { method: string; count: number; total: number };
export type CategorySales = { id: string; name: string; count: number; revenue: number };
export type RegionData = { region: string; count: number; revenue: number };

export type RevenueData = {
  current: TimeSeriesPoint[];
  previous: TimeSeriesPoint[];
  summary: RevenueSummary;
};

export type OrdersData = {
  timeSeries: TimeSeriesPoint[];
  statusBreakdown: StatusBreakdown[];
  paymentBreakdown: PaymentBreakdown[];
};

export type UsersData = {
  current: TimeSeriesPoint[];
  previous: TimeSeriesPoint[];
  summary: UsersSummary;
};

// ============================================
// Region labels
// ============================================
export const regionLabels: Record<string, string> = {
  tashkent_city: "Toshkent shahri",
  tashkent: "Toshkent viloyati",
  samarkand: "Samarqand",
  fergana: "Farg'ona",
  bukhara: "Buxoro",
  andijon: "Andijon",
  namangan: "Namangan",
  khorezm: "Xorazm",
  navoiy: "Navoiy",
  qashqadaryo: "Qashqadaryo",
  surxondaryo: "Surxondaryo",
  jizzax: "Jizzax",
  sirdaryo: "Sirdaryo",
  karakalpakstan: "Qoraqalpog'iston",
  other: "Boshqa",
};

export const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  processing: "Tayyorlanmoqda",
  ready_for_pickup: "Tayyor",
  courier_assigned: "Kuryer tayinlangan",
  courier_picked_up: "Olib ketildi",
  shipping: "Yetkazilmoqda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilingan",
};

export const paymentLabels: Record<string, string> = {
  cash: "Naqd",
  card: "Karta",
  octobank: "Octobank",
};

// ============================================
// Data fetching
// ============================================
export async function getRevenueData(period: string = '30d', compare: boolean = false): Promise<RevenueData> {
  try {
    const data = await fetchAnalyticsRevenue(period, compare);
    return {
      current: data?.current || [],
      previous: data?.previous || [],
      summary: data?.summary || { totalRevenue: 0, totalOrders: 0, growthPercent: 0, avgOrderValue: 0 },
    };
  } catch {
    return { current: [], previous: [], summary: { totalRevenue: 0, totalOrders: 0, growthPercent: 0, avgOrderValue: 0 } };
  }
}

export async function getOrdersData(period: string = '30d'): Promise<OrdersData> {
  try {
    const data = await fetchAnalyticsOrders(period);
    return {
      timeSeries: data?.timeSeries || [],
      statusBreakdown: data?.statusBreakdown || [],
      paymentBreakdown: data?.paymentBreakdown || [],
    };
  } catch {
    return { timeSeries: [], statusBreakdown: [], paymentBreakdown: [] };
  }
}

export async function getUsersData(period: string = '30d', compare: boolean = false): Promise<UsersData> {
  try {
    const data = await fetchAnalyticsUsers(period, compare);
    return {
      current: data?.current || [],
      previous: data?.previous || [],
      summary: data?.summary || { totalNew: 0, growthPercent: 0 },
    };
  } catch {
    return { current: [], previous: [], summary: { totalNew: 0, growthPercent: 0 } };
  }
}

export async function getCategoryData(period: string = '30d'): Promise<CategorySales[]> {
  try {
    const data = await fetchAnalyticsCategories(period);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getRegionData(period: string = '30d'): Promise<RegionData[]> {
  try {
    const data = await fetchAnalyticsRegions(period);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ============================================
// Format helpers
// ============================================
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} mlrd`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} mln`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} ming`;
  return `${amount}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('uz-UZ');
}
