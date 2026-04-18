"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  MapPin,
  Package,
  TrendingUp,
  Clock,
  Shield,
  Users,
  Wallet,
  Phone,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Headphones,
  Star,
  Zap,
  Store,
  Heart,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { submitPickupApplication } from "@/lib/api/pickup";
import { useSupportPhone, useTelegramLink } from "@/hooks/useSettings";

/* ──────────────── FAQ ITEM ──────────────── */
function FAQItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        className="flex items-center justify-between w-full py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-sm pr-4">{item.q}</span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="text-sm text-muted-foreground pb-4 leading-relaxed">
          {item.a}
        </p>
      )}
    </div>
  );
}

/* ──────────────── DATA ──────────────── */
const benefits = [
  {
    icon: Wallet,
    title: "Barqaror daromad",
    desc: "Har bir topshirilgan buyurtma uchun komissiya oling. Oyiga o'rtacha 3-8 mln so'm",
    color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
  },
  {
    icon: Package,
    title: "Kam investitsiya",
    desc: "Katta ombor yoki maxsus jihozlar shart emas — 15-20 m² joy yetarli",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  },
  {
    icon: Users,
    title: "Yangi mijozlar oqimi",
    desc: "Buyurtma oluvchilar sizning do'koningizga keladi — qo'shimcha savdo imkoniyati",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  },
  {
    icon: Shield,
    title: "To'liq qo'llab-quvvatlash",
    desc: "Texnik yordam, o'quv materiallari va shaxsiy menejer bilan ishlaysiz",
    color: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  },
  {
    icon: Clock,
    title: "Moslashuvchan ish grafigi",
    desc: "O'zingiz qulay vaqtni tanlab ishlaysiz. Mavjud biznesingizga qo'shib oling",
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400",
  },
  {
    icon: TrendingUp,
    title: "O'sish imkoniyati",
    desc: "Birinchi punkt yaxshi ishlasa — ko'proq punktlar ochish va daromadni oshirish mumkin",
    color: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  },
];

const steps = [
  {
    icon: Store,
    title: "Arizangizni yuboring",
    desc: "Formani to'ldiring — ism, telefon, shahar va manzil. 2 daqiqa ketadi",
  },
  {
    icon: Phone,
    title: "Biz siz bilan bog'lanamiz",
    desc: "1-2 ish kunida menejerimiz qo'ng'iroq qilib, barcha tafsilotlarni tushuntiradi",
  },
  {
    icon: CheckCircle,
    title: "Punktni ochib ishlang",
    desc: "Shartnoma imzolab, tizimga kirasiz va buyurtmalar qabul qilishni boshlaysiz!",
  },
];

const requirements = [
  "Shahar markazida yoki turar-joy hududida 15+ m² joy",
  "Kuniga kamida 6 soat ishlash imkoniyati",
  "Smartfon yoki kompyuter (internet bilan)",
  "Buyurtmalarni saqlash uchun javon / tokcha",
];

const faqItems = [
  {
    q: "Topshirish punkti nima?",
    a: "Bu — TOPLA.UZ xaridorlari buyurtmalarini olib ketish uchun keladigan joy. Siz buyurtmalarni qabul qilasiz, saqlaysiz va xaridorga topshirasiz.",
  },
  {
    q: "Qancha investitsiya kerak?",
    a: "Deyarli hech narsa. Agar mavjud do'koningiz yoki bo'sh joyingiz bo'lsa — faqat javon va internet kerak. Biz boshqa hamma narsani ta'minlaymiz.",
  },
  {
    q: "Daromad qancha bo'ladi?",
    a: "Joyingiz va buyurtmalar soniga bog'liq. O'rtacha har bir buyurtma uchun 3,000-5,000 so'm komissiya. Oyiga 1000+ buyurtma bo'lsa, 3-5 mln so'm daromad.",
  },
  {
    q: "Ariza yuborgandan keyin qancha vaqt kutish kerak?",
    a: "1-2 ish kunida menejerimiz siz bilan bog'lanadi. Shartnoma imzolash va tizimga ulash 1-3 kun davom etadi.",
  },
  {
    q: "Mavjud do'konim bor. Punkt ochsam bo'ladimi?",
    a: "Albatta! Ko'pchilik hamkorlarimiz mavjud do'konlarida punkt ochgan. Bu xaridorlar oqimini oshiradi va qo'shimcha daromad keltiradi.",
  },
  {
    q: "Agar men punkt yopsam nima bo'ladi?",
    a: "Shartnomani istalgan vaqtda bekor qilishingiz mumkin. Aktiv buyurtmalarni boshqa punktga yo'naltiramiz.",
  },
];

