"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getReportData } from "./actions";
import { useUrlState } from "@/hooks/use-url-state";
import { useTranslation } from "@/store/locale-store";
import {
  StatCard,
  StatusDonutChart,
  RevenueAreaChart,
} from "@/components/charts";

const STATUS_LABELS: Record<string, string> = {
  pending: "pending",
  processing: "orderProcessing",
  shipping: "orderShipping",
  delivered: "orderDelivered",
  cancelled: "cancelled",
  ready_for_pickup: "orderReadyForPickup",
  courier_assigned: "courierAssigned",
  courier_picked_up: "courierPickedUp",
  at_pickup_point: "orderAtPickupPoint",
};

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const [{ period }, setFilters] = useUrlState({ period: "month" });

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-reports", period],
    queryFn: () => getReportData(period),
    staleTime: 60_000,
  });

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading || !data) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const revenueGrowth = calculateGrowth(data.salesOverview.totalRevenue, data.salesOverview.previousRevenue);
  const ordersGrowth = calculateGrowth(data.salesOverview.totalOrders, data.salesOverview.previousOrders);
  const revenueSparkline = data.revenueByDay.map((d) => d.revenue);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t("reportsTitle")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("salesReports")}</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setFilters({ period: v })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t("weekly")}</SelectItem>
              <SelectItem value="month">{t("monthly")}</SelectItem>
              <SelectItem value="year">{t("yearly")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats — StatCards with trends */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label={t("totalRevenue")}
          value={formatPrice(data.salesOverview.totalRevenue)}
          color="primary"
          trend={revenueGrowth >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(revenueGrowth).toFixed(1)}%`}
          sparklineData={revenueSparkline}
        />
        <StatCard
          icon={ShoppingCart}
          label={t("orders")}
          value={data.salesOverview.totalOrders.toString()}
          color="success"
          trend={ordersGrowth >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(ordersGrowth).toFixed(1)}%`}
        />
        <StatCard
          icon={Package}
          label={t("averageCheck")}
          value={formatPrice(data.salesOverview.averageOrderValue)}
          color="warning"
        />
        <StatCard
          icon={Users}
          label={t("users")}
          value={data.userStats.totalUsers.toString()}
          color="purple"
        />
      </div>

      {/* Orders by Status — Donut */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t("ordersByStatus")}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {data.ordersByStatus.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t("noData")}</p>
          ) : (
            <StatusDonutChart
              data={data.ordersByStatus.map((d) => ({
                name: t(STATUS_LABELS[d.status]) || d.status,
                value: d.count,
                status: d.status,
              }))}
              centerLabel={t("total")}
              centerValue={data.ordersByStatus.reduce((s, d) => s + d.count, 0).toString()}
              height={260}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Shops */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t("bestShops")}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {data.topShops.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t("noData")}</p>
            ) : (
              <div className="space-y-3">
                {data.topShops.slice(0, 5).map((shop, i) => (
                  <div key={shop.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold dark:bg-primary/20">
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm truncate">{shop.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{formatPrice(shop.revenue)}</div>
                      <div className="text-xs text-muted-foreground">
                        {shop.orders_count} {t("ordersCount")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t("bestSellingProducts")}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {data.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t("noData")}</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.slice(0, 5).map((product, i) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold dark:bg-primary/20">
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm truncate">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{formatPrice(product.revenue)}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.orders_count} {t("pcs")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart — ECharts area */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t("dailyRevenue")}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {data.revenueByDay.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t("noData")}</p>
          ) : (
            <RevenueAreaChart
              data={data.revenueByDay.map((d) => ({
                date: new Date(d.date).toLocaleDateString("uz-UZ", {
                  day: "2-digit",
                  month: "short",
                }),
                revenue: d.revenue,
              }))}
              height={280}
              valueFormatter={(v) => formatPrice(v)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}