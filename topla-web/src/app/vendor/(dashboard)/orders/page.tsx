"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { useTranslation } from '@/store/locale-store';
import { useUrlState } from '@/hooks/use-url-state';
import Link from "next/link";
import {
  Search,
  ClipboardList,
  Filter,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Package,
  Phone,
  MapPin,
  User,
  Calendar,
  Loader2,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Kutilmoqda", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  processing: { label: "Tayyorlanmoqda", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: Package },
  ready_for_pickup: { label: "Tayyor - kuryerga berish", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Package },
  courier_assigned: { label: "Kuryer tayinlandi", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", icon: Truck },
  courier_picked_up: { label: "Kuryer oldi", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", icon: Truck },
  shipping: { label: "Yetkazilmoqda", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Truck },
  delivered: { label: "Yetkazildi", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  cancelled: { label: "Bekor qilindi", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const nextStatus: Record<string, string> = {
  pending: "processing",
  processing: "ready_for_pickup",
};

const nextStatusLabel: Record<string, string> = {
  pending: "Tayyorlashni boshlash",
  processing: "Kuryerga tayyor",
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [{ search, status: statusFilter, page: pageStr }, setFilters] = useUrlState({ search: '', status: 'all', page: '1' });
  const debouncedSearch = useDebounce(search);
  const page = parseInt(pageStr) || 1;
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", { page, limit, search: debouncedSearch, status: statusFilter }],
    queryFn: () =>
      vendorApi.getOrders({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      vendorApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      toast.success(t('updated'));
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] });
      if (selectedOrder) {
        setSelectedOrder((prev: any) => prev ? { ...prev, status: nextStatus[prev.status] } : null);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('errorOccurred'));
    },
  });

  const orders = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('vendorOrders')}</h1>
        <p className="text-muted-foreground">Jami {data?.total || 0} ta buyurtma</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholderGeneric')}
                value={search}
                onChange={(e) => setFilters({ search: e.target.value, page: '1' })}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setFilters({ status: v, page: '1' })}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="processing">{t('processing')}</SelectItem>
                <SelectItem value="ready_for_pickup">Tayyor</SelectItem>
                <SelectItem value="courier_assigned">Kuryer tayinlangan</SelectItem>
                <SelectItem value="shipping">{t('shipped')}</SelectItem>
                <SelectItem value="delivered">{t('delivered')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const sc = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            return (
              <div key={order.id}>
                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <StatusIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold">
                            #{order.orderNumber || order.id?.slice(-6)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {order.user?.fullName || order.customerName || "Mijoz"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold">{formatPrice(order.totalAmount || order.total || 0)}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.items?.length || order.itemCount || 1} ta mahsulot
                        </div>
                      </div>
                    </div>

                    {/* Quick action for pending orders */}
                    {nextStatus[order.status] && (
                      <div className="mt-3 pt-3 border-t flex justify-end">
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({
                              orderId: order.id,
                              status: nextStatus[order.status],
                            });
                          }}
                          disabled={updateStatusMutation.isPending}
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : null}
                          {nextStatusLabel[order.status]}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">
              {search || statusFilter !== "all" ? t('noItems') : t('noData')}
            </h3>
            <p className="text-muted-foreground">
              {search || statusFilter !== "all"
                ? "Filtrlarni o'zgartiring"
                : "Yangi buyurtmalar tushganda bu yerda ko'rinadi"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setFilters({ page: String(page - 1) })}
            className="rounded-full"
          >
            {t('previous')}
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setFilters({ page: String(page + 1) })}
            className="rounded-full"
          >
            {t('next')}
          </Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Buyurtma #{selectedOrder.orderNumber || selectedOrder.id?.slice(-6)}
                </DialogTitle>
                <DialogDescription>
                  {formatDateTime(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('status')}:</span>
                  <span className={`text-sm px-3 py-1 rounded-full ${statusConfig[selectedOrder.status]?.color || ""}`}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>

                <Separator />

                {/* Customer Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Mijoz ma&apos;lumotlari</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {selectedOrder.user?.fullName || selectedOrder.customerName || "Noma'lum"}
                    </div>
                    {(selectedOrder.user?.phone || selectedOrder.customerPhone) && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {selectedOrder.user?.phone || selectedOrder.customerPhone}
                      </div>
                    )}
                    {(selectedOrder.address?.fullAddress || selectedOrder.deliveryAddress) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {selectedOrder.address?.fullAddress || selectedOrder.deliveryAddress}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">{t('products')}</h4>
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="flex-1 truncate">{item.name || item.productName}</span>
                      <span className="text-muted-foreground mx-2">x{item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.itemCount || 1} ta mahsulot
                    </p>
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between font-bold">
                  <span>Jami:</span>
                  <span className="text-primary">{formatPrice(selectedOrder.totalAmount || selectedOrder.total || 0)}</span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href={`/vendor/orders/${selectedOrder.id}`}>
                    {t('details')}
                  </Link>
                </Button>
                {selectedOrder.status === "pending" && (
                  <Button
                    variant="destructive"
                    className="rounded-full"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: "cancelled",
                      });
                      setSelectedOrder(null);
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('cancel')}
                  </Button>
                )}
                {nextStatus[selectedOrder.status] && (
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: nextStatus[selectedOrder.status],
                      });
                    }}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {nextStatusLabel[selectedOrder.status]}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
