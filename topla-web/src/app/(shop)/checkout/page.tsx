'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { resolveImageUrl } from '@/lib/api/upload';
import {
  MapPin, CreditCard, Truck, Check, ChevronRight,
  ShieldCheck, ArrowRight, ArrowLeft, LocateFixed, Package, Banknote,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/store/locale-store';
import { useAuthStore } from '@/store/auth-store';
import { createRequest } from '@/lib/api/base-client';

// Authenticated request for shop customers (reuses user-auth token config)
const userRequest = createRequest({
  tokenKey: 'topla_user',
  loginRedirect: null,
});

type Step = 'address' | 'delivery' | 'payment' | 'confirm';

interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
}

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
  const { user, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Form state — auto-fill from auth
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    city: '',
    street: '',
    note: '',
  });

  // Auto-fill from logged-in user
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);
  const [locatingAddress, setLocatingAddress] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'pickup'>('courier');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [showPickupModal, setShowPickupModal] = useState(false);

  const itemCount = getItemCount();
  const subtotal = getTotal();

  // Dynamic delivery fee from backend
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryTimeDisplay, setDeliveryTimeDisplay] = useState('');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);
  const total = subtotal + deliveryFee;

  // Fetch delivery info from backend
  useEffect(() => {
    if (deliveryMethod === 'pickup') {
      setDeliveryFee(0);
      setDeliveryTimeDisplay('');
      return;
    }
    const fetchDelivery = async () => {
      try {
        const params = new URLSearchParams({
          deliveryMethod,
          subtotal: subtotal.toString(),
        });
        const res = await userRequest<{ deliveryFee: number; freeDeliveryThreshold: number; isFreeDelivery: boolean; deliveryEstimate?: { displayText?: string } }>(`/orders/delivery-info?${params}`);
        if (res) {
          const d = res;
          setDeliveryFee(d.isFreeDelivery ? 0 : (d.deliveryFee || 0));
          setFreeDeliveryThreshold(d.freeDeliveryThreshold || 0);
          setIsFreeDelivery(d.isFreeDelivery || false);
          setDeliveryTimeDisplay(d.deliveryEstimate?.displayText || '');
        }
      } catch {
        // Fallback
        setDeliveryFee(subtotal > 100000 ? 0 : 15000);
      }
    };
    fetchDelivery();
  }, [deliveryMethod, subtotal]);

  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  const stepLabels: Record<Step, string> = {
    address: t('checkoutStepAddress'),
    delivery: t('checkoutStepDelivery'),
    payment: t('checkoutStepPayment'),
    confirm: t('checkoutStepConfirm'),
  };

  const goNext = () => {
    const i = stepIndex;
    if (i < steps.length - 1) setCurrentStep(steps[i + 1].key);
  };

  const goBack = () => {
    const i = stepIndex;
    if (i > 0) {
      setCurrentStep(steps[i - 1].key);
    } else {
      router.back();
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      setOrderError(t('checkoutLoginRequired'));
      return;
    }

    if (!address.fullName || !address.phone) {
      setOrderError(t('checkoutFillNamePhone'));
      return;
    }

    setIsSubmitting(true);
    setOrderError('');

    try {
      const orderData = {
        deliveryMethod,
        paymentMethod,
        recipientName: address.fullName,
        recipientPhone: address.phone,
        note: address.note || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        })),
      };

      const result = await userRequest<OrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      setOrderNumber(result.orderNumber || '');
      setOrderPlaced(true);
      clearCart();
    } catch (error: any) {
      const message = error?.data?.message || error?.message || '';
      setOrderError(
        message ||
        t('checkoutOrderError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Geolocation → reverse geocode
  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert(t('checkoutGeoNotSupported'));
      return;
    }
    setLocatingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${locale === 'ru' ? 'ru' : 'uz'}`,
            { headers: { 'User-Agent': 'topla.uz/1.0' } }
          );
          if (!res.ok) throw new Error('Geocode failed');
          const data = await res.json();
          const a = data.address || {};
          const road = a.road || a.pedestrian || a.street || '';
          const house = a.house_number || '';
          const district = a.suburb || a.city_district || a.neighbourhood || '';
          const city = a.city || a.town || a.village || a.state || '';
          const streetParts = [road, house, district].filter(Boolean);
          setAddress((prev) => ({
            ...prev,
            street: streetParts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '',
            city: prev.city || city,
          }));
        } catch {
          alert(t('checkoutGeoFailed'));
        } finally {
          setLocatingAddress(false);
        }
      },
      (err) => {
        setLocatingAddress(false);
        if (err.code === 1) {
          alert(t('checkoutGeoPermission'));
        } else {
          alert(t('checkoutGeoLocationFailed'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  if (items.length === 0 && !orderPlaced) {
    return <RedirectToCart />;
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
            {t('checkoutOrderPlaced')}
          </h1>
          {orderNumber && (
            <p className="text-lg font-semibold text-primary mb-2">
              {t('checkoutOrderNumber')}: #{orderNumber}
            </p>
          )}
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t('checkoutOrderConfirmMsg')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/orders" className="btn-glass inline-flex items-center gap-2 px-6 py-3">
              {t('checkoutMyOrders')}
            </Link>
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
            {/* ── Address step ── */}
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
                  {/* Full name */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t('checkoutFullName')}
                    </label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full bg-muted border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 px-4 py-3 rounded-xl text-[16px] outline-none transition-all box-border"
                      placeholder={t('checkoutNamePlaceholder')}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t('checkoutPhone')}
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full bg-muted border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 px-4 py-3 rounded-xl text-[16px] outline-none transition-all box-border"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>

                  {/* Street / house with location button */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t('checkoutStreet')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        className="w-full bg-muted border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 px-4 py-3 pr-12 rounded-xl text-[16px] outline-none transition-all box-border"
                        placeholder={t('checkoutStreetPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={handleLocate}
                        disabled={locatingAddress}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                        title={t('checkoutDetectLocation')}
                      >
                        <LocateFixed className={`w-4.5 h-4.5 text-primary ${locatingAddress ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">
                      {t('checkoutComment')}
                    </label>
                    <textarea
                      value={address.note}
                      onChange={(e) => setAddress({ ...address, note: e.target.value })}
                      className="w-full bg-muted border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 px-4 py-3 rounded-xl text-[16px] outline-none resize-none transition-all box-border"
                      rows={3}
                      placeholder={t('checkoutCommentPlaceholder')}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Delivery step ── */}
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
                  {/* Topshirish punkti */}
                  <button
                    type="button"
                    onClick={() => setShowPickupModal(true)}
                    className="w-full glass rounded-xl p-4 text-left flex items-center gap-4 transition-all hover:ring-2 hover:ring-border"
                  >
                    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {t('checkoutPickup')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('checkoutPickupDesc')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {/* Kuryer */}
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('courier')}
                    className={`w-full glass rounded-xl p-4 text-left flex items-center gap-4 transition-all ${
                      deliveryMethod === 'courier' ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {t('checkoutCourier')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('checkoutCourierDesc')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-green-600 text-sm">
                        {subtotal > 100000
                          ? t('checkoutFreeLabel')
                          : formatPrice(15000)}
                      </span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Payment step ── */}
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
                  {/* Naqd pul */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`w-full glass rounded-xl p-4 text-left flex items-center gap-4 transition-all ${
                      paymentMethod === 'cash' ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cash' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('checkoutCash')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('checkoutCashDesc')}
                      </p>
                    </div>
                  </button>

                  {/* Karta orqali */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full glass rounded-xl p-4 text-left flex items-center gap-4 transition-all ${
                      paymentMethod === 'card' ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'card' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('checkoutCard')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('checkoutCardOnline')}
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Confirm step ── */}
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
                      {t('checkoutChange')}
                    </button>
                  </div>
                  <p className="text-sm">{address.fullName || '—'}</p>
                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                  <p className="text-sm text-muted-foreground">{address.city}{address.street ? `, ${address.street}` : ''}</p>
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
                      {t('checkoutChange')}
                    </button>
                  </div>
                  <p className="text-sm">
                    {t('checkoutCourierSummary')}
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
                      {t('checkoutChange')}
                    </button>
                  </div>
                  <p className="text-sm">
                    {paymentMethod === 'cash'
                      ? t('checkoutCash')
                      : t('checkoutCard')}
                  </p>
                </div>

                {/* Items */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-bold mb-4">
                    {t('checkoutProducts')} ({itemCount})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto thin-scrollbar">
                    {items.map((item) => (
                      <div key={`${item.productId}-${item.variantId || ''}`} className="flex gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
                          {item.image ? (
                            <Image src={resolveImageUrl(item.image)} alt={item.nameUz} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-lg">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-1">{locale === 'ru' && item.nameRu ? item.nameRu : item.nameUz}</p>
                          {item.variantLabel && (
                            <p className="text-[10px] text-primary/70">{item.variantLabel}</p>
                          )}
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
              className="btn-glass px-5 py-2.5 text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('checkoutBack')}
            </button>

            {currentStep === 'confirm' ? (
              <div className="flex flex-col items-end gap-2">
                {orderError && (
                  <p className="text-sm text-red-500 text-right max-w-sm">{orderError}</p>
                )}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="liquid-btn px-8 py-3 text-base font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('checkoutSubmitting')}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      {t('checkout')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={goNext}
                className="liquid-btn px-6 py-2.5 text-sm flex items-center gap-2"
              >
                {t('checkoutNext')}
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
                  {t('checkoutProducts')} ({itemCount})
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('delivery')}</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {deliveryFee === 0 ? t('free') : formatPrice(deliveryFee)}
                </span>
              </div>
              {deliveryTimeDisplay && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{deliveryTimeDisplay}</span>
                </div>
              )}
              {!isFreeDelivery && freeDeliveryThreshold > 0 && (
                <p className="text-xs text-green-600 italic">
                  {locale === 'ru'
                    ? `${t('checkoutFreeDeliveryHint')} ${formatPrice(freeDeliveryThreshold)}`
                    : `${formatPrice(freeDeliveryThreshold)} ${t('checkoutFreeDeliveryHint')}`}
                </p>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>{t('total')}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              {t('checkoutSafetyNote')}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pickup modal ── */}
      <AnimatePresence>
        {showPickupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPickupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-orange-50 mx-auto flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {t('checkoutPickupPoints')}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t('checkoutPickupComingSoon')}
              </p>
              <button
                onClick={() => setShowPickupModal(false)}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                {t('checkoutUnderstood')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RedirectToCart() {
  const router = useRouter();
  useEffect(() => { router.replace('/cart'); }, [router]);
  return null;
}