const cities = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Namangan",
  "Andijon",
  "Farg'ona",
  "Nukus",
  "Qarshi",
  "Navoiy",
  "Jizzax",
  "Termiz",
  "Urganch",
  "Guliston",
  "Kokand",
  "Margilan",
  "Chirchiq",
  "Boshqa",
];

/* ──────────────── MAIN PAGE ──────────────── */
export default function PickupLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const supportPhone = useSupportPhone();
  const telegramLink = useTelegramLink();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "+998",
    city: "",
    address: "",
    areaSize: "",
    note: "",
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validatsiya
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      setFormError("Iltimos, to'liq ismingizni kiriting");
      return;
    }
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 12) {
      setFormError("Telefon raqam noto'g'ri formatda");
      return;
    }
    if (!formData.city) {
      setFormError("Shaharni tanlang");
      return;
    }
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      setFormError("Manzilni kiriting (kamida 5 belgi)");
      return;
    }

    try {
      setFormLoading(true);
      await submitPickupApplication({
        fullName: formData.fullName.trim(),
        phone: formData.phone,
        city: formData.city,
        address: formData.address.trim(),
        areaSize: formData.areaSize ? parseFloat(formData.areaSize) : undefined,
        note: formData.note.trim() || undefined,
      });
      setFormSuccess(true);
    } catch (err: any) {
      setFormError(err.message || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ━━━ NAVBAR ━━━ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/60 backdrop-blur-2xl border-b border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            : "bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center">
              <span className="text-base font-extrabold tracking-tight text-gray-900">
                TOPLA<span className="text-[#2563EB]">.UZ</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                asChild
              >
                <Link href="/pickup/login">Xodim kirish</Link>
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-xs"
                onClick={scrollToForm}
              >
                Ariza yuborish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ━━━ HERO ━━━ */}
      <section className="relative overflow-hidden pt-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2563EB]/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold mb-5 dark:bg-teal-950 dark:text-teal-400">
                <MapPin className="h-3.5 w-3.5" /> HAMKORLIK DASTURI
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                Topshirish punkti ochib,{" "}
                <span className="text-[#2563EB]">daromad oling!</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                TOPLA.UZ bilan hamkor bo&apos;ling — o&apos;z joyingizda
                buyurtmalar qabul qilib, barqaror daromad oling. Kam
                investitsiya, katta imkoniyat.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button
                  size="lg"
                  onClick={scrollToForm}
                  className="rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] shadow-lg shadow-blue-500/25 px-8"
                >
                  Ariza yuborish <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Bepul ro&apos;yxatdan o&apos;tish
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  1-2 kunda javob
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              {/* Pickup SVG illustration */}
              <svg
                viewBox="0 0 500 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto"
              >
                {/* Building */}
                <rect
                  x="130"
                  y="60"
                  width="240"
                  height="280"
                  rx="16"
                  fill="#F8FAFC"
                  stroke="#E2E8F0"
                  strokeWidth="2"
                />
                {/* Sign */}
                <rect x="175" y="80" width="150" height="40" rx="8" fill="#2563EB" />
                <text
                  x="250"
                  y="105"
                  fill="white"
                  fontSize="14"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  TOPLA PUNKT
                </text>
                {/* Shelves */}
                <rect x="155" y="140" width="190" height="4" rx="2" fill="#CBD5E1" />
                <rect x="165" y="120" width="30" height="20" rx="4" fill="#FCD34D" />
                <rect x="205" y="115" width="28" height="25" rx="4" fill="#FB923C" />
                <rect x="243" y="118" width="32" height="22" rx="4" fill="#A78BFA" />
                <rect x="285" y="122" width="26" height="18" rx="4" fill="#34D399" />
                <rect x="155" y="190" width="190" height="4" rx="2" fill="#CBD5E1" />
                <rect x="170" y="170" width="28" height="20" rx="4" fill="#60A5FA" />
                <rect x="210" y="168" width="25" height="22" rx="4" fill="#F472B6" />
                <rect x="248" y="172" width="30" height="18" rx="4" fill="#FBBF24" />
                <rect x="290" y="170" width="24" height="20" rx="4" fill="#2DD4BF" />
                {/* Counter */}
                <rect x="155" y="250" width="190" height="60" rx="8" fill="#E2E8F0" />
                <rect x="165" y="258" width="46" height="36" rx="4" fill="#DBEAFE" />
                {/* QR scanner */}
                <rect x="175" y="264" width="26" height="24" rx="2" fill="#2563EB" opacity="0.3" />
                <rect x="180" y="269" width="16" height="14" rx="1" fill="#2563EB" />
                {/* Person at counter */}
                <circle cx="310" cy="230" r="16" fill="#FDE68A" />
                <rect x="298" y="246" width="24" height="32" rx="6" fill="#2563EB" />
                {/* Floating stats */}
                <g>
                  <rect
                    x="20"
                    y="100"
                    width="90"
                    height="60"
                    rx="12"
                    fill="white"
                    filter="url(#pickupShadow)"
                  />
                  <text x="65" y="125" fontSize="16" fontWeight="700" fill="#2563EB" textAnchor="middle">
                    1200+
                  </text>
                  <text x="65" y="145" fontSize="9" fill="#64748B" textAnchor="middle">
                    buyurtma/oy
                  </text>
                </g>
                <g>
                  <rect
                    x="390"
                    y="80"
                    width="95"
                    height="55"
                    rx="12"
                    fill="white"
                    filter="url(#pickupShadow)"
                  />
                  <text x="437" y="105" fontSize="15" fontWeight="700" fill="#22C55E" textAnchor="middle">
                    5M so&apos;m
                  </text>
                  <text x="437" y="123" fontSize="9" fill="#64748B" textAnchor="middle">
                    oylik daromad
                  </text>
                </g>
                <g>
                  <rect
                    x="30"
                    y="260"
                    width="80"
                    height="55"
                    rx="12"
                    fill="white"
                    filter="url(#pickupShadow)"
                  />
                  <text x="70" y="283" fontSize="14" fontWeight="700" fill="#F59E0B" textAnchor="middle">
                    ⭐ 4.8
                  </text>
                  <text x="70" y="303" fontSize="9" fill="#64748B" textAnchor="middle">
                    Reyting
                  </text>
                </g>
                <defs>
                  <filter id="pickupShadow" x="-8" y="-4" width="120" height="90" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.08" />
                  </filter>
                </defs>
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ BENEFITS ━━━ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4 dark:bg-blue-950 dark:text-blue-400">
              <Star className="h-3.5 w-3.5" /> AFZALLIKLAR
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              Nima uchun{" "}
              <span className="text-[#2563EB]">TOPLA punkt?</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Hamkorlik dasturimiz bilan o&apos;z joyingizda ishlang va barqaror
              daromad oling
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full border-2 hover:border-[#2563EB]/20 hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div
                      className={`h-12 w-12 rounded-xl ${b.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <b.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {b.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section
        id="how-it-works"
        className="py-20 sm:py-28 bg-gradient-to-b from-[#F8FAFC] to-white dark:from-gray-900 dark:to-gray-950 scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-4 dark:bg-green-950 dark:text-green-400">
                <Zap className="h-3.5 w-3.5" /> 3 QADAM
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
                Qanday boshlash kerak?
              </h2>
              <p className="text-muted-foreground mb-10">
                3 oddiy qadam — va siz allaqachon hamkorsiz
              </p>

              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  className="flex gap-5 mb-8 last:mb-0"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-14 w-14 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                      <step.icon className="h-7 w-7" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-[#2563EB]/20 mt-2" />
                    )}
                  </div>
                  <div className="pb-8">
                    <div className="text-xs font-bold text-[#2563EB] mb-1">
                      {i + 1}-QADAM
                    </div>
                    <h3 className="text-lg font-bold mb-1.5">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}

              <Button
                size="lg"
                onClick={scrollToForm}
                className="rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] shadow-lg shadow-blue-500/25 px-8 mt-2"
              >
                Ariza yuborish <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="hidden lg:block"
            >
              <Card className="border-2 border-dashed border-[#2563EB]/20">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-[#2563EB]" />
                    Talablar
                  </h3>
                  <div className="space-y-4">
                    {requirements.map((req, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {req}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-4 bg-blue-50 rounded-xl dark:bg-blue-950/50">
                    <p className="text-sm text-[#2563EB] font-medium">
                      💡 Mavjud do&apos;koningiz bo&apos;lsa — ajoyib! Hech qanday
                      qo&apos;shimcha joy ijarasi kerak emas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ APPLICATION FORM ━━━ */}
      <section
        id="apply"
        ref={formRef}
        className="py-20 sm:py-28 scroll-mt-20"
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold mb-4 dark:bg-teal-950 dark:text-teal-400">
              <MapPin className="h-3.5 w-3.5" /> ARIZA
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              Hamkor bo&apos;ling!
            </h2>
            <p className="mt-3 text-muted-foreground">
              Formani to&apos;ldiring — biz tez orada siz bilan bog&apos;lanamiz
            </p>
          </motion.div>

          {formSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-2">
                    Arizangiz qabul qilindi!
                  </h3>
                  <p className="text-green-700 dark:text-green-500 text-sm">
                    1-2 ish kunida menejerimiz siz bilan bog&apos;lanadi.
                    Telefon raqamingizni kuzatib turing.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-2">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <Label htmlFor="fullName">
                        To&apos;liq ismingiz <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Ism Familiya"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="mt-1.5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">
                        Telefon raqam <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+998 90 123 45 67"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="mt-1.5"
                        type="tel"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">
                        Shahar <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="">Shaharni tanlang</option>
                        {cities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="address">
                        Manzil <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address"
                        placeholder="Ko'cha, uy raqami"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="mt-1.5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="areaSize">
                        Joy maydoni (m²){" "}
                        <span className="text-muted-foreground text-xs">
                          ixtiyoriy
                        </span>
                      </Label>
                      <Input
                        id="areaSize"
                        placeholder="Masalan: 20"
                        value={formData.areaSize}
                        onChange={(e) =>
                          setFormData({ ...formData, areaSize: e.target.value })
                        }
                        className="mt-1.5"
                        type="number"
                        min="1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="note">
                        Qo&apos;shimcha izoh{" "}
                        <span className="text-muted-foreground text-xs">
                          ixtiyoriy
                        </span>
                      </Label>
                      <textarea
                        id="note"
                        placeholder="Mavjud do'koningiz haqida, tajribangiz yoki savollaringiz..."
                        value={formData.note}
                        onChange={(e) =>
                          setFormData({ ...formData, note: e.target.value })
                        }
                        rows={3}
                        className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      />
                    </div>

                    {formError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                        {formError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      disabled={formLoading}
                      className="w-full rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] shadow-lg shadow-blue-500/25"
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Yuborilmoqda...
                        </>
                      ) : (
                        <>
                          Ariza yuborish{" "}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Ariza yuborish bilan siz ma&apos;lumotlaringizni qayta ishlashga
                      rozilik bildirasiz
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* ━━━ FAQ ━━━ */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-[#F8FAFC] to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold mb-4">
              <MessageCircle className="h-3.5 w-3.5" /> SAVOLLAR
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              Ko&apos;p beriladigan{" "}
              <span className="text-[#2563EB]">savollar</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-2">
              <CardContent className="p-6 sm:p-8">
                {faqItems.map((item, i) => (
                  <FAQItem key={i} item={item} />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ━━━ SUPPORT ━━━ */}
      <section className="py-10 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
                <Headphones className="h-6 w-6 text-[#2563EB]" />
              </div>
              <div>
                <h3 className="font-bold">Savollaringiz bormi?</h3>
                <p className="text-sm text-muted-foreground">
                  Qo&apos;llab-quvvatlash xizmati 24/7
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
                asChild
              >
                <a href={`tel:+${supportPhone.replace(/\D/g, '')}`}>
                  <Phone className="h-4 w-4" /> {supportPhone}
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
                asChild
              >
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Telegram
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-[#0F172A] py-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <span className="font-bold text-sm">
                TOPLA<span className="text-[#2563EB]">.UZ</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">
                Bosh sahifa
              </Link>
              <Link
                href="/pickup/login"
                className="hover:text-white transition-colors"
              >
                Xodim kirish
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              2026 TOPLA.UZ — Barcha huquqlar himoyalangan
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
