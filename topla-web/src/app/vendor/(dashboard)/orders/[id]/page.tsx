'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { vendorApi } from '@/lib/api/vendor';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, User, MapPin, Phone, Package, Truck,
  CheckCircle, XCircle, Clock, Loader2,
} from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Kutilmoqda', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: <Clock className="w-4 h-4" /> },
  processing: { label: 'Tayyorlanmoqda', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: <Package className="w-4 h-4" /> },
  ready_for_pickup: { label: 'Tayyor - kuryerga berish', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300', icon: <Package className="w-4 h-4" /> },
  courier_assigned: { label: 'Kuryer tayinlandi', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300', icon: <Truck className="w-4 h-4" /> },
  courier_picked_up: { label: 'Kuryer oldi', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300', icon: <Truck className="w-4 h-4" /> },
  shipping: { label: 'Yetkazilmoqda', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Yetkazildi', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Bekor qilingan', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: <XCircle className="w-4 h-4" /> },
};

const nextStatus: Record<string, string> = {
  pending: 'processing',
  processing: 'ready_for_pickup',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['vendor-order', id],
    queryFn: () => vendorApi.getOrder(id),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => vendorApi.updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Buyurtma holati yangilandi');
      queryClient.invalidateQueries({ queryKey: ['vendor-order', id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">📦</p>
        <p className="font-medium">Buyurtma topilmadi</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Ortga</Button>
      </div>
    );
  }

  const status = statusLabels[order.status] || statusLabels.pending;
  const canAdvance = nextStatus[order.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Buyurtma #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
        <Badge className={status.color}>
          {status.icon}
          <span className="ml-1">{status.label}</span>
        </Badge>
      </div>

      {/* Status timeline */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Holat tarixi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.statusHistory.map((item: { status: string; createdAt: string; note?: string }, i: number) => {
                const s = statusLabels[item.status] || statusLabels.pending;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.color}`}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                      {item.note && <p className="text-xs mt-1">{item.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer info */}
      {order.user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" /> Mijoz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{order.user.firstName} {order.user.lastName || ''}</p>
            {order.user.phone && (
              <a href={`tel:${order.user.phone}`} className="flex items-center gap-2 text-primary">
                <Phone className="w-4 h-4" /> {order.user.phone}
              </a>
            )}
            {order.address && (
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> {order.address.fullAddress}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mahsulotlar ({order.items?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items?.map((item: { id: string; name: string; price: number; quantity: number; product?: { images?: string[] } }) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0 relative">
                {item.product?.images?.[0] ? (
                  <Image src={item.product.images[0]} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">To&apos;lov</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mahsulotlar</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Yetkazish</span>
            <span>{formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Jami</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>To&apos;lov usuli</span>
            <span>{order.paymentMethod === 'cash' ? 'Naqd' : order.paymentMethod}</span>
          </div>
          {order.note && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Izoh: {order.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {canAdvance && (
        <div className="flex gap-3">
          {order.status === 'pending' && (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => statusMutation.mutate('cancelled')}
              disabled={statusMutation.isPending}
            >
              Bekor qilish
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => statusMutation.mutate(canAdvance)}
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {statusLabels[canAdvance]?.label || 'Keyingi bosqich'}
          </Button>
        </div>
      )}
    </div>
  );
}
