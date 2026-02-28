"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaChart, BarChart, DonutChart } from "@tremor/react";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice } from "@/lib/utils";
import { ClipboardList, Package, DollarSign, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["vendor-analytics", period],
    queryFn: () => vendorApi.getAnalytics(period),
  });

  // Prepare chart data — dailyRevenue contains both revenue & orders columns
  const chartData = analytics?.dailyRevenue || [];
  const statusData = analytics?.ordersByStatus || [];
  const topProducts = analytics?.topProducts || [];
  const summary = analytics?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Statistika</h1>
          <p className="text-muted-foreground">Savdo va mahsulot analitikasi</p>
        </div>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-[160px]">
            <BarChart3 className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Hafta</SelectItem>
            <SelectItem value="month">Oy</SelectItem>
            <SelectItem value="year">Yil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Daromad</span>
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
        </div>

        <div>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Buyurtmalar</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-xl font-bold">{summary?.totalOrders || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Komissiya</span>
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
        </div>

        <div>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">O&apos;rtacha chek</span>
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
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daromad</CardTitle>
            <CardDescription>
              {period === "week" ? "Haftalik" : period === "month" ? "Oylik" : "Yillik"} daromad grafigi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : chartData.length > 0 ? (
              <AreaChart
                className="h-[250px]"
                data={chartData}
                index="date"
                categories={["revenue"]}
                colors={["blue"]}
                valueFormatter={(v) => formatPrice(v) + " so'm"}
                showLegend={false}
                showAnimation
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Ma&apos;lumotlar yetarli emas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buyurtmalar</CardTitle>
            <CardDescription>
              {period === "week" ? "Haftalik" : period === "month" ? "Oylik" : "Yillik"} buyurtmalar soni
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : chartData.length > 0 ? (
              <BarChart
                className="h-[250px]"
                data={chartData}
                index="date"
                categories={["orders"]}
                colors={["violet"]}
                showLegend={false}
                showAnimation
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Ma&apos;lumotlar yetarli emas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buyurtma holatlari</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : statusData.length > 0 ? (
              <DonutChart
                className="h-[250px]"
                data={statusData}
                index="status"
                category="count"
                variant="pie"
                showAnimation
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Ma&apos;lumotlar yetarli emas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eng ko&apos;p sotilgan</CardTitle>
            <CardDescription>Top mahsulotlar</CardDescription>
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
                        {product.totalSold || 0} ta sotildi
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{product.orderCount || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Ma&apos;lumotlar yetarli emas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
