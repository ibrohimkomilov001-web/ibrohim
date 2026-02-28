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
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { sidebarVariants } from "@/lib/animations";
import { useAuth } from "@/hooks/useAuth";
import { vendorApi } from "@/lib/api/vendor";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Menu,
  Bell,
  HelpCircle,
  Plus,
  Loader2,
  Star,
  X,
  MessageCircle,
  Tag,
} from "lucide-react";
import { useTheme } from "next-themes";
import { NotificationBell } from "./components/NotificationBell";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/vendor/dashboard" },
  { icon: Package, label: "Mahsulotlar", href: "/vendor/products" },
  { icon: ShoppingCart, label: "Buyurtmalar", href: "/vendor/orders" },
  { icon: MessageCircle, label: "Chat", href: "/vendor/chat" },
  { icon: Wallet, label: "Hisobim", href: "/vendor/balance" },
  { icon: BarChart3, label: "Statistika", href: "/vendor/analytics" },
  { icon: Star, label: "Sharhlar", href: "/vendor/reviews" },
  { icon: Tag, label: "Promo kodlar", href: "/vendor/promo-codes" },
  { icon: FileText, label: "Hujjatlar", href: "/vendor/documents" },
  { icon: Settings, label: "Sozlamalar", href: "/vendor/settings" },
  { icon: HelpCircle, label: "Yordam", href: "/vendor/help" },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch shop data
  const { data: shop } = useQuery({
    queryKey: ["vendor-shop"],
    queryFn: vendorApi.getShop,
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch stats for notifications badge
  const { data: stats } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: vendorApi.getStats,
    enabled: isAuthenticated,
    retry: 1,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/vendor/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const shopName = shop?.name || user?.shop?.name || "Do'konim";
  const pendingOrders = stats?.orders?.pending || 0;

  const handleLogout = () => {
    logout();
    router.push("/vendor/login");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

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
          {!collapsed ? (
            <Link href="/vendor/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">Sotuvchi Panel</span>
            </Link>
          ) : (
            <Link href="/vendor/dashboard" className="mx-auto">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100vh-10rem)]">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!collapsed && item.href === "/vendor/orders" && pendingOrders > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                    {pendingOrders}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="absolute bottom-4 left-0 right-0 px-2 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full rounded-xl"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-card/95 backdrop-blur border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">{shopName}</h1>
              <p className="text-xs text-muted-foreground">Sotuvchi kabineti</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={shop?.logoUrl || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(shopName || "V").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{shopName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/vendor/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Sozlamalar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/vendor/help" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Yordam
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
