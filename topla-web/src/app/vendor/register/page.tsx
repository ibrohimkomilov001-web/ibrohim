"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import api from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { VendorAuthHeader } from "@/components/vendor/VendorAuthHeader";
import { useTranslation } from "@/store/locale-store";
import { useTelegramLink } from '@/hooks/useSettings';

const OTP_LENGTH = 5;
const PHONE_PREFIX = "+998 ";

const cityKeys = [
  { value: "Toshkent", key: "cityToshkent" },
  { value: "Samarqand", key: "citySamarqand" },
  { value: "Buxoro", key: "cityBuxoro" },
  { value: "Namangan", key: "cityNamangan" },
  { value: "Andijon", key: "cityAndijon" },
  { value: "Farg'ona", key: "cityFargona" },
  { value: "Nukus", key: "cityNukus" },
  { value: "Qarshi", key: "cityQarshi" },
  { value: "Jizzax", key: "cityJizzax" },
  { value: "Navoiy", key: "cityNavoiy" },
  { value: "Urganch", key: "cityUrganch" },
  { value: "Termiz", key: "cityTermiz" },
  { value: "Guliston", key: "cityGuliston" },
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

type Step = "personal" | "otp" | "business" | "shop";

export default function VendorRegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const { t, locale } = useTranslation();
  const telegramLink = useTelegramLink();

  const [step, setStep] = useState<Step>("personal");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Shaxsiy ma'lumotlar
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const phoneRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: OTP
  const [otpCode, setOtpCode] = useState(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(0);

  // Step 3: Biznes ma'lumotlari
  const [businessType, setBusinessType] = useState<"yatt" | "mchj" | "">("");
  const [inn, setInn] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [mfo, setMfo] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Step 4: Do'kon ma'lumotlari
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [city, setCity] = useState("");
  const [dynamicCategories, setDynamicCategories] = useState<{ id: string; nameUz: string }[]>([]);

  useEffect(() => {
    api.get<Array<{ id: string; name?: string; nameUz?: string }>>("/categories")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const cats = data
            .filter((item) => item.id && (item.nameUz || item.name))
            .map((item) => ({ id: item.id, nameUz: (item.nameUz || item.name) as string }));
          if (cats.length > 0) setDynamicCategories(cats);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const otpValue = useMemo(() => otpCode.join(""), [otpCode]);
  const maskedPhone = useMemo(() => maskPhone(normalizePhone(phone)), [phone]);

  // Slug generation from shop name (transliteration)
  const generateSlug = useCallback((text: string) => {
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h',
    };
    let result = text.toLowerCase().trim();
    for (const [key, val] of Object.entries(translitMap)) {
      result = result.replaceAll(key, val);
    }
    return result
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'shop';
  }, []);

  // Auto-generate slug when shopName changes (unless user manually edited slug)
  useEffect(() => {
    if (!slugManuallyEdited && shopName.trim()) {
      setSlug(generateSlug(shopName));
    }
  }, [shopName, slugManuallyEdited, generateSlug]);

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    const timer = setTimeout(async () => {
      try {
        const result = await authApi.checkAvailability({ slug });
        setSlugAvailable(result.slug?.available ?? null);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500);
    return () => { clearTimeout(timer); setSlugChecking(false); };
  }, [slug]);

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const el = event.target;
    const cursorPos = el.selectionStart ?? 0;

    // Count digits before cursor in the raw input
    const rawValue = el.value;
    let digitsBefore = 0;
    for (let i = 0; i < cursorPos && i < rawValue.length; i++) {
      if (/\d/.test(rawValue[i])) digitsBefore++;
    }
    // Don't let cursor go before country code (998 = 3 digits)
    if (digitsBefore < 3) digitsBefore = 3;

    const formatted = formatPhone(rawValue);
    setPhone(formatted);

    // Position cursor after the same number of digits in formatted string
    requestAnimationFrame(() => {
      if (phoneRef.current) {
        let count = 0;
        let newPos = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) count++;
          if (count >= digitsBefore) {
            newPos = i + 1;
            break;
          }
        }
        if (count < digitsBefore) newPos = formatted.length;
        phoneRef.current.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handlePhoneFocus = () => {
    requestAnimationFrame(() => {
      if (phoneRef.current) {
        const pos = phoneRef.current.selectionStart ?? 0;
        if (pos < PHONE_PREFIX.length) {
          phoneRef.current.setSelectionRange(PHONE_PREFIX.length, PHONE_PREFIX.length);
        }
      }
    });
  };

  const handlePhoneKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const el = event.target as HTMLInputElement;
    const pos = el.selectionStart ?? 0;
    if ((event.key === "Backspace" || event.key === "Delete") && pos <= PHONE_PREFIX.length) {
      event.preventDefault();
    }
  };

  // Step 1 → OTP
  const handleSendOtp = async () => {
    setError(null);

    if (!fullName.trim()) {
      setError(t("vendorEnterName"));
      return;
    }

    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length < 12) {
      setError(t("vendorFullPhone"));
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t("vendorEmailFormat"));
      return;
    }

    if (!password || password.length < 8) {
      setError(t("vendorPasswordMin8"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("vendorPasswordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      // Telefon/email bandligini tekshirish
      const checkData: { phone: string; email?: string } = { phone: phoneDigits };
      if (email.trim()) checkData.email = email.trim();
      const availability = await authApi.checkAvailability(checkData);
      if (availability.phone && !availability.phone.available) {
        setError(availability.phone.message || t("vendorPhoneTaken"));
        setIsLoading(false);
        return;
      }
      if (availability.email && !availability.email.available) {
        setError(availability.email.message || t("vendorEmailTaken"));
        setIsLoading(false);
        return;
      }

      await authApi.sendOtp({ phone: phoneDigits });
      setOtpCode(Array(OTP_LENGTH).fill(""));
      setStep("otp");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err: any) {
      toast.error(err.message || t("vendorSmsFailed"));
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

  // OTP → Business step (verify OTP first)
  const goToBusinessStep = async () => {
    setError(null);
    if (otpValue.length < OTP_LENGTH) {
      setError(t("vendorEnterCode"));
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/verify-otp", {
        phone: normalizePhone(phone),
        code: otpValue,
      });
      setStep("business");
    } catch (err: any) {
      setError(err.message || t("vendorInvalidCode"));
    } finally {
      setIsLoading(false);
    }
  };

  // Business → Shop step
  const goToShopStep = () => {
    setError(null);

    if (!businessType) {
      setError(t("vendorSelectBusinessType"));
      return;
    }

    const cleanInn = inn.replace(/\s/g, "");
    if (!cleanInn || !/^\d{9,12}$/.test(cleanInn)) {
      setError(t("vendorInnError"));
      return;
    }

    if (!termsAccepted) {
      setError(t("vendorAcceptTerms"));
      return;
    }

    setStep("shop");
  };

  // Final: Register
  const handleRegister = async () => {
    setError(null);

    if (!shopName.trim()) {
      setError(t("vendorEnterShopName"));
      return;
    }
    if (slug && slugAvailable === false) {
      setError(t("vendorSlugTaken"));
      return;
    }
    if (!categoryId) {
      setError(t("vendorSelectCategoryError"));
      return;
    }
    if (!city) {
      setError(t("vendorSelectCityError"));
      return;
    }

    setIsLoading(true);
    try {
      const selectedCat = dynamicCategories.find((c) => c.id === categoryId);
      await authApi.registerOtp({
        phone: normalizePhone(phone),
        code: otpValue,
        fullName: fullName.trim(),
        password,
        email: email.trim() || undefined,
        shopName: shopName.trim(),
        shopDescription: shopDescription.trim() || undefined,
        slug: slug.trim() || undefined,
        category: selectedCat?.nameUz,
        categoryId,
        city,
        businessType: businessType as "yatt" | "mchj",
        inn: inn.replace(/\s/g, ""),
        bankName: bankName.trim() || undefined,
        bankAccount: bankAccount.replace(/\s/g, "") || undefined,
        mfo: mfo.replace(/\s/g, "") || undefined,
        termsAccepted: true,
      });
      await refreshProfile();
      router.push("/vendor/dashboard");
    } catch (err: any) {
      toast.error(err.message || t("vendorRegisterError"));
    } finally {
      setIsLoading(false);
    }
  };

  const stepNumber = step === "personal" ? 1 : step === "otp" ? 2 : step === "business" ? 3 : 4;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <VendorAuthHeader menuItems={[
        { label: t('vendorLoginLink'), href: '/vendor/login' },
        { label: t('vendorSupport'), href: telegramLink, external: true },
      ]} />

      <div className="flex-1 flex items-center justify-center px-4 py-8 pt-14">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t("vendorCreateAccount")}</h1>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-2 flex-1 rounded-full ${s <= stepNumber ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`} style={{ width: 60 }} />
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ===== STEP 1: SHAXSIY MA'LUMOTLAR ===== */}
          {step === "personal" && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">{t("vendorPersonalInfo")}</h2>

              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none ring-0"
                placeholder={t("vendorNameInput")}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                enterKeyHint="next"
              />
              <input
                ref={phoneRef}
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none ring-0"
                placeholder={t("vendorPhonePlaceholder")}
                value={phone}
                onChange={handlePhoneChange}
                onFocus={handlePhoneFocus}
                onClick={handlePhoneFocus}
                onKeyDown={handlePhoneKeyDown}
                inputMode="tel"
                enterKeyHint="next"
              />
              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none ring-0"
                placeholder={t("vendorEmailOptional")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                enterKeyHint="next"
              />

              <div className="relative">
                <input
                  className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 pr-12 text-base outline-none ring-0"
                  placeholder={t("vendorCreatePassword")}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  enterKeyHint="next"
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

              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none ring-0"
                placeholder={t("vendorConfirmPassword")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                enterKeyHint="done"
              />

              {password && (
                <p className={`text-xs ${password.length >= 8 ? "text-green-600" : "text-gray-400"}`}>
                  {t("vendorPasswordMin8Hint")}
                </p>
              )}

              <button
                type="button"
                className="h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                onClick={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? t("vendorSending") : t("vendorContinue")}
              </button>
            </div>
          )}

          {/* ===== STEP 2: OTP TASDIQLASH ===== */}
          {step === "otp" && (
            <div className="mt-6 space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t("vendorVerificationCode")}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("vendorCodeSentSms").replace("{phone}", maskedPhone)}
                </p>
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
                    autoComplete="one-time-code"
                    className="h-14 w-12 rounded-xl border-0 bg-gray-100 dark:bg-gray-900 dark:text-white text-center text-2xl font-semibold outline-none"
                  />
                ))}
              </div>

              <button
                type="button"
                className="h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                onClick={goToBusinessStep}
                disabled={isLoading || otpValue.length < OTP_LENGTH}
              >
                {t("vendorConfirm")}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => setStep("personal")}
                >
                  {t("vendorBack")}
                </button>
                <button
                  type="button"
                  className="text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400"
                  disabled={countdown > 0 || isLoading}
                  onClick={handleSendOtp}
                >
                  {countdown > 0 ? `${t("vendorResendIn")} ${countdown}s` : t("vendorResendCode")}
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: BIZNES MA'LUMOTLARI ===== */}
          {step === "business" && (
            <div className="mt-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t("vendorBusinessInfo")}</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("vendorBusinessType")}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className={`flex-1 h-12 rounded-full border-2 text-sm font-medium transition ${
                      businessType === "yatt"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                    }`}
                    onClick={() => setBusinessType("yatt")}
                  >
                    YaTT
                  </button>
                  <button
                    type="button"
                    className={`flex-1 h-12 rounded-full border-2 text-sm font-medium transition ${
                      businessType === "mchj"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                    }`}
                    onClick={() => setBusinessType("mchj")}
                  >
                    MCHJ
                  </button>
                </div>
              </div>

              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none"
                placeholder={t("vendorInnPlaceholder")}
                value={inn}
                onChange={(event) => setInn(event.target.value.replace(/[^\d\s]/g, ""))}
                inputMode="numeric"
                enterKeyHint="next"
              />

              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none"
                placeholder={t("vendorBankName")}
                value={bankName}
                onChange={(event) => setBankName(event.target.value)}
                enterKeyHint="next"
              />

              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none"
                placeholder={t("vendorBankAccount")}
                value={bankAccount}
                onChange={(event) => setBankAccount(event.target.value.replace(/[^\d\s]/g, ""))}
                inputMode="numeric"
                enterKeyHint="next"
              />

              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none"
                placeholder={t("vendorMfo")}
                value={mfo}
                onChange={(event) => setMfo(event.target.value.replace(/[^\d]/g, "").slice(0, 5))}
                inputMode="numeric"
                enterKeyHint="done"
              />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 leading-5">
                  {t("vendorAcceptOferta")}{" "}
                  <Link href="/vendor/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {t("vendorTermsLink")}
                  </Link>{" "}
                  {locale === 'ru' ? 'и' : 'va'}{" "}
                  <Link href="/vendor/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {t("vendorPrivacyLink")}
                  </Link>{" "}
                  {t("vendorAgreeEnd")}
                </span>
              </label>

              <button
                type="button"
                className="h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                onClick={goToShopStep}
              >
                {t("vendorContinue")}
              </button>

              <button
                type="button"
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => setStep("otp")}
              >
                {t("vendorBack")}
              </button>
            </div>
          )}

          {/* ===== STEP 4: DO'KON MA'LUMOTLARI ===== */}
          {step === "shop" && (
            <div className="mt-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t("vendorShopDetails")}</h2>

              <input
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none"
                placeholder={t("vendorShopName")}
                value={shopName}
                onChange={(event) => setShopName(event.target.value)}
                enterKeyHint="next"
              />

              <textarea
                className="min-h-[96px] w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-4 py-3 text-base outline-none"
                placeholder={t("vendorShopDescription")}
                value={shopDescription}
                onChange={(event) => setShopDescription(event.target.value)}
              />

              {/* Slug (sahifa manzili) */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t("vendorShopSlug")}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">topla.uz/</span>
                  <input
                    className={`h-14 w-full rounded-full border-2 bg-gray-100 pl-[85px] pr-10 text-base outline-none ${
                      slugAvailable === true ? 'border-green-400' : slugAvailable === false ? 'border-red-400' : 'border-transparent'
                    }`}
                    placeholder="my-shop"
                    value={slug}
                    onChange={(event) => {
                      const val = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
                      setSlug(val);
                      setSlugManuallyEdited(true);
                    }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    {slugChecking ? (
                      <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75"/></svg>
                    ) : slugAvailable === true ? (
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    ) : slugAvailable === false ? (
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    ) : null}
                  </span>
                </div>
                {slugAvailable === false && (
                  <p className="mt-1 text-xs text-red-500">{t("vendorSlugTaken")}</p>
                )}
                {slugAvailable === true && slug && (
                  <p className="mt-1 text-xs text-green-600">{t("vendorSlugAvailable")}</p>
                )}
              </div>

              <select
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">{t("vendorSelectCategory")}</option>
                {dynamicCategories.map((item) => (
                  <option key={item.id} value={item.id}>{item.nameUz}</option>
                ))}
              </select>

              <select
                className="h-14 w-full rounded-full border-0 bg-gray-100 dark:bg-gray-900 dark:text-white px-5 text-base outline-none"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              >
                <option value="">{t("vendorSelectCity")}</option>
                {cityKeys.map((item) => (
                  <option key={item.value} value={item.value}>{t(item.key)}</option>
                ))}
              </select>

              <button
                type="button"
                className="h-12 w-full rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                onClick={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? t("vendorSending") : t("vendorOpenShop")}
              </button>

              <button
                type="button"
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => setStep("business")}
              >
                {t("vendorBack")}
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("vendorHasAccount")}{" "}
            <Link href="/vendor/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              {t("vendorLoginLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
