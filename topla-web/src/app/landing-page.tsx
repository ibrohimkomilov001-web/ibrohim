"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import {
  ShoppingBag,
  Store,
  TrendingUp,
  Shield,
  Truck,
  Users,
  ArrowRight,
  Star,
  Package,
  Headphones,
  BarChart3,
  Zap,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const stats = [
  { label: "Faol do'konlar", value: "500+", icon: Store },
  { label: "Mahsulotlar", value: "50,000+", icon: Package },
  { label: "Kunlik buyurtmalar", value: "2,000+", icon: ShoppingBag },
  { label: "Foydalanuvchilar", value: "100,000+", icon: Users },
];

const features = [
  {
    icon: Store,
    title: "Oson do'kon ochish",
    description: "5 daqiqada onlayn do'koningizni oching. Hech qanday texnik bilim talab etilmaydi.",
  },
  {
    icon: TrendingUp,
    title: "Analitika va statistika",
    description: "Savdolaringizni real vaqtda kuzating. Batafsil grafiklar va hisobotlar.",
  },
  {
    icon: Truck,
    title: "Yetkazib berish",
    description: "FBS va DBS modellarini tanlang. O'zingiz yetkazing yoki bizga ishoning.",
  },
  {
    icon: Shield,
    title: "Xavfsiz to'lovlar",
    description: "Har bir tranzaksiya himoyalangan. Pullaringiz kafolatda.",
  },
  {
    icon: BarChart3,
    title: "Marketing vositalari",
    description: "Mahsulotlaringizni reklama qiling. Aksiyalar va chegirmalar yarating.",
  },
  {
    icon: Headphones,
    title: "24/7 qo'llab-quvvatlash",
    description: "Professional yordam jamoasi doimo siz bilan. Telegram, telefon, chat.",
  },
];

const steps = [
  {
    number: "01",
    title: "Ro'yxatdan o'ting",
    description: "Shaxsiy ma'lumotlaringiz va do'kon haqida ma'lumot kiriting.",
    icon: Users,
  },
  {
    number: "02",
    title: "Mahsulotlarni yuklang",
    description: "Mahsulotlaringizni qo'shing, narxlarni belgilang, rasmlarni yuklang.",
    icon: Package,
  },
  {
    number: "03",
    title: "Sotishni boshlang",
    description: "Buyurtmalarni qabul qiling, yetkazing va daromad oling.",
    icon: CreditCard,
  },
];

