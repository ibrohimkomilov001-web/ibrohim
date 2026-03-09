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
  ClipboardList,
  Dices,
  UserPlus,
  MessageCircle,
  Percent,
  Megaphone,
  AlertTriangle,
  ShieldCheck,
  Shield,
  TrendingUp,
  Trophy,
  CreditCard,
  Key,
  HelpCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { isAdminAuthenticated, removeAdminToken } from "@/lib/api/admin";
import { useTranslation } from "@/store/locale-store";
import { LanguageSwitcher } from "@/components/ui/language-switcher";


const sidebarItems = [
  { icon: LayoutDashboard, key: 'dashboard', href: "/admin/dashboard" },
  { icon: Users, key: 'users', href: "/admin/users" },
  { icon: Store, key: 'shops', href: "/admin/shops" },
  { icon: Package, key: 'products', href: "/admin/products" },
  { icon: ShoppingCart, key: 'orders', href: "/admin/orders" },
  { icon: Wallet, key: 'payments', href: "/admin/payouts" },
  { icon: FolderTree, key: 'categories', href: "/admin/categories" },
  { icon: Image, key: 'banners', href: "/admin/banners" },
  { icon: Ticket, key: 'promoCodes', href: "/admin/promo-codes" },
  { icon: Dices, key: 'luckyWheel', href: "/admin/lucky-wheel" },
  { icon: UserPlus, key: 'referrals', href: "/admin/referrals" },
  { icon: Truck, key: 'deliveryZones', href: "/admin/delivery-zones" },
  { icon: MapPin, key: 'pickupPoints', href: "/admin/pickup-points" },
  { icon: ClipboardList, key: 'pickupApplications', href: "/admin/pickup-applications" },
  { icon: FileCheck, key: 'documents', href: "/admin/documents" },
  { icon: MessageCircle, key: 'chat', href: "/admin/chat" },
  { icon: Bell, key: 'notifications', href: "/admin/notifications" },
  { icon: LineChart, key: 'analytics', href: "/admin/analytics" },
  { icon: BarChart3, key: 'reports', href: "/admin/reports" },
  { icon: FileText, key: 'logs', href: "/admin/logs" },
  { icon: Percent, key: 'commissions', href: "/admin/commissions" },
  { icon: Megaphone, key: 'promotions', href: "/admin/promotions" },
  { icon: AlertTriangle, key: 'penalties', href: "/admin/penalties" },
  { icon: ShieldCheck, key: 'moderation', href: "/admin/moderation" },
  { icon: Shield, key: 'roles', href: "/admin/roles" },
  { icon: TrendingUp, key: 'extendedAnalytics', href: "/admin/extended-analytics" },
  { icon: Trophy, key: 'loyalty', href: "/admin/loyalty" },
  { icon: CreditCard, key: 'paymentSettings', href: "/admin/payment-settings" },
  { icon: Key, key: 'apiKeys', href: "/admin/api-keys" },
  { icon: HelpCircle, key: 'faq', href: "/admin/faq" },
  { icon: Settings, key: 'settings', href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
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
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
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
                {!collapsed && <span>{t(item.key)}</span>}
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
            <h1 className="text-lg font-semibold hidden sm:block">{t('adminPanel')}</h1>
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

            <LanguageSwitcher />

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
                  {t('admin')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('exit')}
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
