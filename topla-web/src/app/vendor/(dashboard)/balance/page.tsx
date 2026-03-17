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
import { useTranslation } from '@/store/locale-store';

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function isValidUzCard(card: string) {
  const digits = card.replace(/\s/g, '');
  return digits.length === 16 && (digits.startsWith('8600') || digits.startsWith('9860'));
}

export default function BalancePage() {
  const { t } = useTranslation();
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
      toast.success(t('payoutRequestSent'));
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-payouts"] });
      setPayoutDialogOpen(false);
      setPayoutAmount("");
      setCardNumber("");
    },
    onError: (error: any) => {
      toast.error(error.message || t('errorOccurred'));
    },
  });

  const balance = stats?.balance || 0;
  const todayRevenue = stats?.revenue?.today || 0;
  const totalRevenue = stats?.revenue?.total || 0;
  const totalCommission = stats?.totalCommission || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('myAccount')}</h1>
          <p className="text-sm text-muted-foreground">{t('balanceAndHistory')}</p>
        </div>
        <Button
          className="rounded-full w-full sm:w-auto"
          onClick={() => setPayoutDialogOpen(true)}
          disabled={balance <= 0}
        >
          <Banknote className="mr-2 h-4 w-4" />
          {t('withdrawMoney')}
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-primary-foreground/80">{t('availableBalance')}</span>
                <Wallet className="h-5 w-5 text-primary-foreground/60" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32 bg-primary-foreground/20" />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold">{formatPrice(balance)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{t('todayRevenue')}</span>
                <DollarSign className="h-5 w-5 text-yellow-500" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">{formatPrice(todayRevenue)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t('todaySales')}</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{t('totalIncome')}</span>
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
                <span className="text-sm text-muted-foreground">{t('commission')}</span>
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

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('transactions')}</CardTitle>
            <CardDescription>{t('recentTransactions')}</CardDescription>
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
                      <p className="text-sm font-medium truncate">{tx.description || (tx.type === "sale" ? t('saleWord') : t('paymentWord'))}</p>
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
                <p>{t('noTransactions')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('payoutRequests')}</CardTitle>
            <CardDescription>{t('payoutHistory')}</CardDescription>
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
                      {payout.status === "completed" ? t('completed') :
                       payout.status === "pending" ? t('pending') :
                       t('rejected')
                      }
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>{t('noPayoutRequests')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('withdrawMoney')}</DialogTitle>
            <DialogDescription>
              {t('availableBalance')}: {formatPrice(balance)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payoutAmount">{t('amountLabel')}</Label>
              <Input
                id="payoutAmount"
                type="number"
                placeholder="100000"
                value={payoutAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setPayoutAmount(val);
                  const num = Number(val);
                  if (val && num < 50000) setAmountError(t('minAmountError'));
                  else if (val && num > balance) setAmountError(t('insufficientBalance'));
                  else setAmountError("");
                }}
                max={balance}
                min={50000}
              />
              {amountError ? (
                <p className="text-xs text-destructive">{amountError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t('minAmountNote')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardNumber">{t('cardNumberLabel')}</Label>
              <Input
                id="cardNumber"
                placeholder="8600 1234 5678 9012"
                value={cardNumber}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value);
                  setCardNumber(formatted);
                  const digits = formatted.replace(/\s/g, '');
                  if (digits.length === 16 && !isValidUzCard(formatted)) {
                    setCardError(t('cardStartError'));
                  } else {
                    setCardError("");
                  }
                }}
                maxLength={19}
              />
              {cardError ? (
                <p className="text-xs text-destructive">{cardError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t('uzBankCards')}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPayoutDialogOpen(false);
              setCardError("");
              setAmountError("");
            }} className="rounded-full">
              {t('cancel')}
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
                  {t('sendingText')}
                </>
              ) : (
                t('sendRequest')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
