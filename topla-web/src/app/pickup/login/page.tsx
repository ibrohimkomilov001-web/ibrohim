"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Package, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { pickupLogin } from "@/lib/api/pickup";

export default function PickupLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await pickupLogin(loginCode, pinCode);
      router.push("/pickup/scanner");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Package className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Topshirish punkti</CardTitle>
          <CardDescription>Buyurtmalarni qabul qilish tizimi</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="loginCode">Login kodi</Label>
              <Input
                id="loginCode"
                type="text"
                placeholder="PKT-001"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pinCode">PIN kod</Label>
              <Input
                id="pinCode"
                type="password"
                placeholder="••••"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                required
                maxLength={6}
              />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kirish...
                </>
              ) : (
                "Kirish"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              ← Bosh sahifaga qaytish
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
