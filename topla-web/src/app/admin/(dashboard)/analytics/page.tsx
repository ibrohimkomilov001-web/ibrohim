"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  getRevenueData,
  getOrdersData,
  getUsersData,
  getCategoryData,
  getRegionData,
  formatCurrency,
  formatNumber,
  regionLabels,
  statusLabels,
  paymentLabels,
} from "./actions";
import { exportAnalyticsPDF, exportAnalyticsExcel } from "./export";
import UzbekistanMap from "@/components/uzbekistan-map";
import { useTranslation } from "@/store/locale-store";
import {
  StatCard,
  RevenueAreaChart,
  StackedBarChart,
  StatusDonutChart,
  PieRoseChart,
} from "@/components/charts";

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();

  const periods = [
    { value: "1d", label: t("today") },
    { value: "7d", label: t("period7d") },
    { value: "30d", label: t("period30d") },
    { value: "90d", label: t("period90d") },
    { value: "1y", label: t("period1y") },
  ];

  const [period, setPeriod] = useState("30d");
  const [compare, setCompare] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ========== TanStack Query ==========
  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ["analytics-revenue", period, compare],
    queryFn: () => getRevenueData(period, compare),
    staleTime: 60_000,
  });

  const { data: orders } = useQuery({
    queryKey: ["analytics-orders", period],
    queryFn: () => getOrdersData(period),
    staleTime: 60_000,
  });

  const { data: users } = useQuery({
    queryKey: ["analytics-users", period, compare],
    queryFn: () => getUsersData(period, compare),
    staleTime: 60_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["analytics-categories", period],
    queryFn: () => getCategoryData(period),
    staleTime: 60_000,
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["analytics-regions", period],
    queryFn: () => getRegionData(period),
    staleTime: 60_000,
  });

  const loading = revLoading;

  // ========== Exports ==========
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportAnalyticsPDF(period, revenue ?? null, orders ?? null, users ?? null, categories, regions);
      toast.success(t("pdfDownloaded"));
    } catch {
      toast.error(t("pdfExportError"));
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportAnalyticsExcel(period, revenue ?? null, orders ?? null, users ?? null, categories, regions);
      toast.success(t("excelDownloaded"));
    } catch {
      toast.error(t("excelExportError"));
    } finally {
      setExporting(false);
    }
  };

  // ========== Sparkline data ==========
  const revenueSparkline = revenue?.current.map((r) => r.revenue || 0) ?? [];
  const ordersSparkline = orders?.timeSeries.map((o) => o.count || 0) ?? [];
  const usersSparkline = users?.current.map((u) => u.count || 0) ?? [];

  if (loading && !revenue) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("analytics")}</h1>
          <p className="text-muted-foreground">{t("analyticsDesc")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
            <Download className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* Period Filter + Compare Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            {periods.map((p) => (
              <TabsTrigger key={p.value} value={p.value}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Switch id="compare" checked={compare} onCheckedChange={setCompare} />
          <Label htmlFor="compare" className="text-sm">
            {t("comparePeriods")}
          </Label>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* KPI Cards — StatCard with sparklines */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label={t("totalRevenue")}
          value={`${formatCurrency(revenue?.summary.totalRevenue || 0)} so'm`}
          color="primary"
          trend={(revenue?.summary.growthPercent || 0) >= 0 ? "up" : "down"}
          trendValue={`${revenue?.summary.growthPercent || 0}%`}
          sparklineData={revenueSparkline}
        />
        <StatCard
          icon={ShoppingCart}
          label={t("orders")}
          value={formatNumber(revenue?.summary.totalOrders || 0)}
          color="success"
          sparklineData={ordersSparkline}
        />
        <StatCard
          icon={Users}
          label={t("newUsers")}
          value={formatNumber(users?.summary.totalNew || 0)}
          color="purple"
          trend={(users?.summary.growthPercent || 0) >= 0 ? "up" : "down"}
          trendValue={`${users?.summary.growthPercent || 0}%`}
          sparklineData={usersSparkline}
        />
        <StatCard
          icon={MapPin}
          label={t("regions")}
          value={String(regions.length)}
          color="info"
        />
      </div>

      {/* Revenue Chart — ECharts area with compare */}
      <Card>
        <CardHeader>
          <CardTitle>{t("revenueDynamics")}</CardTitle>
          <CardDescription>
            {compare
              ? t("periodsCompared")
              : `${periods.find((p) => p.value === period)?.label} - ${t("revenue")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revenue && revenue.current.length > 0 ? (
            <RevenueAreaChart
              data={revenue.current.map((r) => ({
                date: r.date || "",
                revenue: r.revenue || 0,
              }))}
              compareData={
                compare && revenue.previous.length > 0
                  ? revenue.previous.map((r) => ({
                      date: r.date || "",
                      revenue: r.revenue || 0,
                    }))
                  : undefined
              }
              height={350}
              valueFormatter={(v) => `${formatCurrency(v)} so'm`}
            />
          ) : (
            <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
              {revenue ? t("noData") : <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders + Users Charts — 2 columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("ordersCount")}</CardTitle>
            <CardDescription>{t("dailyOrdersVolume")}</CardDescription>
          </CardHeader>
          <CardContent>
            {orders && orders.timeSeries.length > 0 ? (
              <StackedBarChart
                categories={orders.timeSeries.map((o) => o.date || "")}
                series={[{ name: t("orders"), data: orders.timeSeries.map((o) => o.count || 0) }]}
                height={320}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("newUsers")}</CardTitle>
            <CardDescription>{t("registrationDynamics")}</CardDescription>
          </CardHeader>
          <CardContent>
            {users && users.current.length > 0 ? (
              <StackedBarChart
                categories={users.current.map((u) => u.date || "")}
                series={[
                  { name: t("newUsers"), data: users.current.map((u) => u.count || 0) },
                  ...(compare && users.previous.length > 0
                    ? [{ name: t("previousPeriod"), data: users.previous.map((u) => u.count || 0) }]
                    : []),
                ]}
                height={320}
                grouped={compare}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Donut + Status Donut — 2 columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("salesByCategory")}</CardTitle>
            <CardDescription>{t("revenueSharePercent")}</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <PieRoseChart
                data={categories.map((c) => ({ name: c.name, value: c.revenue }))}
                height={350}
                roseType="area"
              />
            ) : (
              <div className="text-center text-muted-foreground py-10">{t("noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("orderStatuses")}</CardTitle>
            <CardDescription>{t("statusDistribution")}</CardDescription>
          </CardHeader>
          <CardContent>
            {orders && orders.statusBreakdown.length > 0 ? (
              <StatusDonutChart
                data={orders.statusBreakdown.map((s) => ({
                  name: statusLabels[s.status] || s.status,
                  value: s.count,
                  status: s.status,
                }))}
                centerLabel={t("total")}
                centerValue={orders.statusBreakdown
                  .reduce((sum, s) => sum + s.count, 0)
                  .toString()}
                height={350}
              />
            ) : (
              <div className="text-center text-muted-foreground py-10">{t("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods — horizontal bar */}
      <Card>
        <CardHeader>
          <CardTitle>{t("paymentMethods")}</CardTitle>
          <CardDescription>{t("paymentMethodUsage")}</CardDescription>
        </CardHeader>
        <CardContent>
          {orders && orders.paymentBreakdown.length > 0 ? (
            <StackedBarChart
              categories={orders.paymentBreakdown.map((p) => paymentLabels[p.method] || p.method)}
              series={[{ name: t("amount"), data: orders.paymentBreakdown.map((p) => p.total) }]}
              height={200}
              horizontal
              valueFormatter={(v) => `${formatCurrency(v)} so'm`}
            />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              {t("noData")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map + Top Regions Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("regionStats")}</CardTitle>
            <CardDescription>{t("mapOrderDistribution")}</CardDescription>
          </CardHeader>
          <CardContent>
            <UzbekistanMap data={regions} labels={regionLabels} formatRevenue={formatCurrency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("topRegions")}</CardTitle>
            <CardDescription>{t("topRegionsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regions.slice(0, 10).map((r, i) => (
                <div
                  key={r.region}
                  className="flex items-center justify-between py-2 border-b last:border-0 dark:border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <div>
                      <div className="font-medium">{regionLabels[r.region] || r.region}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(r.count)} {t("orderWord")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(r.revenue)} so&apos;m</div>
                    <div className="text-xs text-muted-foreground">
                      {regions.length > 0
                        ? Math.round(
                            (r.revenue / regions.reduce((s, x) => s + x.revenue, 0)) * 100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              ))}
              {regions.length === 0 && (
                <div className="text-center text-muted-foreground py-6">{t("noData")}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
