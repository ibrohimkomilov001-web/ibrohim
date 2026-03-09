"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCategoryCommissions, updateCategoryCommission, deleteCategoryCommission } from "@/lib/api/admin";
import { toast } from "sonner";
import { useTranslation } from "@/store/locale-store";
import { Percent, Pencil, Trash2, Save, Loader2 } from "lucide-react";

export default function CommissionsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["category-commissions"],
    queryFn: fetchCategoryCommissions,
  });

  const updateMutation = useMutation({
    mutationFn: ({ categoryId, rate }: { categoryId: string; rate: number }) =>
      updateCategoryCommission(categoryId, rate),
    onSuccess: () => {
      toast.success("Komissiya yangilandi");
      queryClient.invalidateQueries({ queryKey: ["category-commissions"] });
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategoryCommission,
    onSuccess: () => {
      toast.success("Komissiya o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["category-commissions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const commissions = data?.commissions || [];
  const categories = data?.categories || [];

  // Categories without commission
  const uncommissioned = categories.filter(
    (cat: any) => !commissions.find((c: any) => c.categoryId === cat.id)
  );

  const startEdit = (categoryId: string, currentRate?: number) => {
    setEditingId(categoryId);
    setEditRate(currentRate?.toString() || "10");
  };

  const saveRate = (categoryId: string) => {
    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Noto'g'ri foiz (0-100)");
      return;
    }
    updateMutation.mutate({ categoryId, rate });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kategoriya komissiyalari</h1>
        <p className="text-muted-foreground">
          Har bir kategoriya uchun alohida komissiya foizini belgilang
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Commissions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Belgilangan komissiyalar
              </CardTitle>
              <CardDescription>
                Belgilanmagan kategoriyalarda standart do&apos;kon komissiyasi qo&apos;llaniladi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : commissions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategoriya</TableHead>
                      <TableHead className="text-center">Komissiya %</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.category?.nameUz || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingId === c.categoryId ? (
                            <div className="flex items-center justify-center gap-2">
                              <Input
                                type="number"
                                value={editRate}
                                onChange={(e) => setEditRate(e.target.value)}
                                className="w-20 text-center"
                                min={0}
                                max={100}
                                step={0.5}
                              />
                              <span>%</span>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-base">
                              {Number(c.rate)}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === c.categoryId ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveRate(c.categoryId)}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                              >
                                Bekor
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => startEdit(c.categoryId, Number(c.rate))}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => deleteMutation.mutate(c.categoryId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Percent className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Hali kategoriya komissiyalari belgilanmagan</p>
                  <p className="text-sm">O&apos;ngdagi ro&apos;yxatdan tanlang</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Commission */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kategoriyalar</CardTitle>
              <CardDescription>
                Komissiya belgilash uchun tanlang
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : uncommissioned.length > 0 ? (
                <div className="space-y-2">
                  {uncommissioned.map((cat: any) => (
                    <Button
                      key={cat.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => startEdit(cat.id)}
                    >
                      <Percent className="h-4 w-4 mr-2" />
                      {cat.nameUz}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Barcha kategoriyalarga komissiya belgilangan
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
