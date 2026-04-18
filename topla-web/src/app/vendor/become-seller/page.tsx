"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  TrendingUp,
  Users,
  Truck,
  Shield,
  BarChart3,
  Megaphone,
  Package,
  Headphones,
  ArrowRight,
  CheckCircle,
  Star,
  ChevronDown,
  MapPin,
  Clock,
  Wallet,
  Store,
  Zap,
  Globe,
  Play,
  Calculator,
  Gift,
  Sparkles,
  Phone,
  MessageCircle,
  Heart,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation } from "@/store/locale-store";
import { useSupportPhone, useTelegramLink } from "@/hooks/useSettings";

/* ──────────────── FORMAT NUMBER (consistent server/client) ──────────────── */
function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/* ──────────────── ANIMATED COUNTER ──────────────── */
function AnimatedCounter({
  end,
  suffix = "",
  duration = 2000,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (hasAnimated || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasAnimated, end, duration]);

  return (
    <span ref={ref}>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

/* ──────────────── SVG ILLUSTRATIONS ──────────────── */
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      {/* Phone mockup */}
      <rect x="160" y="30" width="180" height="340" rx="24" fill="#1E293B" />
      <rect x="168" y="46" width="164" height="304" rx="12" fill="#F8FAFC" />
      <rect x="220" y="34" width="60" height="6" rx="3" fill="#334155" />
      {/* App header */}
      <rect x="168" y="46" width="164" height="44" rx="12" fill="#2563EB" />
      <text
        x="220"
        y="72"
        fill="white"
        fontSize="13"
        fontWeight="700"
        textAnchor="middle"
      >
        TOPLA.UZ
      </text>
      {/* Product cards on phone */}
      <rect
        x="178"
        y="100"
        width="70"
        height="85"
        rx="8"
        fill="#EFF6FF"
        stroke="#BFDBFE"
        strokeWidth="1"
      />
      <rect x="183" y="105" width="60" height="45" rx="4" fill="#DBEAFE" />
      <rect x="183" y="156" width="40" height="6" rx="2" fill="#94A3B8" />
      <rect x="183" y="166" width="30" height="8" rx="2" fill="#2563EB" />

      <rect
        x="256"
        y="100"
        width="70"
        height="85"
        rx="8"
        fill="#EFF6FF"
        stroke="#BFDBFE"
        strokeWidth="1"
      />
      <rect x="261" y="105" width="60" height="45" rx="4" fill="#DBEAFE" />
      <rect x="261" y="156" width="40" height="6" rx="2" fill="#94A3B8" />
      <rect x="261" y="166" width="30" height="8" rx="2" fill="#2563EB" />

      <rect
        x="178"
        y="195"
        width="70"
        height="85"
        rx="8"
        fill="#EFF6FF"
        stroke="#BFDBFE"
        strokeWidth="1"
      />
      <rect x="183" y="200" width="60" height="45" rx="4" fill="#DBEAFE" />
      <rect x="183" y="251" width="40" height="6" rx="2" fill="#94A3B8" />
      <rect x="183" y="261" width="30" height="8" rx="2" fill="#2563EB" />

      <rect
        x="256"
        y="195"
        width="70"
        height="85"
        rx="8"
        fill="#EFF6FF"
        stroke="#BFDBFE"
        strokeWidth="1"
      />
      <rect x="261" y="200" width="60" height="45" rx="4" fill="#DBEAFE" />
      <rect x="261" y="251" width="40" height="6" rx="2" fill="#94A3B8" />
      <rect x="261" y="261" width="30" height="8" rx="2" fill="#2563EB" />

      {/* Bottom nav */}
      <rect x="168" y="310" width="164" height="40" rx="0" fill="#F1F5F9" />
      <circle cx="200" cy="330" r="8" fill="#2563EB" />
      <circle cx="230" cy="330" r="8" fill="#CBD5E1" />
      <circle cx="260" cy="330" r="8" fill="#CBD5E1" />
      <circle cx="290" cy="330" r="8" fill="#CBD5E1" />

      {/* Floating notification — orders */}
      <g>
        <rect
          x="50"
          y="80"
          width="90"
          height="70"
          rx="12"
          fill="white"
          filter="url(#heroShadow)"
        />
        <circle cx="75" cy="105" r="12" fill="#DCFCE7" />
        <text x="75" y="109" fontSize="12" textAnchor="middle">
          📦
        </text>
        <rect x="95" y="97" width="35" height="6" rx="3" fill="#94A3B8" />
        <rect x="95" y="108" width="25" height="6" rx="3" fill="#22C55E" />
        <text x="75" y="138" fontSize="9" fill="#64748B" textAnchor="middle">
          +248 buyurtma
        </text>
      </g>

      {/* Floating — growth */}
      <g>
        <rect
          x="360"
          y="60"
          width="100"
          height="55"
          rx="12"
          fill="white"
          filter="url(#heroShadow)"
        />
        <text
          x="410"
          y="85"
          fontSize="18"
          fontWeight="700"
          fill="#2563EB"
          textAnchor="middle"
        >
          ↗ 340%
        </text>
        <text x="410" y="103" fontSize="9" fill="#64748B" textAnchor="middle">
          {"Sotuvlar o'sishi"}
        </text>
      </g>

      {/* Floating — rating */}
      <g>
        <rect
          x="70"
          y="260"
          width="75"
          height="55"
          rx="12"
          fill="white"
          filter="url(#heroShadow)"
        />
        <text
          x="107"
          y="283"
          fontSize="14"
          fontWeight="700"
          fill="#F59E0B"
          textAnchor="middle"
        >
          ⭐ 4.9
        </text>
        <text x="107" y="303" fontSize="9" fill="#64748B" textAnchor="middle">
          Reyting
        </text>
      </g>

      {/* Floating — revenue */}
      <g>
        <rect
          x="370"
          y="240"
          width="95"
          height="60"
          rx="12"
          fill="white"
          filter="url(#heroShadow)"
        />
        <circle cx="395" cy="262" r="10" fill="#DBEAFE" />
        <text x="395" y="266" fontSize="10" textAnchor="middle">
          💰
        </text>
        <rect x="412" y="257" width="40" height="5" rx="2" fill="#22C55E" />
        <text x="417" y="287" fontSize="9" fill="#64748B" textAnchor="middle">
          {"3.2M so'm/oy"}
        </text>
      </g>

      {/* Decorative circles */}
      <circle cx="40" cy="200" r="6" fill="#2563EB" opacity="0.3" />
      <circle cx="470" cy="170" r="4" fill="#2563EB" opacity="0.2" />
      <circle cx="130" cy="370" r="5" fill="#2563EB" opacity="0.25" />
      <circle cx="430" cy="350" r="7" fill="#F59E0B" opacity="0.2" />

      <defs>
        <filter
          id="heroShadow"
          x="-8"
          y="-4"
          width="120"
          height="90"
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="8"
            floodColor="#000"
            floodOpacity="0.08"
          />
        </filter>
      </defs>
    </svg>
  );
}

