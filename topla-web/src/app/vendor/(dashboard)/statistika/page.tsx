"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueAreaChart, StackedBarChart, StatusDonutChart } from "@/components/charts";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice } from "@/lib/utils";
import { useTranslation } from "@/store/locale-store";
import Link from "next/link";
import {
  Wallet,
  ClipboardList,
  Package,
  Eye,
  Star,
  TrendingUp,
  ShoppingCart,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Percent,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading,
  iconColor = "text-primary",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  loading?: boolean;
  iconColor?: string;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-7 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
          </div>
        </div>
        <div className="text-xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("pending"), variant: "secondary" },
    preparing: { label: t("processing"), variant: "default" },
    shipping: { label: t("shipped"), variant: "default" },
    delivered: { label: t("delivered"), variant: "outline" },
    cancelled: { label: t("cancelled"), variant: "destructive" },
  };
  const c = config[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export default function StatistikaPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  // Stats (dashboard data)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: vendorApi.getStats,
  });

  // Analytics (charts data)
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["vendor-analytics", period],
    queryFn: () => vendorApi.getAnalytics(period),
  });

  // Funnel
  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ["vendor-funnel", period],
    queryFn: () => vendorApi.getFunnelAnalytics(period),
  });

  // Recent orders
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["vendor-orders", { page: 1, limit: 5 }],
    queryFn: () => vendorApi.getOrders({ page: 1, limit: 5 }),
  });

  const chartData = analytics?.dailyRevenue || [];
  const statusData = analytics?.ordersByStatus || [];
  const topProducts = analytics?.topProducts || [];
  const summary = analytics?.summary;
  const funnel = funnelData?.funnel;
  const conversionRates = funnelData?.conversionRates;

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("vendorStatistika")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("vendorAnalyticsDesc")}
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="week">{t("week")}</TabsTrigger>
            <TabsTrigger value="month">{t("month")}</TabsTrigger>
            <TabsTrigger value="year">{t("year")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Alerts - pending orders */}
      {stats && stats.orders?.pending > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-orange-800 dark:text-orange-200">
                {stats.orders.pending} ta buyurtma kutilmoqda
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Buyurtmalarni tezroq tasdiqlang
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-orange-300"
              asChild
            >
              <Link href="/vendor/orders">{t("view")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards - Row 1: Main metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`${t("totalSales")} (${t("today")})`}
          value={stats ? formatPrice(stats.revenue?.today || 0) : "0 so'm"}
          subtitle={
            stats
              ? `${t("month")}: ${formatPrice(stats.revenue?.month || 0)}`
              : undefined
          }
          icon={Wallet}
          loading={statsLoading}
          iconColor="text-green-600"
        />
        <StatCard
          title={t("orders")}
          value={stats ? String(stats.orders?.total || 0) : "0"}
          subtitle={
            stats
              ? `${t("today")}: ${stats.orders?.today || 0} · ${t("pending")}: ${stats.orders?.pending || 0}`
              : undefined
          }
          icon={ClipboardList}
          loading={statsLoading}
          iconColor="text-orange-500"
        />
        <StatCard
          title={t("products")}
          value={stats ? String(stats.products?.total || 0) : "0"}
          subtitle={
            stats
              ? `${t("active")}: ${stats.products?.active || 0}`
              : undefined
          }
          icon={Package}
          loading={statsLoading}
          iconColor="text-blue-500"
        />
        <StatCard
          title={t("reviews")}
          value={stats ? String(stats.reviewCount || 0) : "0"}
          subtitle={
            stats?.rating ? `⭐ ${stats.rating.toFixed(1)}` : undefined
          }
          icon={Star}
          loading={statsLoading}
          iconColor="text-yellow-500"
        />
      </div>

      {/* KPI Cards - Row 2: Financial */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("revenue")}
          value={
            summary
              ? formatPrice(summary.totalRevenue || 0)
              : statsLoading
                ? "..."
                : "0 so'm"
          }
          icon={DollarSign}
          loading={analyticsLoading}
          iconColor="text-emerald-600"
        />
        <StatCard
          title={t("averageCheck")}
          value={
            summary
              ? formatPrice(summary.averageOrderValue || 0)
              : "0 so'm"
          }
          icon={TrendingUp}
          loading={analyticsLoading}
          iconColor="text-blue-500"
        />
        <StatCard
          title={t("commission")}
          value={
            summary
              ? formatPrice(summary.totalCommission || 0)
              : "0 so'm"
          }
          icon={Percent}
          loading={analyticsLoading}
          iconColor="text-red-400"
        />
        <StatCard
          title={t("balance")}
          value={stats ? formatPrice(stats.balance || 0) : "0 so'm"}
          subtitle={
            stats?.commissionRate
              ? `Komissiya: ${stats.commissionRate}%`
              : undefined
          }
          icon={Wallet}
          loading={statsLoading}
          iconColor="text-teal-500"
        />
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t("conversionFunnel")}
          </CardTitle>
          <CardDescription>{t("conversionFunnelDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {funnelLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : funnel ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                {[
                  {
                    label: t("views"),
                    value: funnel.views,
                    icon: Eye,
                    color: "bg-blue-500",
                  },
                  {
                    label: t("addedToCart"),
                    value: funnel.cartAdds,
                    icon: ShoppingCart,
                    color: "bg-yellow-500",
                  },
                  {
                    label: t("orderWord"),
                    value: funnel.orders,
                    icon: ClipboardList,
                    color: "bg-green-500",
                  },
                  {
                    label: t("delivered"),
                    value: funnel.delivered,
                    icon: Package,
                    color: "bg-emerald-600",
                  },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 text-center p-3 rounded-xl bg-muted/50">
                      <step.icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-lg sm:text-2xl font-bold">
                        {step.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {step.label}
                      </div>
                    </div>
                    {i < 3 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-lg font-bold text-blue-600">
                    {conversionRates?.viewToCart}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("viewToCart")}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-lg font-bold text-yellow-600">
                    {conversionRates?.cartToOrder}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("cartToOrder")}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-lg font-bold text-green-600">
                    {conversionRates?.orderToDelivered}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("orderToDelivered")}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg border bg-primary/5">
                  <div className="text-lg font-bold text-primary">
                    {conversionRates?.overall}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("overallConversion")}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-muted-foreground">
              {t("insufficientData")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("revenueChart")}</CardTitle>
            <CardDescription>
              {period === "week"
                ? t("weekly")
                : period === "month"
                  ? t("monthly")
                  : t("yearly")}{" "}
              {t("revenueChartDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : chartData.length > 0 ? (
              <RevenueAreaChart
                data={chartData.map((d: any) => ({
                  date: d.date,
                  revenue: d.revenue,
                  orders: d.orders || 0,
                }))}
                height={250}
                valueFormatter={(v) => formatPrice(v) + " so'm"}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t("insufficientData")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("ordersCount")}</CardTitle>
            <CardDescription>
              {period === "week"
                ? t("weekly")
                : period === "month"
                  ? t("monthly")
                  : t("yearly")}{" "}
              {t("ordersChartDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : chartData.length > 0 ? (
              <StackedBarChart
                categories={chartData.map((d: any) => d.date)}
                series={[
                  {
                    name: t("ordersCount"),
                    data: chartData.map((d: any) => d.orders || 0),
                  },
                ]}
                height={250}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t("insufficientData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Donut + Top Products */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("orderStatuses")}</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : statusData.length > 0 ? (
              <StatusDonutChart
                data={statusData.map((s: any) => ({
                  name: s.status,
                  value: s.count,
                }))}
                centerLabel={t("orderStatuses")}
                centerValue={statusData
                  .reduce((s: number, d: any) => s + d.count, 0)
                  .toString()}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t("insufficientData")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("topSelling")}</CardTitle>
            <CardDescription>{t("topProducts")}</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product: any, index: number) => (
                  <div
                    key={product.productId || index}
                    className="flex items-center gap-3"
                  >
                    <span className="text-sm font-bold text-muted-foreground w-5">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.totalSold || 0} {t("soldCount")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {product.orderCount || 0}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>{t("insufficientData")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("recentOrders")}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/vendor/orders">
              {t("all")}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-xl bg-muted/50"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recentOrders?.data && recentOrders.data.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.data.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/vendor/orders?id=${order.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      Buyurtma #
                      {order.orderNumber || order.id?.slice(-6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items?.length || order.itemCount || 1} ta
                      mahsulot &middot;{" "}
                      {formatPrice(order.totalAmount || order.total || 0)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>{t("noData")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
