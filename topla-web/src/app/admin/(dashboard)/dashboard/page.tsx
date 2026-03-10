"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingCart,
  Store,
  Package,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useTranslation } from "@/store/locale-store";
import { getAllDashboardData, getDashboardChartData } from "./actions";
import {
  StatCard,
  RevenueAreaChart,
  StatusDonutChart,
  StackedBarChart,
} from "@/components/charts";

const statusColors: Record<string, "default" | "warning" | "success" | "secondary" | "destructive"> = {
  pending: "warning",
  shipped: "secondary",
  delivered: "success",
  cancelled: "destructive",
  refunded: "destructive",
  preparing: "secondary",
  ready: "default",
};

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  ordered: "Buyurtma qilindi",
  shipped: "Yetkazilmoqda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
  refunded: "Qaytarildi",
  preparing: "Tayyorlanmoqda",
  ready: "Tayyor",
  processing: "Tayyorlanmoqda",
  shipping: "Yetkazilmoqda",
  at_pickup_point: "Punktda",
};

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: dashData, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAllDashboardData,
    staleTime: 30_000,
  });

  const { data: chartData } = useQuery({
    queryKey: ["admin-dashboard-charts"],
    queryFn: getDashboardChartData,
    staleTime: 60_000,
  });

  const stats = dashData?.stats ?? { revenue: 0, todayOrders: 0, pendingShops: 0, pendingProducts: 0 };
  const recentOrders = dashData?.recentOrders ?? [];
  const pendingShopsList = dashData?.pendingShops ?? [];

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Generate sparkline from revenue trend
  const revenueSparkline = chartData?.revenueTrend.map((d) => d.revenue) ?? [];
  const ordersSparkline = chartData?.revenueTrend.map((d) => d.orders) ?? [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t("dashboard")}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Xush kelibsiz! Bu yerda asosiy statistikani ko&apos;rishingiz mumkin.
        </p>
      </div>

      {/* Stats Cards with sparklines */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label={t("revenue")}
          value={formatPrice(stats.revenue)}
          color="primary"
          sparklineData={revenueSparkline}
        />
        <StatCard
          icon={ShoppingCart}
          label={t("pendingOrders")}
          value={stats.todayOrders.toString()}
          color="warning"
          sparklineData={ordersSparkline}
        />
        <StatCard
          icon={Store}
          label={t("shops")}
          value={stats.pendingShops.toString()}
          color="info"
        />
        <StatCard
          icon={Package}
          label={t("moderation")}
          value={stats.pendingProducts.toString()}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Trend — ECharts area */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Haftalik daromad trendi</CardTitle>
            <CardDescription>Oxirgi 7 kun</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData && chartData.revenueTrend.length > 0 ? (
              <RevenueAreaChart
                data={chartData.revenueTrend.map((d) => ({
                  date: d.date,
                  revenue: d.revenue,
                  orders: d.orders,
                }))}
                height={240}
                showOrders
                valueFormatter={(v) => formatPrice(v)}
              />
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                {chartData ? t("noData") : <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Donut — ECharts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("orders")}</CardTitle>
            <CardDescription>Oxirgi 30 kun</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData && chartData.statusBreakdown.length > 0 ? (
              <StatusDonutChart
                data={chartData.statusBreakdown.map((s) => ({
                  name: statusLabels[s.status] || s.status,
                  value: s.count,
                  status: s.status,
                }))}
                centerLabel="Jami"
                centerValue={chartData.statusBreakdown.reduce((sum, s) => sum + s.count, 0).toString()}
                height={260}
              />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                {chartData ? t("noData") : <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Categories — ECharts horizontal bar */}
      {chartData && chartData.topCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top kategoriyalar (daromad bo&apos;yicha)</CardTitle>
            <CardDescription>Oxirgi 30 kun</CardDescription>
          </CardHeader>
          <CardContent>
            <StackedBarChart
              categories={chartData.topCategories.map((c) => c.name)}
              series={[{ name: t("revenue"), data: chartData.topCategories.map((c) => c.revenue) }]}
              height={220}
              horizontal
              valueFormatter={(v) => formatPrice(v)}
            />
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-yellow-500/50 bg-yellow-500/5 dark:bg-yellow-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              {t("pendingOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {stats.pendingShops} ta do&apos;kon tekshirilishi kerak
            </p>
            <div className="space-y-2">
              {pendingShopsList.slice(0, 3).map((shop) => (
                <div key={shop.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{shop.name}</span>
                  <span className="text-muted-foreground">{shop.owner}</span>
                </div>
              ))}
            </div>
            <Button variant="link" size="sm" className="px-0 mt-2" asChild>
              <Link href="/admin/shops?status=pending">
                {t("view")} <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-500/50 bg-blue-500/5 dark:bg-blue-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              {t("moderation")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {stats.pendingProducts} ta mahsulot tekshirilishi kerak
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2" asChild>
              <Link href="/admin/products?status=pending">
                {t("view")} <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl">{t("recentOrders")}</CardTitle>
              <CardDescription>Oxirgi 24 soatdagi buyurtmalar</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">{t("view")}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3 p-4">
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("noItems")}</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-3 space-y-2 dark:border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{order.order_number}</span>
                    <Badge variant={statusColors[order.status] || "default"} className="text-xs">
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{order.customer}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{order.shop}</span>
                    <span className="font-medium">{formatPrice(order.total)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{order.date}</div>
                </div>
              ))
            )}
          </div>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("id")}</TableHead>
                  <TableHead>{t("buyer")}</TableHead>
                  <TableHead>{t("shop")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                      {t("noItems")}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.shop}</TableCell>
                      <TableCell>{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[order.status] || "default"}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{order.date}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
          <Link href="/admin/shops" className="block">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <Store className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium text-sm">{t("shops")}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.pendingShops} {t("pending")}
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-orange-500/5">
          <Link href="/admin/orders" className="block">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <ShoppingCart className="h-6 w-6 text-orange-500" />
              <div>
                <div className="font-medium text-sm">{t("orders")}</div>
                <div className="text-xs text-muted-foreground">{t("all")}</div>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-green-500/5">
          <Link href="/admin/users" className="block">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <Users className="h-6 w-6 text-green-500" />
              <div>
                <div className="font-medium text-sm">{t("users")}</div>
                <div className="text-xs text-muted-foreground">{t("settings")}</div>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-blue-500/5">
          <Link href="/admin/payouts" className="block">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <DollarSign className="h-6 w-6 text-blue-500" />
              <div>
                <div className="font-medium text-sm">{t("payments")}</div>
                <div className="text-xs text-muted-foreground">{t("payments")}</div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