function DeliveryIllustration() {
  return (
    <svg
      viewBox="0 0 300 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-xs mx-auto"
    >
      {/* Road */}
      <rect x="0" y="155" width="300" height="6" rx="3" fill="#E2E8F0" />
      <rect x="30" y="156" width="20" height="4" rx="2" fill="#CBD5E1" />
      <rect x="80" y="156" width="20" height="4" rx="2" fill="#CBD5E1" />
      <rect x="130" y="156" width="20" height="4" rx="2" fill="#CBD5E1" />
      <rect x="180" y="156" width="20" height="4" rx="2" fill="#CBD5E1" />
      <rect x="230" y="156" width="20" height="4" rx="2" fill="#CBD5E1" />
      {/* Truck */}
      <rect x="80" y="110" width="90" height="47" rx="6" fill="#2563EB" />
      <rect x="170" y="125" width="45" height="32" rx="4" fill="#1D4ED8" />
      <rect x="175" y="130" width="35" height="20" rx="3" fill="#BFDBFE" />
      <circle cx="110" cy="157" r="12" fill="#1E293B" />
      <circle cx="110" cy="157" r="6" fill="#E2E8F0" />
      <circle cx="155" cy="157" r="12" fill="#1E293B" />
      <circle cx="155" cy="157" r="6" fill="#E2E8F0" />
      <circle cx="200" cy="157" r="10" fill="#1E293B" />
      <circle cx="200" cy="157" r="5" fill="#E2E8F0" />
      {/* Boxes on truck */}
      <rect x="90" y="95" width="25" height="20" rx="3" fill="#FCD34D" />
      <rect x="120" y="90" width="20" height="25" rx="3" fill="#FB923C" />
      <rect x="145" y="98" width="18" height="17" rx="3" fill="#A78BFA" />
      {/* Warehouse */}
      <rect
        x="10"
        y="90"
        width="55"
        height="67"
        rx="4"
        fill="#F1F5F9"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <rect x="20" y="100" width="15" height="20" rx="2" fill="#DBEAFE" />
      <rect x="40" y="100" width="15" height="20" rx="2" fill="#DBEAFE" />
      <rect x="27" y="130" width="20" height="27" rx="2" fill="#93C5FD" />
      {/* House */}
      <polygon
        points="260,90 240,115 280,115"
        fill="#FEF3C7"
        stroke="#F59E0B"
        strokeWidth="1"
      />
      <rect
        x="243"
        y="115"
        width="35"
        height="42"
        rx="3"
        fill="#FEF9C3"
        stroke="#FCD34D"
        strokeWidth="1"
      />
      <rect x="253" y="130" width="15" height="27" rx="2" fill="#F59E0B" />
      {/* Path line */}
      <path
        d="M65 130 Q120 70 240 130"
        stroke="#2563EB"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
        opacity="0.4"
      />
      {/* TOPLA box */}
      <rect
        x="95"
        y="60"
        width="40"
        height="28"
        rx="4"
        fill="white"
        stroke="#2563EB"
        strokeWidth="1.5"
      />
      <text
        x="115"
        y="78"
        fontSize="7"
        fontWeight="700"
        fill="#2563EB"
        textAnchor="middle"
      >
        TOPLA
      </text>
    </svg>
  );
}

