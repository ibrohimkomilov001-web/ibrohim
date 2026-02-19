"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  Banknote,
  DollarSign,
} from "lucide-react";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function isValidUzCard(card: string) {
  const digits = card.replace(/\s/g, '');
  return digits.length === 16 && (digits.startsWith('8600') || digits.startsWith('9860'));
}

export default function BalancePage() {
  const queryClient = useQueryClient();
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardError, setCardError] = useState("");
  const [amountError, setAmountError] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: vendorApi.getStats,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["vendor-transactions"],
    queryFn: () => vendorApi.getTransactions({ page: 1, limit: 50 }),
  });

  const { data: payouts } = useQuery({
    queryKey: ["vendor-payouts"],
    queryFn: () => vendorApi.getPayouts({ page: 1, limit: 20 }),
  });

  const payoutMutation = useMutation({
    mutationFn: () =>
      vendorApi.requestPayout({
        amount: Number(payoutAmount),
        cardNumber: cardNumber.replace(/\s/g, ""),
      }),
    onSuccess: () => {
      toast.success("To'lov so'rovi yuborildi");
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-payouts"] });
      setPayoutDialogOpen(false);
      setPayoutAmount("");
      setCardNumber("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Xatolik yuz berdi");
    },
  });

  const balance = stats?.balance || 0;
  const todayRevenue = stats?.revenue?.today || 0;
  const totalRevenue = stats?.revenue?.total || 0;
  const totalCommission = stats?.totalCommission || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hisobim</h1>
          <p className="text-muted-foreground">Balans va to&apos;lov tarixi</p>
        </div>
        <Button
          className="rounded-full"
          onClick={() => setPayoutDialogOpen(true)}
          disabled={balance <= 0}
        >
          <Banknote className="mr-2 h-4 w-4" />
          Pul yechish
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-primary-foreground/80">Mavjud balans</span>
                <Wallet className="h-5 w-5 text-primary-foreground/60" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32 bg-primary-foreground/20" />
              ) : (
                <div className="text-3xl font-bold">{formatPrice(balance)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Bugungi daromad</span>
                <DollarSign className="h-5 w-5 text-yellow-500" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">{formatPrice(todayRevenue)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Bugungi savdo</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Jami daromad</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Komissiya</span>
                <ArrowUpRight className="h-5 w-5 text-blue-500" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">{formatPrice(totalCommission)}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tranzaksiyalar</CardTitle>
            <CardDescription>So&apos;nggi pul harakatlari</CardDescription>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : transactions?.data && transactions.data.length > 0 ? (
              <div className="space-y-3">
                {transactions.data.map((tx: any) => (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      tx.type === "credit" || tx.type === "sale"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}>
                      {tx.type === "credit" || tx.type === "sale" ? (
                        <ArrowDownRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || (tx.type === "sale" ? "Savdo" : "To'lov")}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className={`font-semibold text-sm ${
                      tx.type === "credit" || tx.type === "sale" ? "text-green-600" : "text-red-600"
                    }`}>
                      {tx.type === "credit" || tx.type === "sale" ? "+" : "-"}
                      {formatPrice(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Hozircha tranzaksiyalar yo&apos;q</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">To&apos;lov so&apos;rovlari</CardTitle>
            <CardDescription>Pul yechish tarixi</CardDescription>
          </CardHeader>
          <CardContent>
            {payouts?.data && payouts.data.length > 0 ? (
              <div className="space-y-3">
                {payouts.data.map((payout: any) => (
                  <div key={payout.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {formatPrice(payout.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payout.createdAt)}
                        {payout.cardNumber && ` • ****${payout.cardNumber.slice(-4)}`}
                      </p>
                    </div>
                    <Badge variant={
                      payout.status === "completed" ? "default" :
                      payout.status === "pending" ? "secondary" :
                      "destructive"
                    }>
                      {payout.status === "completed" ? "Bajarildi" :
                       payout.status === "pending" ? "Kutilmoqda" :
                       "Rad etildi"
                      }
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Hali to&apos;lov so&apos;rovlari yo&apos;q</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pul yechish</DialogTitle>
            <DialogDescription>
              Mavjud balans: {formatPrice(balance)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payoutAmount">Summa (so&apos;m)</Label>
              <Input
                id="payoutAmount"
                type="number"
                placeholder="100000"
                value={payoutAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setPayoutAmount(val);
                  const num = Number(val);
                  if (val && num < 50000) setAmountError("Minimal summa: 50 000 so'm");
                  else if (val && num > balance) setAmountError("Balansda yetarli mablag' yo'q");
                  else setAmountError("");
                }}
                max={balance}
                min={50000}
              />
              {amountError ? (
                <p className="text-xs text-destructive">{amountError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Minimal: 50 000 so&apos;m</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Karta raqami</Label>
              <Input
                id="cardNumber"
                placeholder="8600 1234 5678 9012"
                value={cardNumber}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value);
                  setCardNumber(formatted);
                  const digits = formatted.replace(/\s/g, '');
                  if (digits.length === 16 && !isValidUzCard(formatted)) {
                    setCardError("Karta 8600 yoki 9860 bilan boshlanishi kerak");
                  } else {
                    setCardError("");
                  }
                }}
                maxLength={19}
              />
              {cardError ? (
                <p className="text-xs text-destructive">{cardError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Uzbekiston bank kartalari (8600, 9860)</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPayoutDialogOpen(false);
              setCardError("");
              setAmountError("");
            }} className="rounded-full">
              Bekor qilish
            </Button>
            <Button
              className="rounded-full"
              onClick={() => payoutMutation.mutate()}
              disabled={
                payoutMutation.isPending ||
                !payoutAmount ||
                Number(payoutAmount) < 50000 ||
                Number(payoutAmount) > balance ||
                !isValidUzCard(cardNumber)
              }
            >
              {payoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yuborilmoqda...
                </>
              ) : (
                "So'rov yuborish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
