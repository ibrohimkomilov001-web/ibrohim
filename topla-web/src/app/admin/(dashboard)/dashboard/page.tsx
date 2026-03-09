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
import { getAllDashboardData, getDashboardChartData, type DashboardChartData } from "./actions";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';

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
  shipped: "secondary",
  delivered: "success",
  cancelled: "destructive",
  refunded: "destructive",
  preparing: "secondary",
  ready: "default"
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

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];

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
  const [chartData, setChartData] = useState<DashboardChartData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { stats: statsData, recentOrders: ordersData, pendingShops: shopsData } = await getAllDashboardData();

        setStats(statsData);
        setRecentOrders(ordersData as any);
        setPendingShopsList(shopsData as any);

        // Load charts in background
        getDashboardChartData().then(setChartData).catch(() => {});
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Haftalik daromad trendi</CardTitle>
            <CardDescription>Oxirgi 7 kun</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData && chartData.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData.revenueTrend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-muted-foreground" />
                  <Tooltip formatter={(value: number) => [formatPrice(value), 'Daromad']} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                {chartData ? "Ma'lumot yo'q" : <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Buyurtma statuslari</CardTitle>
            <CardDescription>Oxirgi 30 kun</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData && chartData.statusBreakdown.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={chartData.statusBreakdown}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={70}
                      dataKey="count" nameKey="status"
                      paddingAngle={2}
                    >
                      {chartData.statusBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [value, statusLabels[name] || name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {chartData.statusBreakdown.slice(0, 5).map((s, i) => (
                    <div key={s.status} className="flex items-center gap-1 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {statusLabels[s.status] || s.status}: {s.count}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                {chartData ? "Ma'lumot yo'q" : <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      {chartData && chartData.topCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top kategoriyalar (daromad bo'yicha)</CardTitle>
            <CardDescription>Oxirgi 30 kun</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.topCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(value: number) => [formatPrice(value), 'Daromad']} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
      
      {/* Quick Links */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/shops" className="block">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <Store className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium text-sm">Do&apos;konlar</div>
                <div className="text-xs text-muted-foreground">{stats.pendingShops} ta kutmoqda</div>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/orders" className="block">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <ShoppingCart className="h-6 w-6 text-orange-500" />
              <div>
                <div className="font-medium text-sm">Buyurtmalar</div>
                <div className="text-xs text-muted-foreground">Barchasi</div>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/users" className="block">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <div>
                <div className="font-medium text-sm">Foydalanuvchilar</div>
                <div className="text-xs text-muted-foreground">Boshqarish</div>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/payouts" className="block">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <DollarSign className="h-6 w-6 text-blue-500" />
              <div>
                <div className="font-medium text-sm">To&apos;lovlar</div>
                <div className="text-xs text-muted-foreground">Payouts</div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
