"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  RefreshCcw,
  Loader2,
  Search,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPickupOrders, verifyPickupOrder } from "@/lib/api/pickup";

export default function PickupOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getPickupOrders();
      setOrders(res.orders || []);
    } catch (err: any) {
      setError(err.message || "Buyurtmalarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleVerify = async (order: any) => {
    if (verifyingId) return;
    setVerifyingId(order.id);
    try {
      await verifyPickupOrder({ pickupCode: order.pickupCode });
      // Reload orders
      await loadOrders();
    } catch (err: any) {
      setError(err.message || "Tekshirishda xatolik");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.orderNumber?.toString().includes(s) ||
      o.pickupCode?.includes(s) ||
      o.customer?.firstName?.toLowerCase().includes(s) ||
      o.customer?.lastName?.toLowerCase().includes(s) ||
      o.customer?.phone?.includes(s)
    );
  });

  const waitingOrders = filteredOrders.filter((o) => o.status === "at_pickup_point");
  const deliveredOrders = filteredOrders.filter((o) => o.status === "delivered");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Buyurtmalar</h1>
          <p className="text-sm text-muted-foreground">
            {waitingOrders.length} ta kutmoqda
          </p>
        </div>
        <Button variant="outline" onClick={loadOrders} disabled={isLoading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Yangilash
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buyurtma raqami, kod yoki ism bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isLoading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {/* Waiting Orders */}
          {waitingOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Kutmoqda ({waitingOrders.length})
              </h2>
              {waitingOrders.map((order) => (
                <Card key={order.id} className="border-orange-200">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">#{order.orderNumber}</span>
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                            Kutmoqda
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {order.customer?.firstName || "Noma'lum"} {order.customer?.lastName || ""}
                          </span>
                          {order.customer?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {order.customer.phone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Kod: <span className="font-mono font-bold text-sm text-foreground">{order.pickupCode}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items?.length || 0} ta mahsulot · {Number(order.totalAmount || 0).toLocaleString()} so&apos;m
                        </div>
                      </div>
                      <Button
                        onClick={() => handleVerify(order)}
                        disabled={verifyingId === order.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {verifyingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            Topshirish
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Delivered Orders */}
          {deliveredOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Topshirilgan ({deliveredOrders.length})
              </h2>
              {deliveredOrders.map((order) => (
                <Card key={order.id} className="border-green-100 bg-green-50/30">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">#{order.orderNumber}</span>
                          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                            Topshirildi
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {order.customer?.firstName || "Noma'lum"} {order.customer?.lastName || ""}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items?.length || 0} ta mahsulot · {Number(order.totalAmount || 0).toLocaleString()} so&apos;m
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.pickedUpAt2 && new Date(order.pickedUpAt2).toLocaleString("uz-UZ")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Hozircha buyurtmalar yo&apos;q</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
