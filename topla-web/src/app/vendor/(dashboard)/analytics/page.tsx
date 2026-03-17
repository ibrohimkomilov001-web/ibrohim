"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RevenueAreaChart, StackedBarChart, StatusDonutChart } from "@/components/charts";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice } from "@/lib/utils";
import { ClipboardList, Package, DollarSign, BarChart3, Eye, ShoppingCart, TrendingUp, ArrowRight } from "lucide-react";
import { useTranslation } from '@/store/locale-store';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["vendor-analytics", period],
    queryFn: () => vendorApi.getAnalytics(period),
  });

  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ["vendor-funnel", period],
    queryFn: () => vendorApi.getFunnelAnalytics(period),
  });

  // Prepare chart data
  const chartData = analytics?.dailyRevenue || [];
  const statusData = analytics?.ordersByStatus || [];
  const topProducts = analytics?.topProducts || [];
  const summary = analytics?.summary;
  const funnel = funnelData?.funnel;
  const conversionRates = funnelData?.conversionRates;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('vendorAnalyticsTitle')}</h1>
          <p className="text-muted-foreground">{t('vendorAnalyticsDesc')}</p>
        </div>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-[160px]">
            <BarChart3 className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('week')}</SelectItem>
            <SelectItem value="month">{t('month')}</SelectItem>
            <SelectItem value="year">{t('year')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('revenue')}</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-xl font-bold">
                {formatPrice(summary?.totalRevenue || 0)} <span className="text-xs font-normal text-muted-foreground">so&apos;m</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('orders')}</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold">{summary?.totalOrders || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('commission')}</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold">
                {formatPrice(summary?.totalCommission || 0)} <span className="text-xs font-normal text-muted-foreground">so&apos;m</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('averageCheck')}</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-xl font-bold">
                {formatPrice(summary?.averageOrderValue || 0)} <span className="text-xs font-normal text-muted-foreground">so&apos;m</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel Analytics — COMPETE-001 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('conversionFunnel')}
          </CardTitle>
          <CardDescription>{t('conversionFunnelDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {funnelLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : funnel ? (
            <div className="space-y-6">
              {/* Funnel Steps */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                {[
                  { label: t('views'), value: funnel.views, icon: Eye, color: "bg-blue-500" },
                  { label: t('addedToCart'), value: funnel.cartAdds, icon: ShoppingCart, color: "bg-yellow-500" },
                  { label: t('orderWord'), value: funnel.orders, icon: ClipboardList, color: "bg-green-500" },
                  { label: t('delivered'), value: funnel.delivered, icon: Package, color: "bg-emerald-600" },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 text-center p-3 rounded-xl bg-muted/50">
                      <step.icon className={`h-5 w-5 mx-auto mb-1 text-muted-foreground`} />
                      <div className="text-lg sm:text-2xl font-bold">{step.value.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{step.label}</div>
                    </div>
                    {i < 3 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>

              {/* Conversion Rates */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-lg font-bold text-blue-600">{conversionRates?.viewToCart}%</div>
                  <div className="text-xs text-muted-foreground">{t('viewToCart')}</div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-lg font-bold text-yellow-600">{conversionRates?.cartToOrder}%</div>
                  <div className="text-xs text-muted-foreground">{t('cartToOrder')}</div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-lg font-bold text-green-600">{conversionRates?.orderToDelivered}%</div>
                  <div className="text-xs text-muted-foreground">{t('orderToDelivered')}</div>
                </div>
                <div className="text-center p-3 rounded-lg border bg-primary/5">
                  <div className="text-lg font-bold text-primary">{conversionRates?.overall}%</div>
                  <div className="text-xs text-muted-foreground">{t('overallConversion')}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-muted-foreground">
              {t('insufficientData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('revenueChart')}</CardTitle>
            <CardDescription>
              {period === "week" ? t('weekly') : period === "month" ? t('monthly') : t('yearly')} {t('revenueChartDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : chartData.length > 0 ? (
              <RevenueAreaChart
                data={chartData.map((d: any) => ({ date: d.date, revenue: d.revenue, orders: d.orders || 0 }))}
                height={250}
                valueFormatter={(v) => formatPrice(v) + " so'm"}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t('insufficientData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('ordersCount')}</CardTitle>
            <CardDescription>
              {period === "week" ? t('weekly') : period === "month" ? t('monthly') : t('yearly')} {t('ordersChartDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : chartData.length > 0 ? (
              <StackedBarChart
                categories={chartData.map((d: any) => d.date)}
                series={[{ name: t('ordersCount'), data: chartData.map((d: any) => d.orders || 0) }]}
                height={250}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t('insufficientData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Status Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('orderStatuses')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : statusData.length > 0 ? (
              <StatusDonutChart
                data={statusData.map((s: any) => ({ name: s.status, value: s.count }))}
                centerLabel={t('orderStatuses')}
                centerValue={statusData.reduce((s: number, d: any) => s + d.count, 0).toString()}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t('insufficientData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('topSelling')}</CardTitle>
            <CardDescription>{t('topProducts')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                  <div key={product.productId || index} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-5">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.totalSold || 0} {t('soldCount')}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{product.orderCount || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>{t('insufficientData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
