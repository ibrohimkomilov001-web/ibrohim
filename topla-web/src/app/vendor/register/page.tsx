"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import { authApi } from "@/lib/api/auth";
import { setToken } from "@/lib/api/client";
import api from "@/lib/api/client";
import {
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Store,
  User,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Globe,
  Building2,
  CreditCard,
  Landmark,
} from "lucide-react";

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

const categories = [
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

const fallbackCategories = categories;

const businessTypes = [
  { value: "individual", label: "Jismoniy shaxs" },
  { value: "sole_proprietor", label: "Yakka tartibdagi tadbirkor (YaTT)" },
  { value: "llc", label: "MChJ" },
];

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/** Transliterate shop name to URL-friendly slug */
function toSlug(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
    ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    ў: "o", қ: "q", ғ: "g", ҳ: "h",
  };
  let result = text.toLowerCase().trim();
  for (const [key, val] of Object.entries(map)) {
    result = result.replaceAll(key, val);
  }
  return result
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "shop";
}

export default function VendorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(fallbackCategories);

  useEffect(() => {
    api.get<any[]>("/categories")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDynamicCategories(data.map((c: any) => c.nameUz || c.name).filter(Boolean));
        }
      })
      .catch(() => {});
  }, []);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Shop Info
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Step 3: Business Info
  const [businessType, setBusinessType] = useState("");
  const [inn, setInn] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [mfo, setMfo] = useState("");

  // Slug preview
  const slugPreview = useMemo(() => toSlug(shopName), [shopName]);

  const formatPhone = (value: string) => {
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
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const formatInn = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 12);
  };

  const formatBankAccount = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 20);
    // Format: XXXX XXXX XXXX XXXX XXXX
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatMfo = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 5);
  };

  const validateStep1 = () => {
    if (!fullName.trim()) return "Ism-familiyangizni kiriting";
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 12) return "Telefon raqamni to'liq kiriting";
    if (!email.trim()) return "Email manzilingizni kiriting";
    if (!password || password.length < 6)
      return "Parol kamida 6 belgidan iborat bo'lishi kerak";
    return null;
  };

  const validateStep2 = () => {
    if (!shopName.trim()) return "Do'kon nomini kiriting";
    if (!category) return "Kategoriyani tanlang";
    if (!city) return "Shaharni tanlang";
    return null;
  };

  const validateStep3 = () => {
    // INN format validation (if provided)
    if (inn) {
      const innDigits = inn.replace(/\s/g, "");
      if (!/^\d{9,12}$/.test(innDigits)) {
        return "INN 9 yoki 12 ta raqamdan iborat bo'lishi kerak";
      }
    }
    // Bank account validation (if provided)
    if (bankAccount) {
      const accountDigits = bankAccount.replace(/\s/g, "");
      if (!/^\d{20}$/.test(accountDigits)) {
        return "Hisob raqam 20 ta raqamdan iborat bo'lishi kerak";
      }
    }
    // MFO validation (if provided)
    if (mfo) {
      const mfoDigits = mfo.replace(/\s/g, "");
      if (!/^\d{5}$/.test(mfoDigits)) {
        return "MFO 5 ta raqamdan iborat bo'lishi kerak";
      }
    }
    // If bank account provided, bank name is needed
    if (bankAccount && !bankName.trim()) {
      return "Bank nomini kiriting";
    }
    return null;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate step 3
    const step3Err = validateStep3();
    if (step3Err) { setError(step3Err); return; }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        shopName: shopName.trim(),
        shopDescription: shopDescription.trim(),
        shopPhone: phone.trim(),
        shopAddress: address.trim(),
        category,
        city,
        businessType,
        inn: inn.replace(/\s/g, ""),
        bankName: bankName.trim() || undefined,
        bankAccount: bankAccount.replace(/\s/g, "") || undefined,
        mfo: mfo.replace(/\s/g, "") || undefined,
      });

      if (response.token) {
        setToken(response.token);
      }
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== SUCCESS STATE ====================
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl shadow-emerald-500/10 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />
            <CardContent className="pt-10 pb-8 px-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 text-center">
                Ariza qabul qilindi!
              </h2>
              <p className="text-muted-foreground text-center mb-6 leading-relaxed">
                Arizangiz muvaffaqiyatli yuborildi. Adminlar tekshirib
                chiqqanidan so&apos;ng sizga xabar beramiz.
              </p>

              {/* Shop URL preview */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                <p className="text-sm text-slate-600 truncate">
                  topla.uz/shop/<span className="font-semibold text-primary">{slugPreview}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-6">
                <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Tasdiqlash 1-2 ish kunini oladi
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all font-semibold"
                >
                  <Link href="/vendor/login">Kabinetga o&apos;tish</Link>
                </Button>
                <Button
                  variant="ghost"
                  asChild
                  className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <Link href="/">← Bosh sahifaga qaytish</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ==================== MAIN FORM ====================
  const stepInfo = [
    { num: 1, label: "Shaxsiy", icon: User, title: "Shaxsiy ma\u2018lumotlar", desc: "Bog\u2018lanish uchun ma\u2018lumotlaringiz" },
    { num: 2, label: "Do\u2018kon", icon: Store, title: "Do\u2018kon ma\u2018lumotlari", desc: "Do\u2018koningiz haqida batafsil" },
    { num: 3, label: "Biznes", icon: Building2, title: "Biznes ma\u2018lumotlari", desc: "Yuridik va bank rekvizitlari" },
  ];

  const currentStep = stepInfo[step - 1];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Sotuvchi bo&apos;lish
          </h1>
          <p className="text-muted-foreground mt-1.5">
            {step} / 3 — {currentStep.title}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-3">
            {stepInfo.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center relative z-10 w-16">
                  <motion.div
                    animate={{ scale: step === s.num ? 1.1 : 1 }}
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step > s.num
                        ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-md shadow-emerald-500/30"
                        : step === s.num
                        ? "bg-gradient-to-br from-primary to-primary/90 text-white shadow-lg shadow-primary/30 ring-4 ring-primary/10"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step > s.num ? <CheckCircle className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
                  </motion.div>
                  <span className={`text-xs mt-1.5 font-medium transition-colors ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className="w-16 sm:w-24 mx-1 mt-[-18px]">
                    <div className="h-[3px] rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{ width: step > s.num ? "100%" : "0%" }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">{currentStep.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{currentStep.desc}</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert variant="destructive" className="mb-5 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {/* ==================== STEP 1: Personal ==================== */}
                {step === 1 && (
                  <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Ism-familiya <span className="text-red-500">*</span>
                      </Label>
                      <Input id="fullName" placeholder="Abdullayev Jasur" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-[16px]" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Telefon raqam <span className="text-red-500">*</span>
                      </Label>
                      <Input id="phone" type="tel" placeholder="+998 90 123 45 67" value={phone} onChange={handlePhoneChange} className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-[16px]" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input id="email" type="email" placeholder="jasur@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-[16px]" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Parol <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="Kamida 6 belgi" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 pr-11 text-[16px]" required />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Kamida 6 belgi bo&apos;lishi kerak</p>
                    </div>
                  </motion.div>
                )}

                {/* ==================== STEP 2: Shop ==================== */}
                {step === 2 && (
                  <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="shopName" className="text-sm font-medium">
                        Do&apos;kon nomi <span className="text-red-500">*</span>
                      </Label>
                      <Input id="shopName" placeholder="Masalan: TechStore" value={shopName} onChange={(e) => setShopName(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-[16px]" required />
                      {/* Slug preview */}
                      {shopName.trim().length >= 2 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg mt-1.5"
                        >
                          <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <p className="text-xs text-slate-500">
                            topla.uz/shop/<span className="font-semibold text-primary">{slugPreview}</span>
                          </p>
                        </motion.div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="shopDescription" className="text-sm font-medium">
                        Tavsif <span className="text-xs text-muted-foreground font-normal">(ixtiyoriy)</span>
                      </Label>
                      <Textarea id="shopDescription" placeholder="Do'koningiz haqida qisqacha..." value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} rows={3} className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 resize-none text-[16px]" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                          Kategoriya <span className="text-red-500">*</span>
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="h-11 rounded-xl border-slate-200 text-[16px]">
                            <SelectValue placeholder="Tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {dynamicCategories.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                          Shahar <span className="text-red-500">*</span>
                        </Label>
                        <Select value={city} onValueChange={setCity}>
                          <SelectTrigger className="h-11 rounded-xl border-slate-200 text-[16px]">
                            <SelectValue placeholder="Tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Manzil <span className="text-xs text-muted-foreground font-normal">(ixtiyoriy)</span>
                      </Label>
                      <Input id="address" placeholder="To'liq manzil" value={address} onChange={(e) => setAddress(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-[16px]" />
                    </div>
                  </motion.div>
                )}

                {/* ==================== STEP 3: Business ==================== */}
                {step === 3 && (
                  <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Biznes turi</Label>
                      <Select value={businessType} onValueChange={setBusinessType}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 text-[16px]">
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((bt) => (
                            <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="inn" className="text-sm font-medium">
                        INN (STIR) <span className="text-xs text-muted-foreground font-normal">(ixtiyoriy)</span>
                      </Label>
                      <Input
                        id="inn"
                        placeholder="123456789"
                        value={inn}
                        onChange={(e) => setInn(formatInn(e.target.value))}
                        className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-[16px]"
                        inputMode="numeric"
                      />
                      <p className="text-xs text-muted-foreground">9 yoki 12 ta raqam</p>
                    </div>

                    {/* Bank rekvizitlari */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Landmark className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Bank rekvizitlari</span>
                        <span className="text-xs text-muted-foreground font-normal">(ixtiyoriy)</span>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="bankName" className="text-sm font-medium">Bank nomi</Label>
                          <Input
                            id="bankName"
                            placeholder="Masalan: Kapitalbank"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-[16px]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="bankAccount" className="text-sm font-medium">
                            Hisob raqam (h/r)
                          </Label>
                          <Input
                            id="bankAccount"
                            placeholder="2020 8000 1234 5678 9012"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(formatBankAccount(e.target.value))}
                            className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-[16px] font-mono"
                            inputMode="numeric"
                          />
                          <p className="text-xs text-muted-foreground">20 ta raqam</p>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="mfo" className="text-sm font-medium">MFO</Label>
                          <Input
                            id="mfo"
                            placeholder="00084"
                            value={mfo}
                            onChange={(e) => setMfo(formatMfo(e.target.value))}
                            className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-[16px] font-mono"
                            inputMode="numeric"
                          />
                          <p className="text-xs text-muted-foreground">5 ta raqam</p>
                        </div>
                      </div>
                    </div>

                    {/* Info cards */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3 p-3.5 bg-blue-50/80 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                        <Shield className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Ma&apos;lumotlaringiz xavfsiz</p>
                          <p className="text-xs text-blue-600 mt-0.5">Bank rekvizitlarini keyinroq ham kiritishingiz mumkin</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                        <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Tez tasdiqlash</p>
                          <p className="text-xs text-amber-600 mt-0.5">Ariza 1-2 ish kunida ko&apos;rib chiqiladi</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                {step > 1 ? (
                  <Button type="button" variant="ghost" onClick={handleBack} className="h-11 px-5 rounded-xl text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Orqaga
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button type="button" onClick={handleNext} className="h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all font-medium">
                    Keyingi
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading} className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-medium">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        Ariza yuborish
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bottom links */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Allaqachon hisobingiz bormi?{" "}
            <Link href="/vendor/login" className="text-primary font-medium hover:underline">
              Kirish
            </Link>
          </p>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}
