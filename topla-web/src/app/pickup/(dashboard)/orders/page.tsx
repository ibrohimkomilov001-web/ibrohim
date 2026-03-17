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
  X,
  Printer,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPickupOrders, verifyPickupOrder } from "@/lib/api/pickup";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  pickupCode: string;
  total: number;
  items: OrderItem[];
  user?: { id: string; fullName: string; phone: string };
  deliveredAt?: string;
  pickedUpAt2?: string;
  createdAt?: string;
}

export default function PickupOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (dateFilter) params.date = dateFilter;
      const res = await getPickupOrders(params);
      setOrders(res || []);
    } catch (err: any) {
      setError(err.message || "Buyurtmalarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleVerify = async (order: Order) => {
    if (verifyingId) return;
    setVerifyingId(order.id);
    try {
      await verifyPickupOrder({ pickupCode: order.pickupCode });
      await loadOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      setError(err.message || "Tekshirishda xatolik");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "waiting" && o.status !== "at_pickup_point") return false;
    if (statusFilter === "delivered" && o.status !== "delivered") return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.orderNumber?.toString().includes(s) ||
      o.pickupCode?.includes(s) ||
      o.user?.fullName?.toLowerCase().includes(s) ||
      o.user?.phone?.includes(s)
    );
  });

  const waitingOrders = filteredOrders.filter((o) => o.status === "at_pickup_point");
  const deliveredOrders = filteredOrders.filter((o) => o.status === "delivered");

  const handlePrint = (order: Order) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head><title>Kvitansiya #${order.orderNumber}</title>
      <style>
        body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; font-size: 13px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .flex { display: flex; justify-content: space-between; }
      </style>
      </head>
      <body>
        <div class="center"><h2 style="margin:0">TOPLA</h2><p>Topshirish kvitansiyasi</p></div>
        <div class="line"></div>
        <div class="flex"><span>Buyurtma:</span><span class="bold">#${order.orderNumber}</span></div>
        <div class="flex"><span>Kod:</span><span class="bold">${order.pickupCode}</span></div>
        <div class="flex"><span>Mijoz:</span><span>${order.user?.fullName || "-"}</span></div>
        <div class="flex"><span>Telefon:</span><span>${order.user?.phone || "-"}</span></div>
        <div class="line"></div>
        <p class="bold">Mahsulotlar:</p>
        ${order.items?.map((i) => `<div class="flex"><span>${i.name} x${i.quantity}</span><span>${Number((i.price || 0) * (i.quantity || 1)).toLocaleString()}</span></div>`).join("") || "-"}
        <div class="line"></div>
        <div class="flex bold"><span>Jami:</span><span>${Number(order.total || 0).toLocaleString()} so'm</span></div>
        <div class="line"></div>
        <div class="center" style="margin-top:12px"><p>${new Date().toLocaleString("uz-UZ")}</p></div>
        <script>window.onload=()=>{window.print();}<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Buyurtmalar</h1>
          <p className="text-sm text-muted-foreground">
            {waitingOrders.length} ta kutmoqda · {deliveredOrders.length} ta topshirilgan
          </p>
        </div>
        <Button variant="outline" onClick={loadOrders} disabled={isLoading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Yangilash
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buyurtma raqami, kod yoki ism..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 w-44"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            {[
              { value: "all", label: "Barchasi" },
              { value: "waiting", label: "Kutmoqda" },
              { value: "delivered", label: "Topshirilgan" },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  statusFilter === btn.value
                    ? "bg-orange-500 text-white"
                    : "bg-card hover:bg-muted text-foreground"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {isLoading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {/* Waiting Orders */}
          {(statusFilter === "all" || statusFilter === "waiting") && waitingOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Kutmoqda ({waitingOrders.length})
              </h2>
              {waitingOrders.map((order) => (
                <Card key={order.id} className="border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedOrder(order)}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">#{order.orderNumber}</span>
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-700">Kutmoqda</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {order.user?.fullName || "Noma'lum"}
                          </span>
                          {order.user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {order.user.phone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Kod: <span className="font-mono font-bold text-sm text-foreground">{order.pickupCode}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items?.length || 0} ta mahsulot · {Number(order.total || 0).toLocaleString()} so&apos;m
                        </div>
                      </div>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleVerify(order); }}
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
          {(statusFilter === "all" || statusFilter === "delivered") && deliveredOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Topshirilgan ({deliveredOrders.length})
              </h2>
              {deliveredOrders.map((order) => (
                <Card key={order.id} className="border-green-100 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedOrder(order)}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">#{order.orderNumber}</span>
                          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700">Topshirildi</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {order.user?.fullName || "Noma'lum"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items?.length || 0} ta mahsulot · {Number(order.total || 0).toLocaleString()} so&apos;m
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {order.deliveredAt && new Date(order.deliveredAt).toLocaleString("uz-UZ")}
                        </div>
                        <Button variant="ghost" size="sm" className="mt-1" onClick={(e) => { e.stopPropagation(); handlePrint(order); }}>
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          Chop
                        </Button>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-card rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="font-bold text-lg">Buyurtma #{selectedOrder.orderNumber}</h3>
                <Badge variant="outline" className={selectedOrder.status === "at_pickup_point" ? "text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-700" : "text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700"}>
                  {selectedOrder.status === "at_pickup_point" ? "Kutmoqda" : "Topshirildi"}
                </Badge>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Customer */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mijoz</h4>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedOrder.user?.fullName || "Noma'lum"}</p>
                    {selectedOrder.user?.phone && (
                      <a href={`tel:${selectedOrder.user.phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />{selectedOrder.user.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Pickup Code */}
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 rounded-xl p-4 text-center">
                <p className="text-xs text-orange-600 mb-1">Topshirish kodi</p>
                <p className="font-mono text-3xl font-bold tracking-widest text-orange-700 dark:text-orange-300">{selectedOrder.pickupCode}</p>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mahsulotlar ({selectedOrder.items?.length || 0})</h4>
                <div className="divide-y rounded-lg border">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} x {Number(item.price || 0).toLocaleString()} so&apos;m</p>
                      </div>
                      <span className="font-semibold text-sm">{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  )) || <div className="px-4 py-3 text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</div>}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                <span className="font-semibold">Jami:</span>
                <span className="text-xl font-bold">{Number(selectedOrder.total || 0).toLocaleString()} so&apos;m</span>
              </div>

              {/* Dates */}
              <div className="text-xs text-muted-foreground space-y-1">
                {selectedOrder.createdAt && <p>Yaratilgan: {new Date(selectedOrder.createdAt).toLocaleString("uz-UZ")}</p>}
                {selectedOrder.deliveredAt && <p>Topshirilgan: {new Date(selectedOrder.deliveredAt).toLocaleString("uz-UZ")}</p>}
              </div>
            </div>

            <div className="sticky bottom-0 bg-card border-t px-6 py-4 flex gap-3 rounded-b-2xl">
              {selectedOrder.status === "at_pickup_point" && (
                <Button onClick={() => handleVerify(selectedOrder)} disabled={verifyingId === selectedOrder.id} className="flex-1 bg-green-600 hover:bg-green-700">
                  {verifyingId === selectedOrder.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Topshirish
                </Button>
              )}
              <Button variant="outline" onClick={() => handlePrint(selectedOrder)}>
                <Printer className="h-4 w-4 mr-2" />Chop etish
              </Button>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Yopish</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
