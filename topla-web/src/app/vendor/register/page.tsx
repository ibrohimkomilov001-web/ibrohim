"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import api from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";

const OTP_LENGTH = 5;
const cities = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Namangan",
  "Andijon",
  "Farg'ona",
  "Nukus",
  "Qarshi",
  "Jizzax",
  "Navoiy",
  "Urganch",
  "Termiz",
  "Guliston",
];

const fallbackCategories = [
  "Elektronika",
  "Kiyim-kechak",
  "Oziq-ovqat",
  "Uy-ro'zg'or",
  "Go'zallik",
  "Bolalar uchun",
  "Sport",
  "Kitoblar",
  "Avtomobil",
  "Qurilish",
];

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

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 12) return phone;
  return `+${digits.slice(0, 3)} ${digits[3]}X *** **${digits.slice(-2)}`;
}

export default function VendorRegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [step, setStep] = useState<"info" | "otp" | "shop">("info");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [email, setEmail] = useState("");

  const [otpCode, setOtpCode] = useState(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(0);

  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(fallbackCategories);

  useEffect(() => {
    api.get<Array<{ name?: string; nameUz?: string }>>("/categories")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data
            .map((item) => item.nameUz || item.name)
            .filter((item): item is string => Boolean(item));
          if (names.length > 0) setDynamicCategories(names);
        }
      })
      .catch(() => {
        // fallbackCategories ishlatiladi
      });
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const otpValue = useMemo(() => otpCode.join(""), [otpCode]);
  const maskedPhone = useMemo(() => maskPhone(normalizePhone(phone)), [phone]);

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(event.target.value));
  };

  const handleSendOtp = async () => {
    setError(null);

    if (!fullName.trim()) {
      setError("Ismni kiriting");
      return;
    }

    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length < 12) {
      setError("Telefon raqamni to'liq kiriting");
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email formati noto'g'ri");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.sendOtp({ phone: phoneDigits });
      setOtpCode(Array(OTP_LENGTH).fill(""));
      setStep("otp");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err: any) {
      setError(err.message || "SMS yuborib bo'lmadi");
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

  const goToShopStep = () => {
    setError(null);
    if (otpValue.length < OTP_LENGTH) {
      setError("5 xonali kodni kiriting");
      return;
    }
    setStep("shop");
  };

  const handleRegister = async () => {
    setError(null);

    if (!shopName.trim()) {
      setError("Do'kon nomini kiriting");
      return;
    }
    if (!category) {
      setError("Kategoriyani tanlang");
      return;
    }
    if (!city) {
      setError("Shaharni tanlang");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.registerOtp({
        phone: normalizePhone(phone),
        code: otpValue,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        shopName: shopName.trim(),
        shopDescription: shopDescription.trim() || undefined,
        category,
        city,
      });
      await refreshProfile();
      router.push("/vendor/dashboard");
    } catch (err: any) {
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold text-gray-900">Akkaunt yaratish</h1>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "info" && (
          <div className="mt-6 space-y-4">
            <input
              className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 text-base outline-none ring-0"
              placeholder="Ism"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            <input
              className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 text-base outline-none ring-0"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={handlePhoneChange}
              inputMode="tel"
            />
            <input
              className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 text-base outline-none ring-0"
              placeholder="Elektron pochta (ixtiyoriy)"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
            />

            <button
              type="button"
              className="h-14 w-full rounded-full bg-blue-600 text-base font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              onClick={handleSendOtp}
              disabled={isLoading}
            >
              {isLoading ? "Yuborilmoqda..." : "Davom etish"}
            </button>

            <p className="pt-2 text-center text-sm leading-6 text-gray-500">
              Tugmani bosish orqali siz{" "}
              <Link href="/vendor/terms" className="text-blue-600 hover:underline">
                Oferta shartnomasi
              </Link>{" "}
              va{" "}
              <Link href="/vendor/privacy" className="text-blue-600 hover:underline">
                Maxfiylik siyosati
              </Link>{" "}
              ga rozilik bildirasiz.
            </p>
          </div>
        )}

        {step === "otp" && (
          <div className="mt-6 space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tasdiqlash kodi</h2>
              <p className="mt-1 text-sm text-gray-500">SMS kod {maskedPhone} raqamiga yuborildi</p>
            </div>

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
              onClick={goToShopStep}
              disabled={isLoading || otpValue.length < OTP_LENGTH}
            >
              Tasdiqlash
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setStep("info")}
              >
                Orqaga
              </button>
              <button
                type="button"
                className="text-blue-600 hover:underline disabled:text-gray-400"
                disabled={countdown > 0 || isLoading}
                onClick={handleSendOtp}
              >
                {countdown > 0 ? `Qayta yuborish ${countdown}s` : "Kodni qayta yuborish"}
              </button>
            </div>
          </div>
        )}

        {step === "shop" && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Do'kon ma'lumotlari</h2>

            <input
              className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 text-base outline-none"
              placeholder="Do'kon nomi"
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
            />

            <textarea
              className="min-h-[96px] w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-base outline-none"
              placeholder="Qisqacha tavsif (ixtiyoriy)"
              value={shopDescription}
              onChange={(event) => setShopDescription(event.target.value)}
            />

            <select
              className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 text-base outline-none"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Kategoriya tanlang</option>
              {dynamicCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select
              className="h-14 w-full rounded-2xl border-0 bg-gray-100 px-4 text-base outline-none"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              <option value="">Shahar tanlang</option>
              {cities.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <button
              type="button"
              className="h-14 w-full rounded-full bg-blue-600 text-base font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? "Yuborilmoqda..." : "Ariza yuborish"}
            </button>

            <button
              type="button"
              className="w-full text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setStep("otp")}
            >
              Orqaga
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          Akkauntingiz bormi?{" "}
          <Link href="/vendor/login" className="text-blue-600 hover:underline">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
}
