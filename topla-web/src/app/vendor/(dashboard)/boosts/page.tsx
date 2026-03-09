"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { toast } from "sonner";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  Rocket, Plus, Pause, Play, Trash2, Loader2, Eye, MousePointer, ShoppingCart,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; variant: string; icon: any }> = {
  pending: { label: "Kutilmoqda", variant: "outline", icon: Loader2 },
  active: { label: "Faol", variant: "default", icon: Rocket },
  paused: { label: "To'xtatilgan", variant: "secondary", icon: Pause },
  completed: { label: "Tugagan", variant: "secondary", icon: null },
  cancelled: { label: "Bekor", variant: "destructive", icon: null },
};

export default function BoostsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    productId: "", dailyBudget: 10000, totalBudget: 50000,
    startDate: "", endDate: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-boosts", statusFilter, page],
    queryFn: () => vendorApi.getBoosts({
      page, status: statusFilter !== "all" ? statusFilter : undefined,
    }),
  });

  const { data: productsData } = useQuery({
    queryKey: ["vendor-products-list"],
    queryFn: () => vendorApi.getProducts({ page: 1, limit: 100 }),
  });

  const createMut = useMutation({
    mutationFn: vendorApi.createBoost,
    onSuccess: () => {
      toast.success("Reklama yaratildi");
      queryClient.invalidateQueries({ queryKey: ["vendor-boosts"] });
      setCreateOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pauseMut = useMutation({
    mutationFn: vendorApi.pauseBoost,
    onSuccess: () => {
      toast.success("Reklama to'xtatildi");
      queryClient.invalidateQueries({ queryKey: ["vendor-boosts"] });
    },
  });

  const resumeMut = useMutation({
    mutationFn: vendorApi.resumeBoost,
    onSuccess: () => {
      toast.success("Reklama davom ettirildi");
      queryClient.invalidateQueries({ queryKey: ["vendor-boosts"] });
    },
  });

  const cancelMut = useMutation({
    mutationFn: vendorApi.cancelBoost,
    onSuccess: () => {
      toast.success("Reklama bekor qilindi");
      queryClient.invalidateQueries({ queryKey: ["vendor-boosts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const boosts = data?.boosts || [];
  const meta = data?.meta;
  const products = (productsData as any)?.products || [];

  const handleCreate = () => {
    if (!form.productId || !form.startDate || !form.endDate) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    createMut.mutate({
      ...form,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6" /> Mahsulot reklama
          </h1>
          <p className="text-muted-foreground">
            Mahsulotlaringizni TOP ga chiqaring
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Yangi reklama
        </Button>
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Holat" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barchasi</SelectItem>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <SelectItem key={key} value={key}>{val.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Boosts List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : boosts.length > 0 ? (
        <div className="space-y-4">
          {boosts.map((boost: any) => {
            const cfg = STATUS_CONFIG[boost.status] || STATUS_CONFIG.pending;
            const spent = Number(boost.spentAmount || 0);
            const total = Number(boost.totalBudget || 1);
            const progress = Math.min((spent / total) * 100, 100);

            return (
              <Card key={boost.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    {boost.product?.images?.[0] ? (
                      <img
                        src={boost.product.images[0]}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-muted rounded-lg shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {boost.product?.name || "Mahsulot"}
                        </h3>
                        <Badge variant={cfg.variant as any}>{cfg.label}</Badge>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {boost.impressions || 0} ko&apos;rish
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" /> {boost.clicks || 0} bosish
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" /> {boost.orders || 0} buyurtma
                        </span>
                      </div>

                      {/* Budget Progress */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium shrink-0">
                          {formatPrice(spent)} / {formatPrice(total)} so&apos;m
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(boost.startDate)} — {formatDate(boost.endDate)}
                        {" • "}Kunlik: {formatPrice(Number(boost.dailyBudget))} so&apos;m
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {boost.status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => pauseMut.mutate(boost.id)}>
                            <Pause className="h-3 w-3 mr-1" /> To&apos;xtatish
                          </Button>
                        )}
                        {boost.status === "paused" && (
                          <Button size="sm" variant="outline" onClick={() => resumeMut.mutate(boost.id)}>
                            <Play className="h-3 w-3 mr-1" /> Davom
                          </Button>
                        )}
                        {["pending", "paused"].includes(boost.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => cancelMut.mutate(boost.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Bekor
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Rocket className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold">Reklama yo&apos;q</h3>
            <p className="text-muted-foreground mb-4">
              Mahsulotlaringizni TOP ga chiqarish uchun reklama yarating
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Yangi reklama
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi reklama yaratish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mahsulot</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger><SelectValue placeholder="Mahsulot tanlang" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kunlik byudjet (so&apos;m)</Label>
                <Input
                  type="number"
                  value={form.dailyBudget}
                  onChange={(e) => setForm({ ...form, dailyBudget: Number(e.target.value) })}
                  min={5000}
                />
              </div>
              <div>
                <Label>Umumiy byudjet (so&apos;m)</Label>
                <Input
                  type="number"
                  value={form.totalBudget}
                  onChange={(e) => setForm({ ...form, totalBudget: Number(e.target.value) })}
                  min={10000}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Boshlanishi</Label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Tugashi</Label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-sm">
                <p className="font-medium">Byudjet balansingizdan yechiladi</p>
                <p className="text-muted-foreground">Bekor qilsangiz qolgan summa qaytariladi</p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending || !form.productId}>
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
