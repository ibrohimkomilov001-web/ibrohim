"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
} from "lucide-react";

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{title}</span>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${
              changeType === "positive" ? "text-green-600" :
              changeType === "negative" ? "text-red-600" :
              "text-muted-foreground"
            }`}>
              {changeType === "positive" && <ArrowUpRight className="h-4 w-4" />}
              {changeType === "negative" && <ArrowDownRight className="h-4 w-4" />}
              {change}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Kutilmoqda", variant: "secondary" },
    confirmed: { label: "Tasdiqlangan", variant: "default" },
    preparing: { label: "Tayyorlanmoqda", variant: "default" },
    shipping: { label: "Yetkazilmoqda", variant: "default" },
    delivered: { label: "Yetkazildi", variant: "outline" },
    cancelled: { label: "Bekor qilindi", variant: "destructive" },
  };
  const c = config[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: vendorApi.getStats,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["vendor-orders", { page: 1, limit: 5 }],
    queryFn: () => vendorApi.getOrders({ page: 1, limit: 5 }),
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bugungi holat va statistika</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/vendor/products/new">
            <Package className="mr-2 h-4 w-4" />
            Mahsulot qo&apos;shish
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bugungi savdo"
          value={stats ? formatPrice(stats.revenue?.today || 0) : "0 so'm"}
          icon={Wallet}
          loading={statsLoading}
        />
        <StatCard
          title="Buyurtmalar"
          value={stats ? String(stats.orders?.total || 0) : "0"}
          icon={ShoppingCart}
          loading={statsLoading}
        />
        <StatCard
          title="Mahsulotlar"
          value={stats ? String(stats.products?.total || 0) : "0"}
          icon={Package}
          loading={statsLoading}
        />
        <StatCard
          title="Sharhlar"
          value={stats ? String(stats.reviewCount || 0) : "0"}
          icon={Eye}
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">So&apos;nggi buyurtmalar</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendor/orders">
                Barchasi
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
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
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        Buyurtma #{order.orderNumber || order.id?.slice(-6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.length || order.itemCount || 1} ta mahsulot • {formatPrice(order.totalAmount || order.total || 0)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Hozircha buyurtmalar yo&apos;q</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tezkor amallar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start rounded-xl h-12" asChild>
              <Link href="/vendor/products/new">
                <Package className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="text-sm font-medium">Mahsulot qo&apos;shish</div>
                  <div className="text-xs text-muted-foreground">Yangi mahsulot yuklash</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start rounded-xl h-12" asChild>
              <Link href="/vendor/orders">
                <ShoppingCart className="mr-3 h-5 w-5 text-orange-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Buyurtmalar</div>
                  <div className="text-xs text-muted-foreground">
                    {stats?.orders?.pending ? `${stats.orders.pending} ta kutilmoqda` : "Barcha buyurtmalar"}
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start rounded-xl h-12" asChild>
              <Link href="/vendor/balance">
                <Wallet className="mr-3 h-5 w-5 text-green-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Hisobim</div>
                  <div className="text-xs text-muted-foreground">Balans va to&apos;lovlar</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start rounded-xl h-12" asChild>
              <Link href="/vendor/analytics">
                <TrendingUp className="mr-3 h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Statistika</div>
                  <div className="text-xs text-muted-foreground">Batafsil analitika</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats && stats.orders?.pending > 0 && (
        <div>
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
              <Button size="sm" variant="outline" className="rounded-full border-orange-300" asChild>
                <Link href="/vendor/orders">Ko&apos;rish</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
