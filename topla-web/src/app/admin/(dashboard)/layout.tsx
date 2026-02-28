"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBag,
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  Wallet,
  FolderTree,
  Image,
  Ticket,
  Truck,
  Bell,
  BarChart3,
  LineChart,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Menu,
  FileCheck,
  MapPin,
} from "lucide-react";
import { useTheme } from "next-themes";
import { isAdminAuthenticated, removeAdminToken } from "@/lib/api/admin";


const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Foydalanuvchilar", href: "/admin/users" },
  { icon: Store, label: "Do'konlar", href: "/admin/shops" },
  { icon: Package, label: "Mahsulotlar", href: "/admin/products" },
  { icon: ShoppingCart, label: "Buyurtmalar", href: "/admin/orders" },
  { icon: Wallet, label: "To'lovlar", href: "/admin/payouts" },
  { icon: FolderTree, label: "Kategoriyalar", href: "/admin/categories" },
  { icon: Image, label: "Bannerlar", href: "/admin/banners" },
  { icon: Ticket, label: "Promo kodlar", href: "/admin/promo-codes" },
  { icon: Truck, label: "Yetkazib berish", href: "/admin/delivery-zones" },
  { icon: MapPin, label: "Topshirish punktlari", href: "/admin/pickup-points" },
  { icon: FileCheck, label: "Hujjatlar", href: "/admin/documents" },
  { icon: Bell, label: "Bildirishnomalar", href: "/admin/notifications" },
  { icon: LineChart, label: "Analitika", href: "/admin/analytics" },
  { icon: BarChart3, label: "Hisobotlar", href: "/admin/reports" },
  { icon: FileText, label: "Loglar", href: "/admin/logs" },
  { icon: Settings, label: "Sozlamalar", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/admin/login");
    }
  }, [router]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    removeAdminToken();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden touch-none"
          onClick={() => setMobileOpen(false)}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-card border-r transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!collapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">TOPLA Admin</span>
            </Link>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <ShoppingBag className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="absolute bottom-4 left-0 right-0 px-2 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold hidden sm:block">Admin Panel</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button variant="ghost" size="icon" className="relative" onClick={() => router.push('/admin/notifications')}>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      A
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  Admin
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Sozlamalar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-2 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
