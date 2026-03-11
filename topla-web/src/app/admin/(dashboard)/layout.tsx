"use client";

import { useState, useEffect, useCallback } from "react";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
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
  Star,
  Languages,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import { isAdminAuthenticated, removeAdminToken, hasPermission, fetchAdminMe, setAdminPermissions } from "@/lib/api/admin";
import { useTranslation } from "@/store/locale-store";
import { useLocaleStore } from "@/store/locale-store";

const languages = [
  { code: 'uz' as const, label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
];

// Map sidebar items to required permissions
// Items without a 'permission' field are visible to all admins
const sidebarItems = [
  { icon: LayoutDashboard, key: 'dashboard', href: "/admin/dashboard" },
  { icon: Users, key: 'users', href: "/admin/users", permission: 'users.manage' },
  { icon: Store, key: 'shops', href: "/admin/shops", permission: 'shops.manage' },
  { icon: Package, key: 'products', href: "/admin/products", permission: 'products.manage' },
  { icon: ShoppingCart, key: 'orders', href: "/admin/orders", permission: 'orders.manage' },
  { icon: Wallet, key: 'payments', href: "/admin/payouts", permission: 'payouts.manage' },
  { icon: FolderTree, key: 'categories', href: "/admin/categories", permission: 'categories.manage' },
  { icon: Image, key: 'banners', href: "/admin/banners", permission: 'banners.manage' },
  { icon: Ticket, key: 'promoCodes', href: "/admin/promo-codes", permission: 'promotions.manage' },
  { icon: Dices, key: 'luckyWheel', href: "/admin/lucky-wheel", permission: 'promotions.manage' },
  { icon: UserPlus, key: 'referrals', href: "/admin/referrals", permission: 'users.manage' },
  { icon: Truck, key: 'deliveryZones', href: "/admin/delivery-zones", permission: 'settings.manage' },
  { icon: MapPin, key: 'pickupPoints', href: "/admin/pickup-points", permission: 'settings.manage' },
  { icon: ClipboardList, key: 'pickupApplications', href: "/admin/pickup-applications", permission: 'settings.manage' },
  { icon: FileCheck, key: 'documents', href: "/admin/documents", permission: 'shops.manage' },
  { icon: MessageCircle, key: 'chat', href: "/admin/chat" },
  { icon: Bell, key: 'notifications', href: "/admin/notifications" },
  { icon: LineChart, key: 'analytics', href: "/admin/analytics", permission: 'analytics.view' },
  { icon: BarChart3, key: 'reports', href: "/admin/reports", permission: 'analytics.view' },
  { icon: FileText, key: 'logs', href: "/admin/logs", permission: 'logs.view' },
  { icon: Percent, key: 'commissions', href: "/admin/commissions", permission: 'settings.manage' },
  { icon: Megaphone, key: 'promotions', href: "/admin/promotions", permission: 'promotions.manage' },
  { icon: AlertTriangle, key: 'penalties', href: "/admin/penalties", permission: 'penalties.manage' },
  { icon: ShieldCheck, key: 'moderation', href: "/admin/moderation", permission: 'moderation.manage' },
  { icon: Star, key: 'reviews', href: "/admin/reviews", permission: 'moderation.manage' },
  { icon: Shield, key: 'roles', href: "/admin/roles", permission: 'roles.manage' },
  { icon: TrendingUp, key: 'extendedAnalytics', href: "/admin/extended-analytics", permission: 'analytics.view' },
  { icon: Trophy, key: 'loyalty', href: "/admin/loyalty", permission: 'promotions.manage' },
  { icon: CreditCard, key: 'paymentSettings', href: "/admin/payment-settings", permission: 'settings.manage' },
  { icon: Key, key: 'apiKeys', href: "/admin/api-keys", permission: 'settings.manage' },
  { icon: HelpCircle, key: 'faq', href: "/admin/faq" },
  { icon: Settings, key: 'settings', href: "/admin/settings", permission: 'settings.manage' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [, setForceUpdate] = useState(0);

  const isDark = resolvedTheme === "dark";

  // Auth guard + load permissions
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/admin/login");
      return;
    }

    fetchAdminMe()
      .then(({ adminRole }) => {
        setAdminPermissions(adminRole);
        setPermissionsLoaded(true);
        setForceUpdate((n) => n + 1);
      })
      .catch(() => {
        setPermissionsLoaded(true);
      });
  }, [router]);

  // Filter sidebar items based on permissions
  const visibleSidebarItems = sidebarItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  // Track scroll for glass header effect
  useEffect(() => {
    const main = document.getElementById("admin-scroll-area");
    if (!main) return;
    const onScroll = () => setScrolled(main.scrollTop > 8);
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

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
      {/* Mobile Overlay — full screen, blocks all touch on right side */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          style={{ touchAction: "none", overscrollBehavior: "none" }}
          onClick={() => setMobileOpen(false)}
          onTouchStart={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r transition-transform duration-300 overscroll-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-16 items-center justify-end px-4 border-b lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1 overflow-y-auto overscroll-contain h-[calc(100vh-4rem)] lg:h-full">
          {visibleSidebarItems.map((item) => {
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
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* Main Content */}
      <div className="transition-all duration-300 lg:pl-64 h-screen flex flex-col">
        {/* Sticky Glass Header */}
        <header
          className={cn(
            "sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 transition-all duration-200 border-b",
            scrolled
              ? "bg-card/75 backdrop-blur-xl backdrop-saturate-150 border-border/50 shadow-sm"
              : "bg-card border-border"
          )}
        >
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
            {/* Profile Menu — contains dark mode, language, settings, logout */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('admin')}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Apple-style Dark Mode Toggle */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setTheme(isDark ? "light" : "dark");
                  }}
                  className="cursor-pointer justify-between"
                >
                  <span className="flex items-center gap-2">
                    {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    {isDark ? t('darkMode') : t('lightMode')}
                  </span>
                  {/* Apple-style toggle switch */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme(isDark ? "light" : "dark");
                    }}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out",
                      isDark ? "bg-primary" : "bg-muted-foreground/25"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5",
                        isDark ? "translate-x-[22px]" : "translate-x-[2px]"
                      )}
                    />
                  </button>
                </DropdownMenuItem>

                {/* Language Selector */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages className="mr-2 h-4 w-4" />
                    {languages.find(l => l.code === locale)?.flag}{" "}
                    {languages.find(l => l.code === locale)?.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {languages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLocale(lang.code)}
                        className="cursor-pointer"
                      >
                        <span className="mr-2">{lang.flag}</span>
                        {lang.label}
                        {locale === lang.code && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('exit')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content — scrollable area */}
        <main id="admin-scroll-area" className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
