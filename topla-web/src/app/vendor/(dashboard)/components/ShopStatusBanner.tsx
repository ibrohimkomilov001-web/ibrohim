"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/store/locale-store";
import { Clock, ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ShopStatusBannerProps {
  shopStatus: string | undefined;
}

export function ShopStatusBanner({ shopStatus }: ShopStatusBannerProps) {
  const { t } = useTranslation();

  if (!shopStatus || shopStatus === "active") return null;

  if (shopStatus === "pending") {
    return (
      <Alert className="mb-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
        <Clock className="h-5 w-5 text-amber-500" />
        <div className="ml-2">
          <h4 className="font-semibold text-amber-800 dark:text-amber-300">
            {t("shopPendingTitle")}
          </h4>
          <AlertDescription className="text-amber-700 dark:text-amber-400 mt-1">
            {t("shopPendingDesc")}
          </AlertDescription>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
            {t("shopPendingNote")}
          </p>
        </div>
      </Alert>
    );
  }

  if (shopStatus === "blocked") {
    return (
      <Alert className="mb-4 border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30">
        <ShieldAlert className="h-5 w-5 text-red-500" />
        <div className="ml-2">
          <h4 className="font-semibold text-red-800 dark:text-red-300">
            {t("shopBlockedTitle")}
          </h4>
          <AlertDescription className="text-red-700 dark:text-red-400 mt-1">
            {t("shopBlockedDesc")}
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  if (shopStatus === "inactive") {
    return (
      <Alert className="mb-4 border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-950/30">
        <AlertTriangle className="h-5 w-5 text-gray-500" />
        <div className="ml-2">
          <h4 className="font-semibold text-gray-800 dark:text-gray-300">
            {t("shopInactiveTitle")}
          </h4>
          <AlertDescription className="text-gray-700 dark:text-gray-400 mt-1">
            {t("shopInactiveDesc")}{" "}
            <Link href="/vendor/settings" className="underline font-medium">
              {t("vendorSettings")}
            </Link>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return null;
}
