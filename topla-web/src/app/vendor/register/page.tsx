"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api/auth";
import { setToken } from "@/lib/api/client";
import {
  ShoppingBag,
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

const businessTypes = [
  { value: "individual", label: "Jismoniy shaxs" },
  { value: "sole_proprietor", label: "Yakka tartibdagi tadbirkor (YaTT)" },
  { value: "llc", label: "MChJ" },
];

export default function VendorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
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

  const validateStep1 = () => {
    if (!fullName.trim()) return "Ism-familiyangizni kiriting";
    if (!phone.trim()) return "Telefon raqamingizni kiriting";
    if (!email.trim()) return "Email manzilingizni kiriting";
    if (!password || password.length < 6) return "Parol kamida 6 belgidan iborat bo'lishi kerak";
    return null;
  };

  const validateStep2 = () => {
    if (!shopName.trim()) return "Do'kon nomini kiriting";
    if (!category) return "Kategoriyani tanlang";
    if (!city) return "Shaharni tanlang";
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
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        shopName: shopName.trim(),
        shopDescription: shopDescription.trim(),
        category,
        city,
        address: address.trim(),
        businessType,
        inn: inn.trim(),
      });

      if (response.token) {
        setToken(response.token);
      }
      setStep(4); // Success state
    } catch (err: any) {
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div>
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-10 pb-8">
              <div
                className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ariza qabul qilindi!</h2>
              <p className="text-muted-foreground mb-6">
                Arizangiz muvaffaqiyatli yuborildi. Adminlar tekshirib chiqqanidan so&apos;ng sizga xabar beramiz.
                Bu odatda 1-2 ish kunini oladi.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full rounded-full">
                  <Link href="/vendor/login">Kabinetga o&apos;tish</Link>
                </Button>
                <Button variant="outline" asChild className="w-full rounded-full">
                  <Link href="/">Bosh sahifaga qaytish</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TOPLA.UZ</span>
          </Link>
          <h1 className="text-2xl font-bold">Sotuvchi bo&apos;lish</h1>
          <p className="text-muted-foreground">Do&apos;koningizni ro&apos;yxatdan o&apos;tkazing</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { num: 1, label: "Shaxsiy", icon: User },
            { num: 2, label: "Do'kon", icon: Store },
            { num: 3, label: "Hujjatlar", icon: FileText },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.num ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <s.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{s.label}</span>
              </div>
              {i < 2 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-2 ${step > s.num ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Shaxsiy ma'lumotlar"}
              {step === 2 && "Do'kon ma'lumotlari"}
              {step === 3 && "Biznes ma'lumotlari"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Bog'lanish uchun ma'lumotlaringizni kiriting"}
              {step === 2 && "Do'koningiz haqida batafsil ma'lumot"}
              {step === 3 && "Yuridik ma'lumotlaringizni kiriting (ixtiyoriy)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <AnimatePresence mode="wait">
                {/* Step 1: Personal Info */}
                {step === 1 && (
                  <div
                    key="step1"
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Ism-familiya *</Label>
                      <Input
                        id="fullName"
                        placeholder="Abdullayev Jasur"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon raqam *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jasur@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Parol *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Kamida 6 belgi"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Shop Info */}
                {step === 2 && (
                  <div
                    key="step2"
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="shopName">Do&apos;kon nomi *</Label>
                      <Input
                        id="shopName"
                        placeholder="Masalan: TechStore"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shopDescription">Tavsif</Label>
                      <Textarea
                        id="shopDescription"
                        placeholder="Do'koningiz haqida qisqacha..."
                        value={shopDescription}
                        onChange={(e) => setShopDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Kategoriya *</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Shahar *</Label>
                        <Select value={city} onValueChange={setCity}>
                          <SelectTrigger>
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
                    <div className="space-y-2">
                      <Label htmlFor="address">Manzil</Label>
                      <Input
                        id="address"
                        placeholder="To'liq manzil"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Business Info */}
                {step === 3 && (
                  <div
                    key="step3"
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>Biznes turi</Label>
                      <Select value={businessType} onValueChange={setBusinessType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((bt) => (
                            <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inn">INN (ixtiyoriy)</Label>
                      <Input
                        id="inn"
                        placeholder="123456789"
                        value={inn}
                        onChange={(e) => setInn(e.target.value)}
                      />
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-2">Eslatma:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Hujjatlarni keyinroq ham yuklashingiz mumkin</li>
                        <li>Ariza administrator tomonidan tekshiriladi</li>
                        <li>Tasdiqlash 1-2 ish kunini oladi</li>
                      </ul>
                    </div>
                  </div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex justify-between mt-6">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={handleBack} className="rounded-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Orqaga
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" asChild className="rounded-full">
                    <Link href="/vendor/login">Kirish</Link>
                  </Button>
                )}

                {step < 3 ? (
                  <Button type="button" onClick={handleNext} className="rounded-full">
                    Keyingi
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading} className="rounded-full">
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

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Bosh sahifaga qaytish
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