function GrowthIllustration() {
  return (
    <svg
      viewBox="0 0 300 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-xs mx-auto"
    >
      {/* Chart area */}
      <rect x="30" y="20" width="250" height="150" rx="12" fill="#F8FAFC" />
      {/* Grid lines */}
      <line
        x1="50"
        y1="50"
        x2="260"
        y2="50"
        stroke="#E2E8F0"
        strokeWidth="1"
      />
      <line
        x1="50"
        y1="80"
        x2="260"
        y2="80"
        stroke="#E2E8F0"
        strokeWidth="1"
      />
      <line
        x1="50"
        y1="110"
        x2="260"
        y2="110"
        stroke="#E2E8F0"
        strokeWidth="1"
      />
      <line
        x1="50"
        y1="140"
        x2="260"
        y2="140"
        stroke="#E2E8F0"
        strokeWidth="1"
      />
      {/* Growth area */}
      <path
        d="M60 140 L100 125 L140 110 L170 85 L200 70 L230 45 L250 35"
        stroke="#2563EB"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M60 140 L100 125 L140 110 L170 85 L200 70 L230 45 L250 35 L250 140 L60 140 Z"
        fill="url(#blueGrad)"
        opacity="0.15"
      />
      {/* Data points */}
      <circle cx="60" cy="140" r="4" fill="#2563EB" />
      <circle cx="100" cy="125" r="4" fill="#2563EB" />
      <circle cx="140" cy="110" r="4" fill="#2563EB" />
      <circle cx="170" cy="85" r="4" fill="#2563EB" />
      <circle cx="200" cy="70" r="5" fill="#2563EB" />
      <circle cx="230" cy="45" r="5" fill="#2563EB" />
      <circle
        cx="250"
        cy="35"
        r="6"
        fill="#2563EB"
        stroke="white"
        strokeWidth="2"
      />
      {/* Arrow up */}
      <polygon points="250,22 244,32 256,32" fill="#22C55E" />
      <text
        x="250"
        y="18"
        fontSize="10"
        fill="#22C55E"
        fontWeight="700"
        textAnchor="middle"
      >
        +340%
      </text>
      {/* Labels */}
      <text x="60" y="160" fontSize="8" fill="#94A3B8">
        Yan
      </text>
      <text x="100" y="160" fontSize="8" fill="#94A3B8">
        Fev
      </text>
      <text x="140" y="160" fontSize="8" fill="#94A3B8">
        Mar
      </text>
      <text x="170" y="160" fontSize="8" fill="#94A3B8">
        Apr
      </text>
      <text x="200" y="160" fontSize="8" fill="#94A3B8">
        May
      </text>
      <text x="230" y="160" fontSize="8" fill="#94A3B8">
        Iyn
      </text>
      <defs>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ──────────────── CUSTOM RANGE SLIDER ──────────────── */
function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#2563EB]"
      style={{
        background: `linear-gradient(to right, #2563EB 0%, #2563EB ${pct}%, #E2E8F0 ${pct}%, #E2E8F0 100%)`,
      }}
    />
  );
}

