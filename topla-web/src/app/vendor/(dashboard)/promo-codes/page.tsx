"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi, PromoCode } from "@/lib/api/vendor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Copy,
  Loader2,
  Percent,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

function formatPrice(value: number) {
  return new Intl.NumberFormat("uz-UZ").format(value) + " so'm";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PromoCodesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-promo-codes"],
    queryFn: () => vendorApi.getPromoCodes({ limit: 50 }),
  });

  const promoCodes: PromoCode[] = data?.data || (data as any) || [];

  const createMutation = useMutation({
    mutationFn: vendorApi.createPromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-promo-codes"] });
      setIsCreateOpen(false);
      resetForm();
      toast.success("Promo kod yaratildi");
    },
    onError: (err: any) => {
      setError(err.message || "Xatolik yuz berdi");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => vendorApi.updatePromoCode(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-promo-codes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: vendorApi.deletePromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-promo-codes"] });
      toast.success("Promo kod o'chirildi");
    },
    onError: (err: any) => {
      toast.error(err.message || "O'chirishda xatolik");
    },
  });

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderAmount("");
    setMaxUses("");
    setExpiresAt("");
    setError(null);
  };

  const handleCreate = () => {
    setError(null);

    if (!code.trim()) {
      setError("Kodni kiriting");
      return;
    }

    if (!discountValue || Number(discountValue) <= 0) {
      setError("Chegirma qiymatini kiriting");
      return;
    }

    if (discountType === "percentage" && Number(discountValue) > 100) {
      setError("Foiz 100 dan oshmasligi kerak");
      return;
    }

    createMutation.mutate({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    });
  };

  const copyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    toast.success("Kod nusxalandi");
  };

  const isExpired = (promo: PromoCode) => {
    if (!promo.expiresAt) return false;
    return new Date(promo.expiresAt) < new Date();
  };

  const isMaxUsed = (promo: PromoCode) => {
    if (!promo.maxUses) return false;
    return promo.currentUses >= promo.maxUses;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo kodlar</h1>
          <p className="text-sm text-muted-foreground">
            Chegirma kodlarini yarating va boshqaring
          </p>
        </div>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi kod
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi promo kod yaratish</DialogTitle>
              <DialogDescription>
                Mijozlar uchun chegirma kodi yarating. Maksimal 20 ta kod
                yaratish mumkin.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Promo kod</Label>
                <Input
                  id="code"
                  placeholder="TOPLA20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  3-20 belgi, avtomatik katta harflarga o&apos;tkaziladi
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chegirma turi</Label>
                  <Select
                    value={discountType}
                    onValueChange={(v) =>
                      setDiscountType(v as "percentage" | "fixed")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Foiz (%)</SelectItem>
                      <SelectItem value="fixed">
                        Belgilangan (so&apos;m)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Qiymat{" "}
                    {discountType === "percentage" ? "(%)" : "(so'm)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    placeholder={discountType === "percentage" ? "20" : "10000"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    min={1}
                    max={discountType === "percentage" ? 100 : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">
                    Min. buyurtma summasi (ixtiyoriy)
                  </Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    placeholder="50000"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUses">
                    Maks. ishlatish soni (ixtiyoriy)
                  </Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="100"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    min={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">
                  Amal qilish muddati (ixtiyoriy)
                </Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  "Yaratish"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Jami kodlar</CardDescription>
            <CardTitle className="text-2xl">
              {promoCodes.length}
              <span className="text-sm font-normal text-muted-foreground">
                /20
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Faol kodlar</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {
                promoCodes.filter(
                  (p) => p.isActive && !isExpired(p) && !isMaxUsed(p)
                ).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Jami ishlatilgan</CardDescription>
            <CardTitle className="text-2xl">
              {promoCodes.reduce((sum, p) => sum + (p.currentUses || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">
                Promo kodlar mavjud emas
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Birinchi promo kodingizni yarating
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Yangi kod yaratish
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Chegirma</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Min. summa
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Ishlatilgan
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Muddat
                  </TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => {
                  const expired = isExpired(promo);
                  const maxUsed = isMaxUsed(promo);
                  const active = promo.isActive && !expired && !maxUsed;

                  return (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono font-bold">
                            {promo.code}
                          </code>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {promo.discountType === "percentage" ? (
                            <>
                              <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">
                                {Number(promo.discountValue)}%
                              </span>
                            </>
                          ) : (
                            <span className="font-medium">
                              {formatPrice(Number(promo.discountValue))}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {promo.minOrderAmount && Number(promo.minOrderAmount) > 0
                          ? formatPrice(Number(promo.minOrderAmount))
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span
                          className={
                            maxUsed ? "text-red-500 font-medium" : ""
                          }
                        >
                          {promo.currentUses}
                          {promo.maxUses ? `/${promo.maxUses}` : ""}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {promo.expiresAt ? (
                          <span
                            className={
                              expired ? "text-red-500" : "text-muted-foreground"
                            }
                          >
                            {formatDate(promo.expiresAt)}
                            {expired && " (tugagan)"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Cheksiz
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={promo.isActive}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({
                                id: promo.id,
                                isActive: checked,
                              })
                            }
                            disabled={toggleMutation.isPending}
                          />
                          {active ? (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-700 hover:bg-green-100"
                            >
                              Faol
                            </Badge>
                          ) : expired ? (
                            <Badge variant="secondary">Tugagan</Badge>
                          ) : maxUsed ? (
                            <Badge variant="secondary">Limit</Badge>
                          ) : (
                            <Badge variant="outline">Nofaol</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (
                              confirm(
                                `"${promo.code}" kodini o'chirmoqchimisiz?`
                              )
                            ) {
                              deleteMutation.mutate(promo.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
