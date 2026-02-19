"use client";

import { useEffect, useState } from "react";
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
  Loader2
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { getDashboardStats, getRecentOrders, getPendingShops } from "./actions";

// Types
type Stats = {
  revenue: number;
  todayOrders: number;
  pendingShops: number;
  pendingProducts: number;
};

type Order = {
  id: string;
  order_number: string;
  customer: string;
  shop: string;
  total: number;
  status: string;
  date: string;
};

type Shop = {
  id: string;
  name: string;
  owner: string;
  phone: string;
  date: string;
  email: string | undefined;
};

const statusColors: Record<string, "default" | "warning" | "success" | "secondary" | "destructive"> = {
  pending: "warning",
  confirmed: "default",
  shipped: "secondary",
  delivered: "success",
  cancelled: "destructive",
  refunded: "destructive",
  preparing: "secondary",
  ready: "default"
};

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  ordered: "Buyurtma qilindi",
  shipped: "Yetkazilmoqda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
  refunded: "Qaytarildi",
  preparing: "Tayyorlanmoqda",
  ready: "Tayyor"
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    revenue: 0,
    todayOrders: 0,
    pendingShops: 0,
    pendingProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingShopsList, setPendingShopsList] = useState<Shop[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, ordersData, shopsData] = await Promise.all([
          getDashboardStats(),
          getRecentOrders(),
          getPendingShops()
        ]);

        setStats(statsData);
        setRecentOrders(ordersData as any);
        setPendingShopsList(shopsData as any);
      } catch (error) {
        console.error("Dashboard data gathering failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Jami daromad",
      value: formatPrice(stats.revenue),
      // trend: "up",
      icon: DollarSign,
      // suffix: "so'm",
    },
    {
      title: "Bugungi buyurtmalar",
      value: stats.todayOrders.toString(),
      // trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Kutilayotgan do'konlar",
      value: stats.pendingShops.toString(),
      // trend: "down",
      icon: Store,
    },
    {
      title: "Moderatsiya (mahsulot)",
      value: stats.pendingProducts.toString(),
      // trend: "up",
      icon: Package,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Xush kelibsiz! Bu yerda asosiy statistikani ko'rishingiz mumkin.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {stat.value}
              </div>
              <div className="hidden sm:flex items-center text-xs text-muted-foreground mt-1">
                Real vaqt ma'lumotlari
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Kutilayotgan do'konlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {stats.pendingShops} ta do'kon tekshirilishi kerak
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
                Barchasini ko'rish <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Moderatsiya kutilmoqda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {stats.pendingProducts} ta mahsulot tekshirilishi kerak
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2" asChild>
              <Link href="/admin/products?status=pending">
                Barchasini ko'rish <ArrowRight className="ml-1 h-3 w-3" />
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
              <CardTitle className="text-lg sm:text-xl">So'nggi buyurtmalar</CardTitle>
              <CardDescription>Oxirgi 24 soatdagi buyurtmalar</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">Barchasini ko'rish</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3 p-4">
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Hozircha buyurtmalar yo'q</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-3 space-y-2">
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
                  <TableHead>Buyurtma ID</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Do'kon</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                      Hozircha buyurtmalar yo'q
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
      
      {/* Charts Section Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
         <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Qo'shimcha statistika</CardTitle>
              <CardDescription>Tez orada mavjud bo'ladi...</CardDescription>
            </CardHeader>
            <CardContent className="h-20 flex items-center justify-center text-muted-foreground">
               Backend ma'lumotlari yig'ilmoqda...
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
