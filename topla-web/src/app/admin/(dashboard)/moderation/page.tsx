"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchModerationQueue, approveProduct, rejectProduct } from "@/lib/api/admin";
import { toast } from "sonner";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  Shield, Search, Check, X, Eye, Loader2, Image as ImageIcon, ShoppingBag,
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  on_review: { label: "Tekshiruvda", color: "outline" },
  active: { label: "Faol", color: "default" },
  has_errors: { label: "Xatoliklar", color: "destructive" },
  blocked: { label: "Bloklangan", color: "destructive" },
  draft: { label: "Qoralama", color: "secondary" },
};

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("on_review");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["moderation-queue", statusFilter, search, page],
    queryFn: () => fetchModerationQueue({ status: statusFilter, search: search || undefined, page }),
  });

  const approveMut = useMutation({
    mutationFn: approveProduct,
    onSuccess: () => {
      toast.success("Mahsulot tasdiqlandi");
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectProduct(id, reason),
    onSuccess: () => {
      toast.success("Mahsulot rad etildi");
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      setRejectOpen(false);
      setRejectReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const products = data?.products || [];
  const meta = data?.meta;
  const statusCounts = data?.statusCounts || {};
  const pendingCount = data?.pendingCount || 0;

  const openReject = (id: string) => {
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Moderatsiya navbati
          </h1>
          <p className="text-muted-foreground">Mahsulotlarni tekshirish va tasdiqlash</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-1">
            {pendingCount} ta kutmoqda
          </Badge>
        )}
      </div>

      {/* Status Counters */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([key, val]) => (
          <Button
            key={key}
            variant={statusFilter === key ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter(key); setPage(1); }}
            className="gap-2"
          >
            {val.label}
            {statusCounts[key] !== undefined && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {statusCounts[key]}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Mahsulot yoki do'kon nomi..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-48 w-full mb-3 rounded-lg" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <Badge
                  variant={STATUS_LABELS[product.status]?.color as any || "secondary"}
                  className="absolute top-2 right-2"
                >
                  {STATUS_LABELS[product.status]?.label || product.status}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {product.shop?.name} • {product.category?.nameUz}
                </p>
                <p className="text-lg font-bold mt-1">
                  {formatPrice(Number(product.price))} so&apos;m
                </p>

                {/* Moderation History */}
                {product.moderationLogs?.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Oxirgi: {product.moderationLogs[0].action} — {formatDate(product.moderationLogs[0].createdAt)}
                  </div>
                )}

                {/* Validation Errors */}
                {product.validationErrors?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {product.validationErrors.slice(0, 2).map((err: string, i: number) => (
                      <p key={i} className="text-xs text-destructive">• {err}</p>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {product.status === "on_review" && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => approveMut.mutate(product.id)}
                        disabled={approveMut.isPending}
                      >
                        {approveMut.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><Check className="h-4 w-4 mr-1" /> Tasdiqlash</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => openReject(product.id)}
                      >
                        <X className="h-4 w-4 mr-1" /> Rad etish
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold">Navbatda mahsulot yo&apos;q</h3>
            <p className="text-muted-foreground">Barcha mahsulotlar tekshirilgan</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Oldingi</Button>
          <span className="text-sm py-2 px-4">{page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Keyingi</Button>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mahsulotni rad etish</DialogTitle>
          </DialogHeader>
          <div>
            <Textarea
              placeholder="Rad etish sababini kiriting..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Bekor</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMut.mutate({ id: rejectId, reason: rejectReason })}
              disabled={rejectMut.isPending || !rejectReason.trim()}
            >
              {rejectMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {/* Images */}
              {selectedProduct.images?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {selectedProduct.images.map((img: string, i: number) => (
                    <img key={i} src={img} alt="" className="h-32 w-32 object-cover rounded-lg shrink-0" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Narx:</span> {formatPrice(Number(selectedProduct.price))} so&apos;m</div>
                <div><span className="text-muted-foreground">Sklad:</span> {selectedProduct.stock} dona</div>
                <div><span className="text-muted-foreground">Do&apos;kon:</span> {selectedProduct.shop?.name}</div>
                <div><span className="text-muted-foreground">Kategoriya:</span> {selectedProduct.category?.nameUz}</div>
                <div><span className="text-muted-foreground">SKU:</span> {selectedProduct.sku || "—"}</div>
                <div><span className="text-muted-foreground">Holat:</span> {selectedProduct.status}</div>
              </div>
              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Tavsif:</p>
                  <p className="text-sm">{selectedProduct.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
