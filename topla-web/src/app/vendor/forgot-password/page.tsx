"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Smartphone,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type Step = "email" | "token" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email step
  const [email, setEmail] = useState("");

  // Token + new password step
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Xatolik yuz berdi");
      }

      // Dev mode: auto-fill token if returned
      if (data.resetToken) {
        setToken(data.resetToken);
      }
      if (data.phone) {
        setMaskedPhone(data.phone);
      }

      setStep("token");
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Parollar mos kelmaydi");
      return;
    }

    if (newPassword.length < 6) {
      setError("Parol kamida 6 belgidan iborat bo'lishi kerak");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/confirm-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Xatolik yuz berdi");
      }

      setStep("success");
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Parolni tiklash</CardTitle>
            <CardDescription>
              {step === "email" &&
                "Email manzilingizni kiriting, tiklash kodi SMS orqali yuboriladi"}
              {step === "token" &&
                `Telefon raqamingizga (${maskedPhone}) yuborilgan kodni kiriting`}
              {step === "success" && "Parolingiz muvaffaqiyatli yangilandi"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 1: Email */}
            {step === "email" && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vendor@topla.uz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    "Tiklash kodini yuborish"
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Token + New Password */}
            {step === "token" && (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <Smartphone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>{maskedPhone}</strong> raqamiga 6 xonali tiklash kodi yuborildi.
                    SMS xabarni tekshiring. Kod 15 daqiqa amal qiladi.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Tiklash kodi</Label>
                  <Input
                    id="token"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 xonali kod"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus={!token}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Yangi parol</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Kamida 6 belgi"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Parolni qayta kiriting"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yangilanmoqda...
                    </>
                  ) : (
                    "Parolni yangilash"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Emailni qayta kiritish
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  SMS kelmadimi? 60 soniyadan keyin qayta so&apos;rang.
                </p>
              </form>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Parolingiz muvaffaqiyatli yangilandi. Endi yangi parol bilan
                  kirishingiz mumkin.
                </p>
                <Link href="/vendor/login">
                  <Button className="w-full rounded-full">Kirishga o&apos;tish</Button>
                </Link>
              </div>
            )}

            {step !== "success" && (
              <div className="mt-6 text-center">
                <Link
                  href="/vendor/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Kirish sahifasiga qaytish
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
