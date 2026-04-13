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
import { resolveImageUrl } from "@/lib/api/upload";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ClipboardList,
  Wallet,
  LineChart,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  HelpCircle,
  Loader2,
  Star,
  X,
  MessageCircle,
  Tag,
  Rocket,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Gauge,
  Code2,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { NotificationBell } from "./components/NotificationBell";
import { ShopStatusBanner } from "./components/ShopStatusBanner";
import { useTranslation } from "@/store/locale-store";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

type SidebarItem = { icon: any; key: string; href: string } | 'separator';

const sidebarItems: SidebarItem[] = [
  // Asosiy
  { icon: LineChart, key: 'vendorStatistika', href: "/vendor/statistika" },
  { icon: ClipboardList, key: 'vendorOrders', href: "/vendor/orders" },
  { icon: Package, key: 'vendorProducts', href: "/vendor/products" },
  'separator',
  // Savdo
  { icon: Wallet, key: 'vendorPayouts', href: "/vendor/balance" },
  { icon: DollarSign, key: 'vendorFinance', href: "/vendor/finance" },
  { icon: Tag, key: 'vendorPromoCodes', href: "/vendor/promo-codes" },
  { icon: TrendingUp, key: 'aiPricing', href: "/vendor/ai-pricing" },
  { icon: Rocket, key: 'vendorBoosts', href: "/vendor/boosts" },
  'separator',
  // Boshqaruv
  { icon: Star, key: 'vendorReviews', href: "/vendor/reviews" },
  { icon: AlertTriangle, key: 'vendorPenalties', href: "/vendor/penalties" },
  { icon: FileText, key: 'vendorDocuments', href: "/vendor/documents" },
  { icon: Gauge, key: 'vendorPerformance', href: "/vendor/performance" },
  'separator',
  // Aloqa
  { icon: MessageCircle, key: 'vendorChat', href: "/vendor/chat" },
  'separator',
  // Tizim
  { icon: Code2, key: 'vendorApiKeys', href: "/vendor/api-keys" },
  { icon: Settings, key: 'vendorSettings', href: "/vendor/settings" },
  { icon: HelpCircle, key: 'help', href: "/vendor/help" },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
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

  // Fetch stats for orders badge
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

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
        {/* Shop Logo & Name */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!collapsed ? (
            <Link href="/vendor/statistika" className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={resolveImageUrl(shop?.logoUrl || '')} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {(shopName || 'D').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-bold truncate">{shopName}</span>
            </Link>
          ) : (
            <Link href="/vendor/statistika" className="mx-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src={resolveImageUrl(shop?.logoUrl || '')} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {(shopName || 'D').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setMobileOpen(false)}
            aria-label="Menyuni yopish"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-0.5 overflow-y-auto h-[calc(100vh-10rem)]">
          {sidebarItems.map((item, idx) => {
            if (item === 'separator') {
              return <div key={`sep-${idx}`} className="my-2 mx-3 border-t border-border/50" />;
            }
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                  <span className="flex-1">{t(item.key)}</span>
                )}
                {!collapsed && item.href === "/vendor/orders" && pendingOrders > 0 && (
                  <Badge
                    variant="destructive"
                    className={cn("h-5 min-w-5 px-1.5 text-xs", isActive && "bg-white text-red-600")}
                  >
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
              aria-label="Menyuni ochish"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">{shopName}</h1>
              <p className="text-xs text-muted-foreground">{t('vendorCabinet')}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex h-9 w-9 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Mavzuni almashtirish"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <NotificationBell />

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="Profil menyusi">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={resolveImageUrl(shop?.logoUrl || "")} />
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
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/vendor/help" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    {t('help')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('exit')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <ShopStatusBanner shopStatus={shop?.status || user?.shop?.status} />
          {children}
        </main>
      </div>
    </div>
  );
}
