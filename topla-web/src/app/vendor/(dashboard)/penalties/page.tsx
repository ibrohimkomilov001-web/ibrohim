"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { vendorApi } from "@/lib/api/vendor";
import { toast } from "sonner";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  AlertTriangle, FileWarning, Send, Loader2,
} from "lucide-react";

const PENALTY_TYPE_LABELS: Record<string, string> = {
  late_shipment: "Kech jo'natish",
  order_cancellation: "Buyurtma bekor",
  quality_issue: "Sifat muammosi",
  policy_violation: "Qoidabuzarlik",
  fake_product: "Soxta mahsulot",
  other: "Boshqa",
};

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  pending: { label: "Kutilmoqda", variant: "outline" },
  applied: { label: "Qo'llanildi", variant: "destructive" },
  appealed: { label: "Shikoyat yuborildi", variant: "secondary" },
  cancelled: { label: "Bekor qilindi", variant: "secondary" },
};

export default function VendorPenaltiesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealId, setAppealId] = useState("");
  const [appealNote, setAppealNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-penalties", statusFilter, page],
    queryFn: () => vendorApi.getPenalties({
      page, status: statusFilter !== "all" ? statusFilter : undefined,
    }),
  });

  const appealMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => vendorApi.appealPenalty(id, note),
    onSuccess: () => {
      toast.success("Shikoyat yuborildi");
      queryClient.invalidateQueries({ queryKey: ["vendor-penalties"] });
      setAppealOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const penalties = data?.penalties || [];
  const meta = data?.meta;
  const totalPenalties = data?.totalPenalties || 0;

  const openAppeal = (id: string) => {
    setAppealId(id);
    setAppealNote("");
    setAppealOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" /> Jarimalar
        </h1>
        <p className="text-muted-foreground">Do&apos;koningizga tegishli jarimalar</p>
      </div>

      {/* Summary */}
      {totalPenalties > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Jami qo&apos;llanilgan jarimalar</div>
            <div className="text-3xl font-bold text-destructive">
              {formatPrice(totalPenalties)} so&apos;m
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Penalties */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : penalties.length > 0 ? (
        <div className="space-y-4">
          {penalties.map((p: any) => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
            return (
              <Card key={p.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" className="mb-1">
                        {PENALTY_TYPE_LABELS[p.type] || p.type}
                      </Badge>
                      <h3 className="font-semibold">{p.reason}</h3>
                      {p.description && (
                        <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={cfg.variant as any}>{cfg.label}</Badge>
                      <p className="text-xl font-bold text-destructive mt-1">
                        -{formatPrice(Number(p.amount))} so&apos;m
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(p.createdAt)}
                      {p.order && ` • Buyurtma #${p.order.orderNumber}`}
                    </span>

                    {(p.status === "pending" || p.status === "applied") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAppeal(p.id)}
                      >
                        <FileWarning className="h-3 w-3 mr-1" /> Shikoyat
                      </Button>
                    )}
                  </div>

                  {p.appealNote && (
                    <div className="mt-3 bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Sizning shikoyatingiz:</p>
                      <p className="text-sm">{p.appealNote}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold">Jarimalar yo&apos;q</h3>
            <p className="text-muted-foreground">
              Siz hali hech qanday jarima olmadingiz
            </p>
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

      {/* Appeal Dialog */}
      <Dialog open={appealOpen} onOpenChange={setAppealOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jarimaga shikoyat</DialogTitle>
          </DialogHeader>
          <Textarea
            value={appealNote}
            onChange={(e) => setAppealNote(e.target.value)}
            placeholder="Nima uchun jarima noto'g'ri deb hisoblaysiz..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppealOpen(false)}>Bekor</Button>
            <Button
              onClick={() => appealMut.mutate({ id: appealId, note: appealNote })}
              disabled={appealMut.isPending || appealNote.length < 10}
            >
              {appealMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" /> Yuborish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
