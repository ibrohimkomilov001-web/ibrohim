"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi, type Notification } from "@/lib/api/vendor";
import { useTranslation } from "@/store/locale-store";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  Loader2,
  ShoppingCart,
  Package,
  AlertTriangle,
  MessageCircle,
  Info,
} from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Hozirgina";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} kun oldin`;
  return new Date(dateStr).toLocaleDateString("uz-UZ");
}

function getNotifIcon(type: string) {
  switch (type) {
    case "order":
      return ShoppingCart;
    case "product":
      return Package;
    case "warning":
    case "penalty":
      return AlertTriangle;
    case "chat":
    case "message":
      return MessageCircle;
    default:
      return Info;
  }
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-notifications-page", page],
    queryFn: () => vendorApi.getNotifications({ page, limit: 20 }),
  });

  const markReadMutation = useMutation({
    mutationFn: vendorApi.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-notifications-page"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: vendorApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-notifications-page"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-unread-count"] });
    },
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {t("vendorNotifications")}
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} ta o&apos;qilmagan bildirishnoma
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Barchasini o&apos;qish
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">
                Bildirishnomalar yo&apos;q
              </p>
              <p className="text-sm mt-1">
                Yangi bildirishnomalar bu yerda ko&apos;rinadi
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const NotifIcon = getNotifIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex gap-3 p-4 transition-colors cursor-pointer hover:bg-muted/50",
                      !notif.isRead && "bg-primary/5"
                    )}
                    onClick={() => {
                      if (!notif.isRead) {
                        markReadMutation.mutate(notif.id);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                        !notif.isRead
                          ? "bg-primary/10"
                          : "bg-muted"
                      )}
                    >
                      <NotifIcon
                        className={cn(
                          "h-5 w-5",
                          !notif.isRead
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            !notif.isRead && "font-semibold"
                          )}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <div className="h-2.5 w-2.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                      {notif.body && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Oldingi
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Keyingi
          </Button>
        </div>
      )}
    </div>
  );
}
