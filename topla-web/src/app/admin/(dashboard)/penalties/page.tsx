"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import {
  fetchPenalties, createPenalty, updatePenaltyStatus, fetchShops,
} from "@/lib/api/admin";
import { toast } from "sonner";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  AlertTriangle, Plus, Check, X, Loader2, Ban, FileWarning,
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
  appealed: { label: "Shikoyat", variant: "secondary" },
  cancelled: { label: "Bekor", variant: "secondary" },
};

export default function PenaltiesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    shopId: "", type: "late_shipment", amount: 0, reason: "", description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-penalties", statusFilter, page],
    queryFn: () => fetchPenalties({
      status: statusFilter !== "all" ? statusFilter : undefined,
      page,
    }),
  });

  const { data: shopsData } = useQuery({
    queryKey: ["admin-shops-list"],
    queryFn: () => fetchShops({ page: 1 }),
  });

  const createMut = useMutation({
    mutationFn: createPenalty,
    onSuccess: () => {
      toast.success("Jarima yaratildi");
      queryClient.invalidateQueries({ queryKey: ["admin-penalties"] });
      setCreateOpen(false);
      setForm({ shopId: "", type: "late_shipment", amount: 0, reason: "", description: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePenaltyStatus(id, status),
    onSuccess: () => {
      toast.success("Jarima holati yangilandi");
      queryClient.invalidateQueries({ queryKey: ["admin-penalties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const penalties = data?.penalties || [];
  const meta = data?.meta;
  const totalApplied = data?.totalApplied || 0;
  const shops = shopsData?.shops || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jarimalar</h1>
          <p className="text-muted-foreground">
            Do&apos;konlarga qo&apos;yilgan jarimalar boshqaruvi
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Jarima qo&apos;shish
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Jami jarimalar</div>
            <div className="text-2xl font-bold">{meta?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Qo&apos;llanilgan summa</div>
            <div className="text-2xl font-bold text-destructive">
              {formatPrice(totalApplied)} so&apos;m
            </div>
          </CardContent>
        </Card>
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : penalties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Do&apos;kon</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>Sabab</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penalties.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.shop?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PENALTY_TYPE_LABELS[p.type] || p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-destructive">
                      {formatPrice(Number(p.amount))} so&apos;m
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[200px] truncate text-sm">{p.reason}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[p.status]?.variant as any || "secondary"}>
                        {STATUS_CONFIG[p.status]?.label || p.status}
                      </Badge>
                      {p.appealNote && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                          Shikoyat: {p.appealNote}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(p.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(p.status === "pending" || p.status === "appealed") && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => statusMut.mutate({ id: p.id, status: "applied" })}
                            disabled={statusMut.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" /> Qo&apos;llash
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => statusMut.mutate({ id: p.id, status: "cancelled" })}
                            disabled={statusMut.isPending}
                          >
                            <X className="h-3 w-3 mr-1" /> Bekor
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Jarimalar yo&apos;q</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi jarima</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Do&apos;kon</Label>
              <Select value={form.shopId} onValueChange={(v) => setForm({ ...form, shopId: v })}>
                <SelectTrigger><SelectValue placeholder="Do'kon tanlang" /></SelectTrigger>
                <SelectContent>
                  {shops.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Turi</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PENALTY_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Summa (so&apos;m)</Label>
                <Input
                  type="number"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>
            <div>
              <Label>Sabab</Label>
              <Input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Qisqacha sabab"
              />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="Batafsil..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor</Button>
            <Button onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.shopId}>
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
