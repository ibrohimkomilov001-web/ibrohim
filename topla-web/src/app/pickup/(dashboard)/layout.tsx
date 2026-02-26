"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isPickupAuthenticated, removePickupToken, getPickupPointName } from "@/lib/api/pickup";
import { Package, ScanBarcode, List, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PickupDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pointName, setPointName] = useState("");

  useEffect(() => {
    if (!isPickupAuthenticated()) {
      router.replace("/pickup/login");
      return;
    }
    setPointName(getPickupPointName());
  }, [router]);

  const handleLogout = () => {
    removePickupToken();
    router.replace("/pickup/login");
  };

  const navItems = [
    { label: "Skaner", href: "/pickup/scanner", icon: ScanBarcode },
    { label: "Buyurtmalar", href: "/pickup/orders", icon: List },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sm">{pointName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    className={active ? "bg-orange-500 hover:bg-orange-600" : ""}
                  >
                    <item.icon className="h-4 w-4 mr-1.5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 ml-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
