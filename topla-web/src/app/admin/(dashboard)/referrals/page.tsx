"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchReferrals,
  updateReferralSettings,
  updateReferral,
} from "@/lib/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  DollarSign,
  CheckCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";

interface ReferralUser {
  id: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  bonusAmount: number;
  referrerPaid: boolean;
  referredPaid: boolean;
  createdAt: string;
  referrer: ReferralUser;
  referred: ReferralUser;
}

interface Stats {
  totalReferrals: number;
  totalPaidBonuses: number;
  totalBonusAmount: number;
  currentBonusAmount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bonusInput, setBonusInput] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReferrals({ page, limit: 20 });
      setReferrals(data.referrals || []);
      setStats(data.stats || null);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load referrals:", err);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async () => {
    const amount = parseFloat(bonusInput);
    if (isNaN(amount) || amount < 0) return;
    setSaving(true);
    try {
      await updateReferralSettings({ bonusAmount: amount });
      setSettingsOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
    setSaving(false);
  };

  const handleTogglePaid = async (
    referral: Referral,
    field: "referrerPaid" | "referredPaid"
  ) => {
    try {
      await updateReferral(referral.id, {
        [field]: !referral[field],
      });
      loadData();
    } catch (err) {
      console.error("Failed to update referral:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("uz-UZ") + " so'm";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referrallar</h1>
          <p className="text-muted-foreground">
            Do&apos;stlarni taklif qilish tizimi boshqaruvi
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setBonusInput(stats?.currentBonusAmount?.toString() || "50000");
            setSettingsOpen(true);
          }}
        >
          <Settings className="w-4 h-4 mr-2" />
          Sozlamalar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Jami referrallar
                  </p>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Bonus berilganlar
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.totalPaidBonuses}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Umumiy bonus summasi
                  </p>
                  <p className="text-2xl font-bold">
                    {formatMoney(stats.totalBonusAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Hozirgi bonus
                  </p>
                  <p className="text-2xl font-bold">
                    {formatMoney(stats.currentBonusAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Barcha referrallar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Hozircha referrallar yo&apos;q</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Referrer */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Taklif qilgan
                      </p>
                      <p className="font-medium truncate">
                        {ref.referrer.fullName || "Noma'lum"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ref.referrer.phone || "—"}
                      </p>
                    </div>

                    <div className="text-muted-foreground text-lg">→</div>

                    {/* Referred */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Taklif qilingan
                      </p>
                      <p className="font-medium truncate">
                        {ref.referred.fullName || "Noma'lum"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ref.referred.phone || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Status & Amount */}
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatMoney(ref.bonusAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(ref.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={ref.referrerPaid ? "default" : "secondary"}
                        className="text-xs cursor-pointer"
                        onClick={() => handleTogglePaid(ref, "referrerPaid")}
                      >
                        {ref.referrerPaid
                          ? "✓ Taklif qilgan"
                          : "○ Taklif qilgan"}
                      </Badge>
                      <Badge
                        variant={ref.referredPaid ? "default" : "secondary"}
                        className="text-xs cursor-pointer"
                        onClick={() => handleTogglePaid(ref, "referredPaid")}
                      >
                        {ref.referredPaid
                          ? "✓ Taklif qilingan"
                          : "○ Taklif qilingan"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Jami: {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Referral sozlamalari</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Bonus summasi (so&apos;m)</Label>
              <Input
                type="number"
                value={bonusInput}
                onChange={(e) => setBonusInput(e.target.value)}
                placeholder="50000"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Har bir muvaffaqiyatli referral uchun ikkala tomonga beriladigan
                bonus summasi
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