/* ──────────────── COMMISSION CALCULATOR ──────────────── */
function CommissionCalculator() {
  const { t } = useTranslation();
  const [price, setPrice] = useState(200000);
  const [quantity, setQuantity] = useState(10);
  const commissionRate = 0.1;
  const deliveryFee = 8000;

  const commission = price * commissionRate;
  const totalRevenue = price * quantity * 30;
  const totalCommission = commission * quantity * 30;
  const totalDelivery = deliveryFee * quantity * 30;
  const profit = totalRevenue - totalCommission - totalDelivery;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">
            {t('bsCalcPriceLabel')}{" "}
            <span className="text-[#2563EB] font-bold">
              {formatNumber(price)} {t('bsCalcCurrency')}
            </span>
          </Label>
          <RangeSlider
            min={10000}
            max={5000000}
            step={10000}
            value={price}
            onChange={setPrice}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>10 000</span>
            <span>5 000 000</span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            {t('bsCalcQtyLabel')}{" "}
            <span className="text-[#2563EB] font-bold">{quantity} {t('bsCalcUnit')}</span>
          </Label>
          <RangeSlider
            min={1}
            max={100}
            step={1}
            value={quantity}
            onChange={setQuantity}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span>100</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A5F] space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('bsCalcCommRate')}</span>
            <span className="font-semibold">10%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('bsCalcDelivery')}</span>
            <span className="font-semibold">8 000 {t('bsCalcDeliveryVal')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t('bsCalcRegistration')}
            </span>
            <span className="font-semibold text-green-600">{t('bsCalcFree')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          {t('bsCalcMonthly')}
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-muted/50">
            <span className="text-sm text-muted-foreground">
              {t('bsCalcTotalSales')}
            </span>
            <span className="font-bold text-lg">
              {formatNumber(totalRevenue)} {t('bsCalcCurrency')}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-orange-50 dark:bg-orange-950/20">
            <span className="text-sm text-orange-600">
              {t('bsCalcCommission')}
            </span>
            <span className="font-bold text-orange-600">
              -{formatNumber(totalCommission)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-orange-50 dark:bg-orange-950/20">
            <span className="text-sm text-orange-600">
              {t('bsCalcDeliveryFee')}
            </span>
            <span className="font-bold text-orange-600">
              -{formatNumber(totalDelivery)}
            </span>
          </div>
          <div className="flex justify-between items-center py-4 px-4 rounded-xl bg-green-100 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800">
            <div>
              <span className="text-sm text-green-700 dark:text-green-400">
                {t('bsCalcProfit')}
              </span>
              <div className="text-xs text-green-600/70 dark:text-green-500">
                {t('bsCalcPerMonth')} ({quantity} x 30)
              </div>
            </div>
            <span className="font-extrabold text-2xl text-green-700 dark:text-green-400">
              {formatNumber(profit)}{" "}
              <span className="text-sm font-medium">{t('bsCalcCurrency')}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── FAQ ──────────────── */
function FAQItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-medium pr-4 group-hover:text-[#2563EB] transition-colors">
          {item.q}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pb-5"
        >
          <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
            {item.a}
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ──────────────── DATA (icons & colors only — text via i18n) ──────────────── */
const benefitMeta = [
  { icon: Users, titleKey: 'bsBenefit1Title', descKey: 'bsBenefit1Desc', color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  { icon: Megaphone, titleKey: 'bsBenefit2Title', descKey: 'bsBenefit2Desc', color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  { icon: Globe, titleKey: 'bsBenefit3Title', descKey: 'bsBenefit3Desc', color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' },
  { icon: Truck, titleKey: 'bsBenefit4Title', descKey: 'bsBenefit4Desc', color: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400' },
  { icon: BarChart3, titleKey: 'bsBenefit5Title', descKey: 'bsBenefit5Desc', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' },
  { icon: Shield, titleKey: 'bsBenefit6Title', descKey: 'bsBenefit6Desc', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' },
];

const stepMeta = [
  { icon: Store, titleKey: 'bsStep1Title', descKey: 'bsStep1Desc' },
  { icon: Wallet, titleKey: 'bsStep2Title', descKey: 'bsStep2Desc' },
  { icon: ShoppingBag, titleKey: 'bsStep3Title', descKey: 'bsStep3Desc' },
];

const testimonialMeta = [
  { nameKey: 'bsTestimonial1Name', roleKey: 'bsTestimonial1Role', avatar: 'AK', textKey: 'bsTestimonial1Text', rating: 5 },
  { nameKey: 'bsTestimonial2Name', roleKey: 'bsTestimonial2Role', avatar: 'NR', textKey: 'bsTestimonial2Text', rating: 5 },
  { nameKey: 'bsTestimonial3Name', roleKey: 'bsTestimonial3Role', avatar: 'SU', textKey: 'bsTestimonial3Text', rating: 5 },
];

/* ──────────────── MAIN PAGE ──────────────── */
export default function BecomeSellerPage() {
  const { t } = useTranslation();
  const supportPhone = useSupportPhone();
  const telegramLink = useTelegramLink();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ━━━ NAVBAR ━━━ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border-b border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
          : 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-sm border-b border-white/20 dark:border-gray-800/20'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center">
              <span className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
                TOPLA<span className="text-[#2563EB]">.UZ</span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Menu"
              >
                <span className={`block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded mt-1 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded mt-1 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <Link
                    href="/vendor/login"
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#2563EB] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('bsNavLogin')}
                  </Link>
                  <Link
                    href="/vendor/register"
                    className="block px-4 py-2.5 text-sm font-medium text-[#2563EB] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('bsNavBecomeSeller')}
                  </Link>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ━━━ HERO ━━━ */}
      <section className="relative overflow-hidden pt-14">
        {/* BG decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EFF6FF] via-white to-[#F0F9FF] dark:from-gray-950 dark:via-gray-950 dark:to-blue-950/20" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-[#2563EB]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#7C3AED]/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                {t('bsHeroBadge')}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.15]">
                {t('bsHeroTitle1')}{" "}
                <span className="text-[#2563EB] relative">
                  TOPLA.UZ
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 12"
                    fill="none"
                  >
                    <path
                      d="M2 8 Q50 2 100 6 T198 4"
                      stroke="#2563EB"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                  </svg>
                </span>{" "}
                {t('bsHeroTitle2')}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-lg leading-relaxed">
                {t('bsHeroDesc')}{" "}
                <strong className="text-foreground">
                  {t('bsHeroFreeReg')}
                </strong>
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  asChild
                  className="rounded-full text-base px-8 bg-[#2563EB] hover:bg-[#1D4ED8] shadow-xl shadow-blue-500/25 h-12"
                >
                  <Link href="/vendor/register">
                    {t('bsHeroBtnSeller')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="rounded-full text-base px-8 h-12 border-2"
                >
                  <Link href="#calculator">
                    <Calculator className="mr-2 h-5 w-5" />
                    {t('bsHeroBtnCalc')}
                  </Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('bsHeroTagFree')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('bsHeroTagSupport')}</span>
                </div>
              </div>
            </motion.div>

            {/* Hero illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ STATS BAR ━━━ */}
      <section className="relative -mt-6 z-10 max-w-5xl mx-auto px-4">
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-black/5 p-6 border border-border/50"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {[
            {
              value: 100000,
              suffix: "+",
              labelKey: "bsStatBuyers",
              icon: Users,
              color: "text-[#2563EB]",
              translate: false,
            },
            {
              value: 15,
              suffix: "x",
              labelKey: "bsStatGrowth",
              icon: TrendingUp,
              color: "text-green-500",
              translate: false,
            },
            {
              value: 7,
              suffix: "bsStatDaySuffix",
              labelKey: "bsStatFirstIncome",
              icon: Clock,
              color: "text-orange-500",
              translate: true,
            },
            {
              value: 14,
              suffix: "+",
              labelKey: "bsStatCities",
              icon: MapPin,
              color: "text-blue-500",
              translate: false,
            },
          ].map((stat) => (
            <div key={stat.labelKey} className="text-center">
              <stat.icon
                className={`h-6 w-6 mx-auto mb-2 ${stat.color}`}
              />
              <div
                className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}
              >
                <AnimatedCounter end={stat.value} suffix={stat.translate ? t(stat.suffix) : stat.suffix} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ━━━ BENEFITS ━━━ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold mb-4">
              <Gift className="h-3.5 w-3.5" /> {t('bsBenefitsBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              {t('bsBenefitsTitle')}
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              {t('bsBenefitsDesc')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefitMeta.map((b, i) => (
              <motion.div
                key={b.titleKey}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 border-2 hover:border-[#2563EB]/20 cursor-default">
                  <CardContent className="p-6">
                    <div
                      className={`h-12 w-12 rounded-xl ${b.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <b.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{t(b.titleKey)}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(b.descKey)}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-4 dark:bg-green-950 dark:text-green-400">
                <Zap className="h-3.5 w-3.5" /> {t('bsStepsBadge')}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
                {t('bsStepsTitle')}
              </h2>
              <p className="text-muted-foreground mb-10">
                {t('bsStepsDesc')}
              </p>

              {stepMeta.map((step, i) => (
                <motion.div
                  key={step.titleKey}
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
                    {i < stepMeta.length - 1 && (
                      <div className="w-0.5 flex-1 bg-[#2563EB]/20 mt-2" />
                    )}
                  </div>
                  <div className="pb-8">
                    <div className="text-xs font-bold text-[#2563EB] mb-1">
                      {i + 1}{t('bsStepLabel')}
                    </div>
                    <h3 className="text-lg font-bold mb-1.5">
                      {t(step.titleKey)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(step.descKey)}
                    </p>
                  </div>
                </motion.div>
              ))}

              <Button
                size="lg"
                asChild
                className="rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] shadow-lg shadow-blue-500/25 px-8 mt-2"
              >
                <Link href="/vendor/register">
                  {t('bsHeroBtnSeller')}{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="hidden lg:block"
            >
              <DeliveryIllustration />
              <div className="mt-8">
                <GrowthIllustration />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ YETKAZIB BERISH ━━━ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-4 dark:bg-green-950 dark:text-green-400">
              <Truck className="h-3.5 w-3.5" /> {t('bsDeliveryBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              {t('bsDeliveryTitle1')}<span className="text-[#2563EB]">.UZ</span> {t('bsDeliveryTitle2')}{" "}
              <span className="text-[#2563EB]">{t('bsDeliveryTitle3')}</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              {t('bsDeliveryDesc')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            {[
              { icon: Package, titleKey: "bsDelStep1Title", descKey: "bsDelStep1Desc", color: "border-green-200 dark:border-green-800" },
              { icon: Package, titleKey: "bsDelStep2Title", descKey: "bsDelStep2Desc", color: "border-blue-200 dark:border-blue-800" },
              { icon: Truck, titleKey: "bsDelStep3Title", descKey: "bsDelStep3Desc", color: "border-orange-200 dark:border-orange-800" },
            ].map((m, i) => (
              <motion.div
                key={m.titleKey}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`h-full hover:shadow-xl transition-all duration-300 border-2 ${m.color} relative overflow-hidden group`}
                >
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <m.icon className="h-6 w-6 text-[#2563EB]" />
                    </div>
                    <h3 className="font-bold mb-2">{t(m.titleKey)}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(m.descKey)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ CALCULATOR ━━━ */}
      <section
        id="calculator"
        className="py-20 sm:py-28 bg-gradient-to-b from-[#F8FAFC] to-white dark:from-gray-900 dark:to-gray-950 scroll-mt-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-4 dark:bg-green-950 dark:text-green-400">
              <Calculator className="h-3.5 w-3.5" /> {t('bsCalcBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              {t('bsCalcTitle')}{" "}
              <span className="text-green-600">{t('bsCalcTitleHighlight')}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('bsCalcDesc')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-2 shadow-xl">
              <CardContent className="p-6 sm:p-10">
                <CommissionCalculator />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Button
              size="lg"
              asChild
              className="rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] shadow-lg shadow-blue-500/25 px-10 h-12"
            >
              <Link href="/vendor/register">
                {t('bsHeroBtnSeller')}{" "}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ━━━ VIDEO ━━━ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold mb-4 dark:bg-red-950 dark:text-red-400">
              <Play className="h-3.5 w-3.5" /> {t('bsVideoBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              {t('bsVideoTitle')}{" "}
              <span className="text-[#2563EB]">{t('bsVideoTitleHighlight')}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('bsVideoDesc')}
            </p>
          </motion.div>

          <motion.div
            className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-border shadow-2xl group"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* YouTube embed placeholder — replace VIDEO_ID with actual YouTube ID */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-[#2563EB] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 group-hover:scale-110 transition-transform cursor-pointer">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
                <p className="mt-4 text-muted-foreground text-sm font-medium">
                  {t('bsVideoSoon')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('bsVideoPlaceholder')}
                </p>
              </div>
            </div>
            {/* 
              REAL VIDEO: Replace above div with:
              <iframe 
                src="https://www.youtube.com/embed/VIDEO_ID" 
                className="absolute inset-0 w-full h-full"
                allowFullScreen 
              />
            */}
          </motion.div>
        </div>
      </section>

      {/* ━━━ TESTIMONIALS ━━━ */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-[#F8FAFC] to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold mb-4 dark:bg-yellow-950 dark:text-yellow-400">
              <Heart className="h-3.5 w-3.5" /> {t('bsTestimonialsBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              {t('bsTestimonialsTitle')}{" "}
              <span className="text-[#2563EB]">{t('bsTestimonialsTitleHighlight')}</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {testimonialMeta.map((tm, i) => (
              <motion.div
                key={tm.nameKey}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-2 hover:border-[#2563EB]/20 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: tm.rating }).map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed italic">
                      &ldquo;{t(tm.textKey)}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <div className="h-10 w-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-sm font-bold text-[#2563EB]">
                        {tm.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {t(tm.nameKey)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t(tm.roleKey)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FAQ ━━━ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold mb-4">
              <MessageCircle className="h-3.5 w-3.5" /> {t('bsFaqBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              {t('bsFaqTitle')}{" "}
              <span className="text-[#2563EB]">{t('bsFaqTitleHighlight')}</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-2">
              <CardContent className="p-6 sm:p-8">
                {[
                  { q: t('bsFaq1Q'), a: t('bsFaq1A') },
                  { q: t('bsFaq2Q'), a: t('bsFaq2A') },
                  { q: t('bsFaq3Q'), a: t('bsFaq3A') },
                  { q: t('bsFaq4Q'), a: t('bsFaq4A') },
                  { q: t('bsFaq5Q'), a: t('bsFaq5A') },
                  { q: t('bsFaq6Q'), a: t('bsFaq6A') },
                ].map((item, i) => (
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
                <Headphones className="h-6 w-6 text-[#2563EB]" />
              </div>
              <div>
                <h3 className="font-bold">{t('bsSupportTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('bsSupportDesc')}
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
                  <MessageCircle className="h-4 w-4" /> {t('bsSupportTelegram')}
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
              <span className="font-bold text-sm">TOPLA<span className="text-[#2563EB]">.UZ</span></span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link
                href="/"
                className="hover:text-white transition-colors"
              >
                {t('bsFooterHome')}
              </Link>
              <Link
                href="/vendor/register"
                className="hover:text-white transition-colors"
              >
                {t('bsFooterRegister')}
              </Link>
              <Link
                href="/vendor/login"
                className="hover:text-white transition-colors"
              >
                {t('bsFooterLogin')}
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              {t('bsFooterRights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
