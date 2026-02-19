'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MapPin, CreditCard, Truck, Check, ChevronRight,
  ShieldCheck, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/store/locale-store';

type Step = 'address' | 'delivery' | 'payment' | 'confirm';

const steps: { key: Step; icon: typeof MapPin }[] = [
  { key: 'address', icon: MapPin },
  { key: 'delivery', icon: Truck },
  { key: 'payment', icon: CreditCard },
  { key: 'confirm', icon: Check },
];

export default function CheckoutPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Form state
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    city: '',
    street: '',
    apartment: '',
    note: '',
  });
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'payme' | 'click' | 'uzum'>('cash');

  const itemCount = getItemCount();
  const subtotal = getTotal();
  const deliveryFee = deliveryMethod === 'express' ? 25000 : (subtotal > 100000 ? 0 : 15000);
  const total = subtotal + deliveryFee;

  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  const stepLabels: Record<Step, string> = {
    address: locale === 'ru' ? 'Адрес' : 'Manzil',
    delivery: locale === 'ru' ? 'Доставка' : 'Yetkazish',
    payment: locale === 'ru' ? 'Оплата' : 'To\'lov',
    confirm: locale === 'ru' ? 'Подтверждение' : 'Tasdiqlash',
  };

  const goNext = () => {
    const i = stepIndex;
    if (i < steps.length - 1) setCurrentStep(steps[i + 1].key);
  };

  const goBack = () => {
    const i = stepIndex;
    if (i > 0) setCurrentStep(steps[i - 1].key);
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    clearCart();
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <RedirectToCart />
    );
  }

  if (orderPlaced) {
    return (
      <div className="site-container py-20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="w-24 h-24 rounded-full bg-green-500/10 mx-auto flex items-center justify-center mb-6"
        >
          <Check className="w-12 h-12 text-green-500" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            {locale === 'ru' ? 'Заказ оформлен!' : 'Buyurtma qabul qilindi!'}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {locale === 'ru'
              ? 'Мы свяжемся с вами для подтверждения заказа. Спасибо за покупку!'
              : 'Buyurtmangizni tasdiqlash uchun siz bilan bog\'lanamiz. Xaridingiz uchun rahmat!'}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="liquid-btn inline-flex items-center gap-2 px-6 py-3">
              {t('continueShopping')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="site-container py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
        <span className="mx-2">/</span>
        <Link href="/cart" className="hover:text-primary transition-colors">{t('cart')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{t('checkout')}</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-8">{t('checkout')}</h1>

      {/* Step indicator */}
      <div className="flex items-center justify-between max-w-xl mb-10">
        {steps.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = i === stepIndex;
          const isCompleted = i < stepIndex;
          return (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => i < stepIndex && setCurrentStep(step.key)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'glass text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
              </button>
              <span className={`ml-2 text-sm hidden sm:block ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}>
                {stepLabels[step.key]}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 rounded-full ${
                  isCompleted ? 'bg-green-500' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* Address step */}
            {currentStep === 'address' && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass rounded-2xl p-5 sm:p-6 space-y-5"
              >
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {stepLabels.address}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {locale === 'ru' ? 'Полное имя' : 'To\'liq ism'}
                    </label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full search-glass px-4 py-3 rounded-xl text-sm outline-none"
                      placeholder={locale === 'ru' ? 'Иван Иванов' : 'Ism Familiya'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {locale === 'ru' ? 'Телефон' : 'Telefon'}
                    </label>
                    <input
                      type="tel"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full search-glass px-4 py-3 rounded-xl text-sm outline-none"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {locale === 'ru' ? 'Город' : 'Shahar'}
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full search-glass px-4 py-3 rounded-xl text-sm outline-none"
                      placeholder={locale === 'ru' ? 'Ташкент' : 'Toshkent'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {locale === 'ru' ? 'Улица, дом' : 'Ko\'cha, uy'}
                    </label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="w-full search-glass px-4 py-3 rounded-xl text-sm outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">
                      {locale === 'ru' ? 'Комментарий' : 'Izoh'}
                    </label>
                    <textarea
                      value={address.note}
                      onChange={(e) => setAddress({ ...address, note: e.target.value })}
                      className="w-full search-glass px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      rows={3}
                      placeholder={locale === 'ru' ? 'Ориентир, подъезд, этаж...' : 'Mo\'ljal, podyezd, qavat...'}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Delivery step */}
            {currentStep === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass rounded-2xl p-5 sm:p-6 space-y-5"
              >
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  {stepLabels.delivery}
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setDeliveryMethod('standard')}
                    className={`w-full glass rounded-xl p-4 text-left flex items-center gap-4 transition-all ${
                      deliveryMethod === 'standard' ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      deliveryMethod === 'standard' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {deliveryMethod === 'standard' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {locale === 'ru' ? 'Стандартная доставка' : 'Oddiy yetkazish'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {locale === 'ru' ? '2-4 рабочих дня' : '2-4 ish kuni'}
                      </p>
                    </div>
                    <span className="font-bold text-green-600">
                      {subtotal > 100000 ? t('free') : formatPrice(15000)}
                    </span>
                  </button>

                  <button
                    onClick={() => setDeliveryMethod('express')}
                    className={`w-full glass rounded-xl p-4 text-left flex items-center gap-4 transition-all ${
                      deliveryMethod === 'express' ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      deliveryMethod === 'express' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {deliveryMethod === 'express' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {locale === 'ru' ? 'Экспресс доставка' : 'Tezkor yetkazish'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {locale === 'ru' ? 'В тот же день' : 'O\'sha kuni'}
                      </p>
                    </div>
                    <span className="font-bold">{formatPrice(25000)}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Payment step */}
            {currentStep === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass rounded-2xl p-5 sm:p-6 space-y-5"
              >
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {stepLabels.payment}
                </h2>
                <div className="space-y-3">
                  {[
                    { key: 'cash' as const, label: locale === 'ru' ? 'Наличные' : 'Naqd pul', emoji: '💵' },
                    { key: 'payme' as const, label: 'Payme', emoji: '💳' },
                    { key: 'click' as const, label: 'Click', emoji: '📱' },
                    { key: 'uzum' as const, label: 'Uzum Bank', emoji: '🏦' },
                  ].map((method) => (
                    <button
                      key={method.key}
                      onClick={() => setPaymentMethod(method.key)}
                      className={`w-full glass rounded-xl p-4 text-left flex items-center gap-4 transition-all ${
                        paymentMethod === method.key ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === method.key ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {paymentMethod === method.key && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <span className="text-2xl">{method.emoji}</span>
                      <span className="font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Confirm step */}
            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Address summary */}
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {stepLabels.address}
                    </h3>
                    <button
                      onClick={() => setCurrentStep('address')}
                      className="text-sm text-primary hover:underline"
                    >
                      {locale === 'ru' ? 'Изменить' : 'O\'zgartirish'}
                    </button>
                  </div>
                  <p className="text-sm">{address.fullName || '—'}</p>
                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                  <p className="text-sm text-muted-foreground">{address.city}, {address.street}</p>
                </div>

                {/* Delivery summary */}
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      {stepLabels.delivery}
                    </h3>
                    <button
                      onClick={() => setCurrentStep('delivery')}
                      className="text-sm text-primary hover:underline"
                    >
                      {locale === 'ru' ? 'Изменить' : 'O\'zgartirish'}
                    </button>
                  </div>
                  <p className="text-sm">
                    {deliveryMethod === 'express'
                      ? (locale === 'ru' ? 'Экспресс доставка' : 'Tezkor yetkazish')
                      : (locale === 'ru' ? 'Стандартная доставка' : 'Oddiy yetkazish')}
                  </p>
                </div>

                {/* Payment summary */}
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      {stepLabels.payment}
                    </h3>
                    <button
                      onClick={() => setCurrentStep('payment')}
                      className="text-sm text-primary hover:underline"
                    >
                      {locale === 'ru' ? 'Изменить' : 'O\'zgartirish'}
                    </button>
                  </div>
                  <p className="text-sm">
                    {paymentMethod === 'cash' ? (locale === 'ru' ? 'Наличные' : 'Naqd pul') : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                  </p>
                </div>

                {/* Items */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-bold mb-4">
                    {locale === 'ru' ? 'Товары' : 'Mahsulotlar'} ({itemCount})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto thin-scrollbar">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
                          {item.image ? (
                            <Image src={item.image} alt={item.nameUz} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-lg">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-1">{locale === 'ru' && item.nameRu ? item.nameRu : item.nameUz}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} x {formatPrice(item.price)}</p>
                        </div>
                        <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goBack}
              disabled={stepIndex === 0}
              className={`btn-glass px-5 py-2.5 text-sm flex items-center gap-2 ${
                stepIndex === 0 ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              {locale === 'ru' ? 'Назад' : 'Ortga'}
            </button>

            {currentStep === 'confirm' ? (
              <button
                onClick={handlePlaceOrder}
                className="liquid-btn px-8 py-3 text-base font-semibold flex items-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                {t('checkout')}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="liquid-btn px-6 py-2.5 text-sm flex items-center gap-2"
              >
                {locale === 'ru' ? 'Далее' : 'Keyingi'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-5 sm:p-6 sticky top-24 space-y-4">
            <h3 className="font-bold text-lg">{t('orderSummary')}</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {locale === 'ru' ? 'Товары' : 'Mahsulotlar'} ({itemCount})
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('delivery')}</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {deliveryFee === 0 ? t('free') : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>{t('total')}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              {locale === 'ru'
                ? 'Безопасная покупка — ваши данные защищены'
                : 'Xavfsiz xarid — ma\'lumotlaringiz himoyalangan'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RedirectToCart() {
  const router = useRouter();
  useEffect(() => { router.replace('/cart'); }, [router]);
  return null;
}