"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";

const OTP_LENGTH = 5;

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

type LoginTab = "phone" | "email";

export default function VendorLoginPage() {
  const router = useRouter();
  const { loginWithOtp } = useAuth();

  const [tab, setTab] = useState<LoginTab>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState("+998 ");
  const [email, setEmail] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [loginPhone, setLoginPhone] = useState<string>("");

  const otpValue = useMemo(() => otpCode.join(""), [otpCode]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const resetOtpState = () => {
    setOtpSent(false);
    setOtpCode(Array(OTP_LENGTH).fill(""));
    setCountdown(0);
    setError(null);
    setMaskedPhone(null);
    setLoginPhone("");
  };

  const switchTab = (nextTab: LoginTab) => {
    if (tab === nextTab) return;
    setTab(nextTab);
    resetOtpState();
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(event.target.value));
    if (otpSent && tab === "phone") {
      resetOtpState();
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (tab === "phone") {
        const phoneDigits = normalizePhone(phone);
        if (phoneDigits.length < 12) {
          setError("Telefon raqamni to'liq kiriting");
          setIsLoading(false);
          return;
        }

        await authApi.sendOtp({ phone: phoneDigits });
        setMaskedPhone(formatPhone(phoneDigits));
        setLoginPhone(phoneDigits);
      } else {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
          setError("Emailni kiriting");
          setIsLoading(false);
          return;
        }

        const result = await authApi.sendOtpByEmail({ email: trimmedEmail });
        setMaskedPhone(result.maskedPhone);
        setLoginPhone(result.phone);
      }

      setOtpCode(Array(OTP_LENGTH).fill(""));
      setOtpSent(true);
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err: any) {
      setError(err.message || "Kod yuborib bo'lmadi");
    } finally {
      setIsLoading(false);
    }
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
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setOtpCode(next);
    const focusIndex = Math.min(pasted.length - 1, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  }, []);

  const handleLogin = async () => {
    setError(null);
    if (!otpSent) {
      setError("Avval kod yuboring");
      return;
    }

    if (otpValue.length < OTP_LENGTH) {
      setError("5 xonali kodni kiriting");
      return;
    }

    if (!loginPhone) {
      setError("Telefon raqam topilmadi. Kodni qayta yuboring");
      return;
    }

    setIsLoading(true);
    try {
      await loginWithOtp(loginPhone, otpValue);
      router.push("/vendor/dashboard");
    } catch (err: any) {
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (otpSent && otpValue.length === OTP_LENGTH && !isLoading) {
      handleLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue]);

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold text-gray-900">Sotuvchi kabineti</h1>

        <div className="mt-6 flex border-b border-gray-200">
          <button
            type="button"
            className={`w-1/2 pb-3 text-center text-sm font-medium transition ${
              tab === "phone" ? "border-b-2 border-black text-black" : "text-gray-400"
            }`}
            onClick={() => switchTab("phone")}
          >
            Telefon raqam
          </button>
          <button
            type="button"
            className={`w-1/2 pb-3 text-center text-sm font-medium transition ${
              tab === "email" ? "border-b-2 border-black text-black" : "text-gray-400"
            }`}
            onClick={() => switchTab("email")}
          >
            Email
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {tab === "phone" ? (
            <input
              className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 text-base outline-none"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={handlePhoneChange}
              inputMode="tel"
            />
          ) : (
            <input
              className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 text-base outline-none"
              placeholder="Elektron pochta"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (otpSent) resetOtpState();
              }}
              type="email"
            />
          )}

          <button
            type="button"
            className="h-14 w-full rounded-full bg-blue-600 text-base font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            onClick={handleSendOtp}
            disabled={isLoading || countdown > 0}
          >
            {isLoading ? "Yuborilmoqda..." : countdown > 0 ? `Qayta yuborish ${countdown}s` : "Kod yuborish"}
          </button>

          {otpSent && (
            <>
              <p className="text-sm text-gray-500">
                Kod {maskedPhone || "raqam"} ga yuborildi
              </p>

              <div className="flex justify-between gap-2">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { otpRefs.current[index] = element; }}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    maxLength={1}
                    inputMode="numeric"
                    className="h-14 w-12 rounded-2xl border-0 bg-gray-100 text-center text-2xl font-semibold outline-none"
                  />
                ))}
              </div>

              <button
                type="button"
                className="h-14 w-full rounded-full bg-blue-600 text-base font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                onClick={handleLogin}
                disabled={isLoading || otpValue.length < OTP_LENGTH}
              >
                {isLoading ? "Kirish..." : "Kirish"}
              </button>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Do'koningiz yo'qmi?{" "}
          <Link href="/vendor/register" className="text-blue-600 hover:underline">
            Ro'yxatdan o'ting
          </Link>
        </p>
      </div>
    </div>
  );
}
