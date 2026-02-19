"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  BookOpen,
  Package,
  CreditCard,
  Truck,
  Settings,
  ShieldCheck,
  HelpCircle,
  Send,
} from "lucide-react";

const faqCategories = [
  {
    id: "general",
    icon: HelpCircle,
    label: "Umumiy",
    questions: [
      {
        q: "TOPLA nima va u qanday ishlaydi?",
        a: "TOPLA — bu O'zbekistondagi sotuvchilar uchun onlayn savdo platformasi. Siz do'koningizni ro'yxatdan o'tkazasiz, mahsulotlar qo'shasiz va mijozlarga yetkazib berasiz. Platform orqali buyurtmalarni boshqarish, to'lovlarni kuzatish va tahlillarni ko'rish mumkin.",
      },
      {
        q: "Platformada sotish uchun komissiya qancha?",
        a: "Komissiya kategoriyaga qarab 5% dan 10% gacha bo'ladi. Elektronika uchun 5%, oziq-ovqat uchun 8%, boshqa tovarlar uchun 10%. Komissiya faqat sotilgan buyurtmalardan olinadi — hech qanday oylik to'lov yo'q.",
      },
      {
        q: "Do'konimni qanday ro'yxatdan o'tkazaman?",
        a: '1) /vendor/register sahifasiga o\'ting. 2) Shaxsiy ma\'lumotlaringizni kiriting. 3) Do\'kon ma\'lumotlarini to\'ldiring. 4) Biznes hujjatlarini yuklang. 5) Tekshiruvdan o\'tganingizdan so\'ng darhol sotishni boshlaysiz.',
      },
    ],
  },
  {
    id: "products",
    icon: Package,
    label: "Mahsulotlar",
    questions: [
      {
        q: "Mahsulot qanday qo'shiladi?",
        a: "Boshqaruv panelida 'Mahsulotlar' bo'limiga o'ting, 'Yangi mahsulot' tugmasini bosing. Nomi, tavsifi, narxi, kategoriyasi va rasmlarini kiriting. 'Saqlash' tugmasini bossangiz, mahsulot darhol platformada paydo bo'ladi.",
      },
      {
        q: "Nechta rasm yuklash mumkin?",
        a: "Har bir mahsulotga 10 tagacha rasm yuklashingiz mumkin. Birinchi rasm asosiy rasm sifatida ko'rsatiladi. Rasmlar kamida 800x800 piksel bo'lishi tavsiya etiladi.",
      },
      {
        q: "Mahsulotni vaqtincha o'chirish mumkinmi?",
        a: "Ha, mahsulotlar ro'yxatida mahsulot yonidagi menyu tugmasini bosib, 'Faolsizlantirish' ni tanlang. Mahsulot o'chirilmaydi, lekin platforma'da ko'rinmay qoladi. Istalgan vaqtda qayta faollashtirish mumkin.",
      },
    ],
  },
  {
    id: "orders",
    icon: Truck,
    label: "Buyurtmalar",
    questions: [
      {
        q: "Buyurtma holati qanday yangilanadi?",
        a: "Buyurtmalar sahifasida har bir buyurtma yonida holat tugmalari mavjud. Buyurtma qabul qilinganida 'Tasdiqlash', tayyorlanganda 'Tayyorlanmoqda', jo'natilganda 'Jo'natildi' tugmasini bosing.",
      },
      {
        q: "Buyurtmani bekor qilish mumkinmi?",
        a: "Faqat 'kutilmoqda' holatidagi buyurtmalarni bekor qilish mumkin. Tasdiqlangan buyurtmalarni bekor qilish uchun mijozlar xizmatiga murojaat qiling.",
      },
      {
        q: "FBS va DBS nima?",
        a: "FBS (Fulfillment by Seller) — mahsulotni o'zingiz saqlaysiz, TOPLA yetkazib beradi. DBS (Delivery by Seller) — mahsulotni o'zingiz saqlaysiz va o'zingiz yetkazasiz. Sozlamalar sahifasida o'zingizga qulay modelni tanlang.",
      },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    label: "To'lovlar",
    questions: [
      {
        q: "Pul qachon hisobimga tushadi?",
        a: "Buyurtma yetkazib berilganidan so'ng, mablag' 1-3 ish kuni ichida sizning balans hisobingizga tushadi. Balans sahifasidan istalgan vaqtda pul yechib olish so'rovini yuborishingiz mumkin.",
      },
      {
        q: "Minimal pul yechib olish summasi qancha?",
        a: "Minimal summa 50,000 so'm. Mablag' 1-2 ish kuni ichida bank kartangizga o'tkaziladi.",
      },
      {
        q: "Komissiyalar qanday hisoblanadi?",
        a: "Komissiya faqat muvaffaqiyatli yetkazilgan buyurtmalardan olinadi. Bekor qilingan yoki qaytarilgan buyurtmalar uchun komissiya olinmaydi.",
      },
    ],
  },
  {
    id: "verification",
    icon: ShieldCheck,
    label: "Tekshiruv",
    questions: [
      {
        q: "Qanday hujjatlarni yuklash kerak?",
        a: "1) Pasport nusxasi (shaxsni tasdiqlash uchun), 2) INN guvohnomasi, 3) Litsenziya (agar kerak bo'lsa). Hujjatlar PDF yoki rasm formatida bo'lishi mumkin.",
      },
      {
        q: "Tekshiruv qancha vaqt oladi?",
        a: "Hujjatlar odatda 1-2 ish kuni ichida tekshiriladi. Natija haqida bildirishnoma olasiz. Agar rad etilsa, sababi ko'rsatiladi va qayta yuklash imkoniyati beriladi.",
      },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    label: "Sozlamalar",
    questions: [
      {
        q: "Do'kon logotipini qanday o'zgartiraman?",
        a: "Sozlamalar sahifasida 'Brending' bo'limida logotip ustiga bosing va yangi rasm yuklang. Logotip 200x200 pikseldan katta bo'lishi tavsiya etiladi.",
      },
      {
        q: "Yetkazib berish narxini qanday sozlayman?",
        a: "Sozlamalar sahifasida 'Yetkazib berish' bo'limida yetkazib berish narxini, minimal buyurtma summasini va bepul yetkazib berish chegarasini belgilang.",
      },
    ],
  },
];

const contactChannels = [
  {
    icon: Send,
    label: "Telegram",
    value: "@topla_support",
    href: "https://t.me/topla_support",
    description: "Tezkor javob — kunlik 9:00 dan 22:00 gacha",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Phone,
    label: "Telefon",
    value: "+998 90 123 45 67",
    href: "tel:+998901234567",
    description: "Dushanba — Shanba, 9:00 — 18:00",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: Mail,
    label: "Email",
    value: "support@topla.uz",
    href: "mailto:support@topla.uz",
    description: "Javob 24 soat ichida",
    color: "bg-orange-500/10 text-orange-600",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>("general");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filtered = searchQuery.trim()
    ? faqCategories
        .map((cat) => ({
          ...cat,
          questions: cat.questions.filter(
            (q) =>
              q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              q.a.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.questions.length > 0)
    : faqCategories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Yordam markazi</h1>
        <p className="text-muted-foreground">
          Savollar, qo&apos;llanmalar va bog&apos;lanish
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Savol qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-full"
        />
      </div>

      {/* Contact Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {contactChannels.map((channel) => (
          <div key={channel.label}>
            <a href={channel.href} target="_blank" rel="noopener noreferrer">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className={`inline-flex rounded-xl p-2.5 mb-3 ${channel.color}`}>
                    <channel.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{channel.label}</h3>
                  <p className="text-sm font-medium text-primary">{channel.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{channel.description}</p>
                </CardContent>
              </Card>
            </a>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Ko&apos;p beriladigan savollar</h2>

        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((cat) => (
              <Card key={cat.id}>
                <button
                  className="w-full px-6 py-4 flex items-center justify-between"
                  onClick={() =>
                    setOpenCategory(openCategory === cat.id ? null : cat.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    <cat.icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{cat.label}</span>
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {cat.questions.length}
                    </Badge>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openCategory === cat.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openCategory === cat.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 space-y-2">
                        {cat.questions.map((faq, idx) => {
                          const key = `${cat.id}-${idx}`;
                          return (
                            <div
                              key={key}
                              className="border rounded-xl overflow-hidden"
                            >
                              <button
                                className="w-full px-4 py-3 flex items-center justify-between text-left"
                                onClick={() =>
                                  setOpenQuestion(
                                    openQuestion === key ? null : key
                                  )
                                }
                              >
                                <span className="text-sm font-medium pr-4">{faq.q}</span>
                                <ChevronDown
                                  className={`h-3 w-3 shrink-0 transition-transform ${
                                    openQuestion === key ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              <AnimatePresence>
                                {openQuestion === key && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                  >
                                    <p className="px-4 pb-3 text-sm text-muted-foreground">
                                      {faq.a}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="font-semibold mb-1">Natija topilmadi</h3>
              <p className="text-sm text-muted-foreground">
                Boshqa kalit so&apos;zlar bilan qidirib ko&apos;ring yoki bizga to&apos;g&apos;ridan-to&apos;g&apos;ri murojaat qiling
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-1">Javob topa olmadingizmi?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Bizning qo&apos;llab-quvvatlash jamoamiz sizga yordam berishga tayyor
          </p>
          <a href="https://t.me/topla_support" target="_blank" rel="noopener noreferrer">
            <Button className="rounded-full">
              <Send className="mr-2 h-4 w-4" />
              Telegram orqali yozish
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
