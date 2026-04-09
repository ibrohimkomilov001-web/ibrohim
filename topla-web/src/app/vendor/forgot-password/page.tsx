"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { VendorAuthHeader } from "@/components/vendor/VendorAuthHeader";
import { useTranslation } from "@/store/locale-store";

const PHONE_PREFIX = "+998 ";
const OTP_LENGTH = 5;
const EMAIL_CODE_LENGTH = 6;

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

type Tab = "phone" | "email";
type Step = "input" | "code" | "newpass" | "success";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  const [tab, setTab] = useState<Tab>("phone");
  const [step, setStep] = useState<Step>("input");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone tab
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Email tab
  const [email, setEmail] = useState("");

  // Code
  const [otpCode, setOtpCode] = useState(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [emailToken, setEmailToken] = useState("");
  const [countdown, setCountdown] = useState(0);

  // New password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const otpValue = useMemo(() => otpCode.join(""), [otpCode]);
  const codeLength = tab === "phone" ? OTP_LENGTH : EMAIL_CODE_LENGTH;

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

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpCode];
    next[index] = value.slice(-1);
    setOtpCode(next);
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otpCode]);

  const handleOtpKeyDown = useCallback((index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otpCode]);

  const handleOtpPaste = useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpCode(next);
    otpRefs.current[Math.min(pasted.length - 1, OTP_LENGTH - 1)]?.focus();
  }, []);

  // Send code (phone OTP or email code)
  const handleSendCode = async () => {
    setError(null);

    if (tab === "phone") {
      const digits = normalizePhone(phone);
      if (digits.length < 12) {
        setError(t("vendorFullPhone"));
        return;
      }
      setIsLoading(true);
      try {
        await authApi.resetPasswordPhone({ phone: digits });
        setOtpCode(Array(OTP_LENGTH).fill(""));
        setStep("code");
        setCountdown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 80);
      } catch (err: any) {
        setError(err.message || t("vendorError"));
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError(t("vendorEnterEmail"));
        return;
      }
      setIsLoading(true);
      try {
        const res = await authApi.resetPasswordEmail({ email: email.trim() });
        setEmailToken((res as any).resetToken || "");
        setStep("code");
        setCountdown(60);
      } catch (err: any) {
        setError(err.message || t("vendorError"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Verify code → new password step
  const goToNewPass = () => {
    setError(null);
    if (tab === "phone" && otpValue.length < OTP_LENGTH) {
      setError(t("vendorEnterCode"));
      return;
    }
    if (tab === "email" && emailToken.length < 4) {
      setError(t("vendorEnterCode"));
      return;
    }
    setStep("newpass");
  };

  // Confirm reset
  const handleConfirmReset = async () => {
    setError(null);

    if (newPassword.length < 8) {
      setError(t("vendorPasswordMin8"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("vendorPasswordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      if (tab === "phone") {
        await authApi.confirmResetPhone({
          phone: normalizePhone(phone),
          code: otpValue,
          newPassword,
        });
      } else {
        await authApi.confirmResetEmail({
          token: emailToken,
          newPassword,
        });
      }
      setStep("success");
    } catch (err: any) {
      setError(err.message || t("vendorError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (newTab: Tab) => {
    if (step !== "input") return;
    setTab(newTab);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <VendorAuthHeader menuItems={[
        { label: t('vendorLoginLink'), href: '/vendor/login' },
        { label: t('vendorSupport'), href: 'https://t.me/topla_admin', external: true },
      ]} />

      <div className="flex-1 flex items-center justify-center px-4 py-8 pt-14">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold text-gray-900">{t("vendorResetTitle")}</h1>

          {error && (
            <div className="mt-4 rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Tab selector (only on input step) */}
          {step === "input" && (
            <div className="mt-5 flex rounded-full bg-gray-100 p-1">
              <button
                type="button"
                className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
                  tab === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
                onClick={() => handleTabChange("phone")}
              >
                {t("vendorPhoneTab")}
              </button>
              <button
                type="button"
                className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
                  tab === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
                onClick={() => handleTabChange("email")}
              >
                {t("vendorEmailTab")}
              </button>
            </div>
          )}

          {/* ===== STEP 1: INPUT ===== */}
          {step === "input" && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-gray-500">
                {tab === "phone" ? t("vendorResetPhoneDesc") : t("vendorResetEmailDesc")}
              </p>

              {tab === "phone" ? (
                <input
                  ref={phoneRef}
                  className="h-14 w-full rounded-full border-0 bg-gray-100 px-5 text-base outline-none"
                  placeholder={t("vendorPhonePlaceholder")}
                  value={phone}
                  onChange={handlePhoneChange}
                  onFocus={() => requestAnimationFrame(() => phoneRef.current && enforcePhoneCursor(phoneRef.current))}
                  onClick={() => phoneRef.current && enforcePhoneCursor(phoneRef.current)}
                  onKeyDown={(e) => {
                    const pos = (e.target as HTMLInputElement).selectionStart ?? 0;
                    if ((e.key === "Backspace" || e.key === "Delete") && pos <= PHONE_PREFIX.length) e.preventDefault();
                  }}
                  inputMode="tel"
                />
              ) : (
                <input
                  className="h-14 w-full rounded-full border-0 bg-gray-100 px-5 text-base outline-none"
                  placeholder={t("vendorEmailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoFocus
                />
              )}

              <button
                type="button"
                className="h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                onClick={handleSendCode}
                disabled={isLoading}
              >
                {isLoading ? t("vendorSending") : t("vendorResetSend")}
              </button>
            </div>
          )}

          {/* ===== STEP 2: CODE ===== */}
          {step === "code" && (
            <div className="mt-5 space-y-5">
              <p className="text-sm text-gray-500">
                {tab === "phone"
                  ? t("vendorResetSmsSent").replace("{phone}", normalizePhone(phone).replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, "+$1 $2 $3 $4 $5"))
                  : t("vendorResetEmailSent").replace("{email}", email)}
              </p>

              {tab === "phone" ? (
                <div className="flex justify-between gap-2">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      maxLength={1}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="h-14 w-12 rounded-xl border-0 bg-gray-100 text-center text-2xl font-semibold outline-none"
                    />
                  ))}
                </div>
              ) : (
                <input
                  className="h-14 w-full rounded-full border-0 bg-gray-100 px-5 text-center text-lg tracking-widest outline-none"
                  placeholder={t("vendorResetCodePlaceholder")}
                  value={emailToken}
                  onChange={(e) => setEmailToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                />
              )}

              <button
                type="button"
                className="h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                onClick={goToNewPass}
                disabled={isLoading || (tab === "phone" ? otpValue.length < OTP_LENGTH : emailToken.length < 4)}
              >
                {t("vendorContinue")}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => { setStep("input"); setError(null); }}
                >
                  {t("vendorBack")}
                </button>
                <button
                  type="button"
                  className="text-blue-600 hover:underline disabled:text-gray-400"
                  disabled={countdown > 0 || isLoading}
                  onClick={handleSendCode}
                >
                  {countdown > 0 ? `${t("vendorResendIn")} ${countdown}s` : t("vendorResendCode")}
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: NEW PASSWORD ===== */}
          {step === "newpass" && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-gray-500">{t("vendorResetNewPassDesc")}</p>

              <div className="relative">
                <input
                  className="h-14 w-full rounded-full border-0 bg-gray-100 px-5 pr-12 text-base outline-none"
                  placeholder={t("vendorNewPassword")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoFocus
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

              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 px-5 text-base outline-none"
                placeholder={t("vendorConfirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
              />

              {newPassword && (
                <p className={`text-xs ${newPassword.length >= 8 ? "text-green-600" : "text-gray-400"}`}>
                  {t("vendorPasswordMin8Hint")}
                </p>
              )}

              <button
                type="button"
                className="h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                onClick={handleConfirmReset}
                disabled={isLoading}
              >
                {isLoading ? t("vendorUpdating") : t("vendorUpdatePassword")}
              </button>

              <button
                type="button"
                className="w-full text-sm text-gray-500 hover:text-gray-700"
                onClick={() => { setStep("code"); setError(null); }}
              >
                {t("vendorBack")}
              </button>
            </div>
          )}

          {/* ===== SUCCESS ===== */}
          {step === "success" && (
            <div className="mt-8 text-center space-y-5">
              <div className="flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <p className="text-gray-600">{t("vendorResetSuccessDesc")}</p>
              <Link
                href="/vendor/login"
                className="inline-block h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 leading-[3rem] text-center"
              >
                {t("vendorGoToLogin")}
              </Link>
            </div>
          )}

          {step !== "success" && (
            <div className="mt-6 text-center">
              <Link href="/vendor/login" className="text-sm text-gray-500 hover:text-gray-700">
                {t("vendorBackToLogin")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
