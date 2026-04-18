"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Script from "next/script";
import { Loader2, MapPin, MapPinOff, Fingerprint, ShieldCheck } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  adminLogin,
  adminLogin2FA,
  adminGoogleLogin,
  adminPasskeyLoginBegin,
  adminPasskeyLoginVerify,
} from "@/lib/api/admin";

// â”€â”€ Geolocation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TRUSTED_LOCATION_KEY = "admin_trusted_location";
const GEO_RADIUS_METERS = 5000;

interface LatLng { lat: number; lng: number }

function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sin2 = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(sin2));
}

function getTrustedLocation(): LatLng | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TRUSTED_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveTrustedLocation(loc: LatLng): void {
  localStorage.setItem(TRUSTED_LOCATION_KEY, JSON.stringify(loc));
}

function getCurrentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { timeout: 6000, maximumAge: 30_000 }
    );
  });
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

declare global {
  interface Window {
    handleGoogleCredential?: (response: { credential: string }) => void;
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const conditionalAttempted = useRef(false);

  // 2FA challenge state
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [twoFATempToken, setTwoFATempToken] = useState("");
  const [twoFACode, setTwoFACode] = useState("");

  // geo
  const [geoStatus, setGeoStatus] = useState<"idle" | "checking" | "ok" | "warn" | "denied">("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [currentPos, setCurrentPos] = useState<LatLng | null>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  // reCAPTCHA v3 — executes invisibly on demand, returns one-time token
  const executeRecaptcha = useCallback(async (action: string): Promise<string | undefined> => {
    if (!recaptchaSiteKey) return undefined;
    if (typeof window === "undefined" || !window.grecaptcha) return undefined;
    return new Promise((resolve) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(recaptchaSiteKey, { action });
          resolve(token);
        } catch {
          resolve(undefined);
        }
      });
    });
  }, [recaptchaSiteKey]);

  // Geo check
  useEffect(() => {
    (async () => {
      setGeoStatus("checking");
      const pos = await getCurrentPosition();
      if (!pos) {
        setGeoStatus("denied");
        setGeoMessage("Joylashuv aniqlanmadi");
        return;
      }
      const loc: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentPos(loc);
      const trusted = getTrustedLocation();
      if (!trusted) {
        setGeoStatus("ok");
      } else {
        const dist = haversineDistance(loc, trusted);
        if (dist <= GEO_RADIUS_METERS) {
          setGeoStatus("ok");
        } else {
          setGeoStatus("warn");
          setGeoMessage(`Ishonchli joydan ${Math.round(dist)} m uzoqdasiz`);
        }
      }
    })();
  }, []);

  const onSuccess = useCallback(() => {
    if (currentPos && !getTrustedLocation()) {
      saveTrustedLocation(currentPos);
    }
    window.location.href = "/admin/dashboard";
  }, [currentPos]);

  // â”€â”€ Passkey handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handlePasskey = useCallback(async (opts?: { conditional?: boolean }) => {
    try {
      if (typeof window === "undefined" || !("credentials" in navigator)) return;
      // Check feature support
      if (opts?.conditional) {
        const supported = await (PublicKeyCredential as any)?.isConditionalMediationAvailable?.();
        if (!supported) return;
      }
      const { options, sessionId } = await adminPasskeyLoginBegin(email || undefined);
      const cred = await startAuthentication({
        optionsJSON: options,
        useBrowserAutofill: !!opts?.conditional,
      });
      await adminPasskeyLoginVerify(sessionId, cred);
      onSuccess();
    } catch (err: any) {
      // Conditional UI silently aborts when no passkey â€” don't show error
      if (opts?.conditional) return;
      const msg = err?.message || "Passkey orqali kirib bo'lmadi";
      if (!/abort|cancel|no credentials/i.test(msg)) setError(msg);
    }
  }, [email, onSuccess]);

  // Detect passkey availability + auto-trigger conditional UI
  useEffect(() => {
    if (typeof window === "undefined" || conditionalAttempted.current) return;
    conditionalAttempted.current = true;
    (async () => {
      try {
        const PKC = (window as any).PublicKeyCredential;
        if (!PKC) return;
        const conditional = await PKC.isConditionalMediationAvailable?.();
        const platform = await PKC.isUserVerifyingPlatformAuthenticatorAvailable?.();
        if (conditional || platform) setPasskeyAvailable(true);
        if (conditional) {
          // Fire conditional UI silently (browser will surface autofill suggestion)
          handlePasskey({ conditional: true });
        }
      } catch { /* ignore */ }
    })();
  }, [handlePasskey]);

  // â”€â”€ Password submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!email.trim() || !password.trim()) {
        setError("Email va parolni kiriting");
        setIsLoading(false);
        return;
      }
      const captchaToken = await executeRecaptcha("admin_login");
      const data = await adminLogin(email.trim(), password, captchaToken || undefined);
      if (data?.requires2FA && data.tempToken) {
        setTwoFATempToken(data.tempToken);
        setTwoFAOpen(true);
        setIsLoading(false);
        return;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  // â”€â”€ 2FA submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handle2FASubmit = async () => {
    if (!twoFACode.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await adminLogin2FA(twoFATempToken, twoFACode.trim());
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Kod noto'g'ri");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Identity Services callback
  useEffect(() => {
    window.handleGoogleCredential = async ({ credential }) => {
      setIsLoading(true);
      setError(null);
      try {
        await adminGoogleLogin(credential);
        onSuccess();
      } catch (err: any) {
        setError(err.message || "Google orqali kirishda xatolik");
      } finally {
        setIsLoading(false);
      }
    };
    return () => { delete window.handleGoogleCredential; };
  }, [onSuccess]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Load Google Identity Services */}
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      )}

      {/* Load Google reCAPTCHA v3 */}
      {recaptchaSiteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
          strategy="afterInteractive"
        />
      )}

      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-gray-800">
        <span className="text-lg font-bold text-gray-900 dark:text-white">TOPLA</span>
        <span className="ml-1.5 text-[11px] font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">ADMIN</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Boshqaruv paneliga kirish</p>

          {/* Geo status */}
          {geoStatus === "warn" && geoMessage && (
            <div className="mt-4 rounded-full border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-4 py-3 text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <MapPinOff className="w-4 h-4 shrink-0" />
              {geoMessage}
            </div>
          )}
          {geoStatus === "ok" && !getTrustedLocation() && currentPos && (
            <div className="mt-4 rounded-full border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" />
              Joylashuvingiz kirishdan so'ng saqlanadi
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* PASSKEY â€” primary action */}
          {passkeyAvailable && !twoFAOpen && (
            <button
              type="button"
              onClick={() => handlePasskey()}
              disabled={isLoading}
              className="mt-6 h-14 w-full rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-base font-medium flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-gray-100 transition disabled:opacity-60"
            >
              <Fingerprint className="w-5 h-5" />
              Passkey bilan kirish (1 bosish)
            </button>
          )}

          {/* 2FA challenge view */}
          {twoFAOpen ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">2FA tasdiqlash</span>
              </div>
              <p className="text-xs text-gray-500">Authenticator ilovangizdagi 6 xonali kodni yoki backup kodni kiriting.</p>
              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none tracking-widest text-center font-mono"
                placeholder="000000"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handle2FASubmit(); }}
              />
              <button
                type="button"
                className="h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={handle2FASubmit}
                disabled={isLoading || !twoFACode.trim()}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Tasdiqlash"}
              </button>
              <button
                type="button"
                className="h-10 w-full rounded-full text-xs text-gray-500 hover:text-gray-700"
                onClick={() => { setTwoFAOpen(false); setTwoFACode(""); setTwoFATempToken(""); }}
              >
                Ortga qaytish
              </button>
            </div>
          ) : (
            <>
              {passkeyAvailable && (
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
                  <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-950 px-4 text-gray-400">yoki email/parol</span></div>
                </div>
              )}

              <div className={passkeyAvailable ? "space-y-4" : "mt-6 space-y-4"}>
                <input
                  className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none"
                  placeholder="Email manzil"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  enterKeyHint="next"
                  autoComplete="email webauthn"
                />
                <div className="relative">
                  <input
                    className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 pr-12 text-base outline-none"
                    placeholder="Parol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    enterKeyHint="go"
                    autoComplete="current-password"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

                {/* CAPTCHA — Google reCAPTCHA v3 (invisible) */}

                <button
                  type="button"
                  className="h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kirish...
                    </span>
                  ) : (
                    "Kirish"
                  )}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-gray-950 px-4 text-gray-400">yoki</span>
                  </div>
                </div>

                {/* Google Sign-In */}
                {googleClientId && (
                  <div className="flex justify-center">
                    <div
                      id="g_id_onload"
                      data-client_id={googleClientId}
                      data-callback="handleGoogleCredential"
                      data-auto_prompt="false"
                    />
                    <div
                      className="g_id_signin"
                      data-type="standard"
                      data-shape="pill"
                      data-theme="outline"
                      data-text="signin_with"
                      data-size="large"
                      data-logo_alignment="left"
                      data-width="320"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
