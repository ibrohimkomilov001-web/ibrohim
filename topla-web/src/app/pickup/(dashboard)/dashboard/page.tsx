"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCcw,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPickupStats, getPickupOrders } from "@/lib/api/pickup";

interface Stats {
  todayDelivered: number;
  todayWaiting: number;
  totalDelivered: number;
  totalOrders: number;
}

interface RecentOrder {
  id: string;
  orderNumber: number;
  status: string;
  user?: { fullName: string };
  total: number;
  deliveredAt?: string;
  updatedAt?: string;
}

export default function PickupDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        getPickupStats(),
        getPickupOrders(),
      ]);
      setStats(statsRes);
      setRecentOrders((ordersRes || []).slice(0, 5));
    } catch {
      // silently fail; stats will show 0
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const statCards = [
    {
      label: "Bugun topshirilgan",
      value: stats?.todayDelivered ?? 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Hozir kutmoqda",
      value: stats?.todayWaiting ?? 0,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      label: "Jami topshirilgan",
      value: stats?.totalDelivered ?? 0,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Jami buyurtmalar",
      value: stats?.totalOrders ?? 0,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
  ];

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Bosh sahifa</h1>
          <p className="text-sm text-muted-foreground">Bugungi statistika va so&apos;nggi buyurtmalar</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Yangilash
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/pickup/scanner">
          <Card className="border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Skaner</p>
                  <p className="text-sm text-muted-foreground">QR kod skanerlash</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/pickup/orders">
          <Card className="border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Buyurtmalar</p>
                  <p className="text-sm text-muted-foreground">{stats?.todayWaiting || 0} ta kutmoqda</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">So&apos;nggi buyurtmalar</CardTitle>
              <Link href="/pickup/orders" className="text-sm text-orange-600 hover:underline">
                Barchasini ko&apos;rish →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      order.status === "delivered" ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"
                    }`}>
                      {order.status === "delivered" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">#{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.fullName || "Mijoz"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{Number(order.total || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.status === "delivered" ? "Topshirildi" : "Kutmoqda"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