const testimonials = [
  {
    name: "Aziz Karimov",
    role: "Elektronika do'koni",
    text: "TOPLA orqali oylik savdolarim 3 barobar oshdi. Platforma juda qulay.",
    rating: 5,
  },
  {
    name: "Nilufar Rahimova",
    role: "Kiyim-kechak do'koni",
    text: "Analitika tizimi juda ajoyib. Qaysi mahsulotlar yaxshi sotilayotganini aniq ko'raman.",
    rating: 5,
  },
  {
    name: "Bobur Aliyev",
    role: "Oziq-ovqat do'koni",
    text: "Yetkazib berish tizimi mukammal. Mijozlar doim mamnun.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "Do'kon ochish uchun nima kerak?",
    a: "Siz faqat pasport yoki guvohnoma nusxasi, do'kon haqida ma'lumot va INN raqamingiz kerak. Ro'yxatdan o'tish bepul.",
  },
  {
    q: "Komissiya qancha?",
    a: "Kategoriyaga qarab 5-15% komissiya olinadi. Hech qanday yashirin to'lovlar yo'q.",
  },
  {
    q: "Pullarim qachon tushadi?",
    a: "Buyurtma yetkazilganidan so'ng 1-3 ish kuni ichida hisobingizga o'tkaziladi.",
  },
  {
    q: "Yetkazib berish qanday ishlaydi?",
    a: "FBS (TOPLA yetkazadi) yoki DBS (o'zingiz yetkazasiz) modellaridan birini tanlashingiz mumkin.",
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TOPLA.UZ</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Imkoniyatlar
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              Qanday ishlaydi
            </a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Fikrlar
            </a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendor/login">Kirish</Link>
            </Button>
            <Button size="sm" className="rounded-full px-6" asChild>
              <Link href="/vendor/register">
                Boshlash
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <motion.div
          className="container relative px-4 sm:px-6"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={staggerItem}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                O&apos;zbekistonning #1 marketplace platformasi
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              variants={staggerItem}
            >
              Onlayn savdoni{" "}
              <span className="text-primary">TOPLA</span> bilan
              <br />boshlang
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              variants={staggerItem}
            >
              Minglab mijozlarga yeting, savdolaringizni oshiring va biznesingizni rivojlantiring. 
              Bepul ro&apos;yxatdan o&apos;ting va bugunoq sotishni boshlang.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4" variants={staggerItem}>
              <Button size="lg" className="rounded-full px-8 text-base h-12" asChild>
                <Link href="/vendor/register">
                  Bepul boshlash
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12" asChild>
                <Link href="#how-it-works">Qanday ishlaydi?</Link>
              </Button>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                className="text-center p-4 rounded-2xl bg-card border"
                variants={staggerItem}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container px-4 sm:px-6">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Nima uchun TOPLA?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Bizning platforma sizga muvaffaqiyatli onlayn savdo uchun barcha vositalarni taqdim etadi
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={staggerItem}>
                <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20">
        <div className="container px-4 sm:px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">3 oddiy qadamda boshlang</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Do&apos;koningizni ochish hech qachon bu qadar oson bo&apos;lmagan
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="relative text-center"
                variants={staggerItem}
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-primary/20" />
                )}
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 mb-6 relative">
                  <step.icon className="h-10 w-10 text-primary" />
                  <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Commission Calculator */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 sm:px-6">
          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Qancha topasiz?</h2>
              <p className="text-muted-foreground text-lg">
                Oddiy hisob-kitob — siz qancha sotasiz, biz qancha foiz olamiz
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">5%</div>
                  <div className="text-lg font-semibold mb-1">Oziq-ovqat</div>
                  <div className="text-sm text-muted-foreground">Eng past komissiya</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">8%</div>
                  <div className="text-lg font-semibold mb-1">Elektronika</div>
                  <div className="text-sm text-muted-foreground">Eng mashhur kategoriya</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">10%</div>
                  <div className="text-lg font-semibold mb-1">Kiyim-kechak</div>
                  <div className="text-sm text-muted-foreground">Yuqori margin</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container px-4 sm:px-6">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Sotuvchilar nima deyishadi</h2>
            <p className="text-muted-foreground text-lg">
              500+ sotuvchilar allaqachon TOPLA bilan savdo qilmoqda
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={staggerItem}>
                <Card className="h-full border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">&quot;{t.text}&quot;</p>
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-muted-foreground">{t.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-muted/30">
        <div className="container px-4 sm:px-6">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ko&apos;p so&apos;raladigan savollar</h2>
          </motion.div>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="border rounded-xl bg-card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <button
                  className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronRight
                    className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                      openFaq === i ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    className="px-4 pb-4 text-muted-foreground"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                  >
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container px-4 sm:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center bg-primary rounded-3xl p-10 sm:p-16 text-primary-foreground relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Bugunoq sotishni boshlang!
              </h2>
              <p className="text-primary-foreground/80 mb-8 text-lg max-w-xl mx-auto">
                500+ sotuvchilar orasiga qo&apos;shiling va TOPLA platformasida biznesingizni o&apos;stiring.
                Ro&apos;yxatdan o&apos;tish mutlaqo bepul.
              </p>
              <Button size="lg" variant="secondary" className="rounded-full px-8 text-base h-12" asChild>
                <Link href="/vendor/register">
                  Bepul ro&apos;yxatdan o&apos;tish
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">TOPLA.UZ</span>
              </div>
              <p className="text-sm text-muted-foreground">
                O&apos;zbekistonning eng yirik marketplace platformasi
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Sotuvchilar uchun</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="/vendor/register" className="block hover:text-primary transition-colors">
                  Do&apos;kon ochish
                </Link>
                <Link href="/vendor/login" className="block hover:text-primary transition-colors">
                  Kabinetga kirish
                </Link>
                <a href="#faq" className="block hover:text-primary transition-colors">
                  FAQ
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Kompaniya</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-primary transition-colors">Biz haqimizda</a>
                <a href="#" className="block hover:text-primary transition-colors">Aloqa</a>
                <a href="#" className="block hover:text-primary transition-colors">Blog</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Aloqa</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>info@topla.uz</p>
                <p>+998 (90) 123-45-67</p>
                <p>Toshkent, O&apos;zbekiston</p>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TOPLA.UZ. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>
    </div>
  );
}
