"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { VendorAuthHeader } from "@/components/vendor/VendorAuthHeader";
import { useTranslation } from "@/store/locale-store";

const PHONE_PREFIX = "+998 ";

function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits.startsWith("998")) {
    digits = "998" + digits.replace(/^998*/, "");
  }
  digits = digits.slice(0, 12);

  let formatted = "+998";
  const rest = digits.slice(3);
  if (rest.length > 0) formatted += " " + rest.slice(0, 2);
  if (rest.length > 2) formatted += " " + rest.slice(2, 5);
  if (rest.length > 5) formatted += " " + rest.slice(5, 7);
  if (rest.length > 7) formatted += " " + rest.slice(7, 9);
  return formatted;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("998")) return digits;
  return `998${digits}`;
}

export default function VendorLoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState(PHONE_PREFIX);
  const phoneRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");

  const enforcePhoneCursor = (el: HTMLInputElement) => {
    const minPos = PHONE_PREFIX.length;
    if ((el.selectionStart ?? 0) < minPos) {
      el.setSelectionRange(minPos, minPos);
    }
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const el = event.target;
    const prevLen = phone.length;
    const formatted = formatPhone(el.value);
    setPhone(formatted);
    const cursorPos = el.selectionStart ?? formatted.length;
    const diff = formatted.length - prevLen;
    requestAnimationFrame(() => {
      if (phoneRef.current) {
        const newPos = Math.max(PHONE_PREFIX.length, cursorPos + diff);
        phoneRef.current.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handlePhoneFocus = () => {
    requestAnimationFrame(() => {
      if (phoneRef.current) enforcePhoneCursor(phoneRef.current);
    });
  };

  const handlePhoneClick = () => {
    if (phoneRef.current) enforcePhoneCursor(phoneRef.current);
  };

  const handlePhoneKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const el = event.target as HTMLInputElement;
    const pos = el.selectionStart ?? 0;
    if ((event.key === "Backspace" || event.key === "Delete") && pos <= PHONE_PREFIX.length) {
      event.preventDefault();
    }
  };

  const handleLogin = async () => {
    setError(null);
    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length < 12) {
      setError(t("vendorFullPhone"));
      return;
    }
    if (!password) {
      setError(t("vendorEnterPassword"));
      return;
    }

    setIsLoading(true);
    try {
      await login(phoneDigits, password);
      router.push("/vendor/dashboard");
    } catch (err: any) {
      setError(err.message || t("vendorLoginError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        throw new Error("Google Client ID sozlanmagan");
      }

      // Google OAuth popup ochish
      const redirectUri = `${window.location.origin}/vendor/login`;
      const scope = "openid email profile";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=select_account`;

      const popup = window.open(authUrl, "google-login", "width=500,height=600,scrollbars=yes");
      if (!popup) {
        throw new Error("Popup bloklandimi? Iltimos, popup ga ruxsat bering.");
      }

      // Popup dan token kutish
      const accessToken = await new Promise<string>((resolve, reject) => {
        const interval = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(interval);
              reject(new Error("Google kirish bekor qilindi"));
              return;
            }
            const url = popup.location.href;
            if (url.includes("access_token=")) {
              clearInterval(interval);
              const hash = new URL(url).hash.substring(1);
              const params = new URLSearchParams(hash);
              const token = params.get("access_token");
              popup.close();
              if (token) {
                resolve(token);
              } else {
                reject(new Error("Token olib bo'lmadi"));
              }
            }
          } catch {
            // Cross-origin — popup hali boshqa domenda
          }
        }, 500);

        // Timeout — 2 daqiqa
        setTimeout(() => {
          clearInterval(interval);
          popup.close();
          reject(new Error("Google kirish vaqti tugadi"));
        }, 120000);
      });

      await loginWithGoogle(accessToken);
      router.push("/vendor/dashboard");
    } catch (err: any) {
      if (err.message !== "Google kirish bekor qilindi") {
        setError(err.message || t("vendorLoginError"));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <VendorAuthHeader menuItems={[
        { label: t('vendorCreateAccount'), href: '/vendor/register' },
      ]} />

      <div className="flex-1 flex items-center justify-center px-4 py-8 pt-14">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold text-gray-900">{t("vendorLoginTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("vendorLoginSubtitle")}</p>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <input
              ref={phoneRef}
              className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 text-base outline-none"
              placeholder={t("vendorPhonePlaceholder")}
              value={phone}
              onChange={handlePhoneChange}
              onFocus={handlePhoneFocus}
              onClick={handlePhoneClick}
              onKeyDown={handlePhoneKeyDown}
              inputMode="tel"
            />

            <div className="relative">
              <input
                className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 pr-12 text-base outline-none"
                placeholder={t("vendorPassword")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                enterKeyHint="go"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            <button
              type="button"
              className="h-12 w-full rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? t("vendorEntering") : t("vendorEnter")}
            </button>

            <div className="text-right">
              <Link href="/vendor/forgot-password" className="text-sm text-blue-600 hover:underline">
                {t("vendorForgotPassword")}
              </Link>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-400">{t("vendorOr")}</span>
              </div>
            </div>

            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                t("vendorEntering")
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {t("vendorGoogleLogin")}
                </>
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            {t("vendorNoShop")}{" "}
            <Link href="/vendor/register" className="text-blue-600 hover:underline">
              {t("vendorRegisterLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
