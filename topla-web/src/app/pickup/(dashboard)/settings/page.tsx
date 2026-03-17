"use client";

import { useState } from "react";
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changePickupPin, getPickupPointName } from "@/lib/api/pickup";

export default function PickupSettingsPage() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pointName = typeof window !== "undefined" ? getPickupPointName() : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPin.length < 4) {
      setError("Yangi PIN kamida 4 belgidan iborat bo'lishi kerak");
      return;
    }

    if (newPin !== confirmPin) {
      setError("Yangi PIN kodlar mos kelmaydi");
      return;
    }

    if (currentPin === newPin) {
      setError("Yangi PIN joriy PINdan farqli bo'lishi kerak");
      return;
    }

    setIsLoading(true);
    try {
      await changePickupPin(currentPin, newPin);
      setSuccess(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch (err: any) {
      setError(err.message || "PIN o'zgartirishda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground">{pointName}</p>
      </div>

      {/* Change PIN */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-orange-500" />
            PIN kodni o&apos;zgartirish
          </CardTitle>
          <CardDescription>
            Xavfsizlik uchun PIN kodni muntazam o&apos;zgartiring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>PIN kod muvaffaqiyatli o&apos;zgartirildi!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPin">Joriy PIN</Label>
              <Input
                id="currentPin"
                type="password"
                placeholder="••••"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                required
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPin">Yangi PIN</Label>
              <Input
                id="newPin"
                type="password"
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                required
                minLength={4}
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Yangi PINni tasdiqlang</Label>
              <Input
                id="confirmPin"
                type="password"
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                required
                minLength={4}
                maxLength={20}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={isLoading || !currentPin || !newPin || !confirmPin}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  O&apos;zgartirilmoqda...
                </>
              ) : (
                "PIN kodni o'zgartirish"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">TOPLA Topshirish Punkti</p>
            <p>Versiya 1.0.0</p>
            <p>© {new Date().getFullYear()} Topla</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
