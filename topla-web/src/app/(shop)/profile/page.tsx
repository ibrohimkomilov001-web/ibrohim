'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Heart, MapPin, CreditCard, Globe,
  HelpCircle, ChevronRight, Store, Star, ArrowLeft,
  User, Phone, X, LogOut, Check, Home, Monitor, Smartphone, Tablet, Trash2, MapPinned, Laptop, Pencil,
  Sun, Moon, RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/store/locale-store';
import { useAuthStore } from '@/store/auth-store';
import { userAuthApi, type UserDevice } from '@/lib/api/user-auth';

const UZ_REGIONS = [
  "Toshkent shahri", "Toshkent viloyati", "Andijon", "Farg'ona",
  "Namangan", "Samarqand", "Buxoro", "Navoiy",
  "Qashqadaryo", "Surxondaryo", "Jizzax", "Sirdaryo",
  "Xorazm", "Qoraqalpog'iston",
];

// Format phone: 90 123 45 67
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

function getRawDigits(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

type LoginStep = 'phone' | 'code' | 'name' | 'details';

export default function ProfilePage() {
  const { t, locale } = useTranslation();
  const { user, isAuthenticated, login, loginWithGoogle, loginWithPasskey, logout, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [showLogin, setShowLogin] = useState(false);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [devicesModalOpen, setDevicesModalOpen] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [region, setRegion] = useState('');
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (devicesModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [devicesModalOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 9);
    setPhone(formatPhone(raw));
    setError('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = getRawDigits(phone);
    if (d.length !== 9) return;
    setLoading(true);
    setError('');
    try {
      await userAuthApi.sendOtp(`+998${d}`);
      setLoginStep('code');
      setCountdown(60);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch (err: any) {
      setError(err.message || (locale === 'ru' ? 'Ошибка отправки' : 'Xatolik yuz berdi'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 5) return;
    setLoading(true);
    setError('');
    try {
      const d = getRawDigits(phone);
      const result = await login(`+998${d}`, otpCode);
      if (result.success) {
        if (result.isNewUser || !useAuthStore.getState().user?.fullName) {
          setLoginStep('name');
        } else {
          resetLogin();
        }
      } else {
        setError(result.error || (locale === 'ru' ? 'Неверный код' : 'Kod noto\'g\'ri'));
      }
    } catch (err: any) {
      setError(err.message || (locale === 'ru' ? 'Ошибка' : 'Xatolik'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const updated = await userAuthApi.updateProfile({ fullName: fullName.trim() });
      setUser(updated);
      setLoginStep('details');
    } catch (err: any) {
      setError(err.message || (locale === 'ru' ? 'Ошибка' : 'Xatolik'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, any> = {};
      if (gender) payload.gender = gender;
      if (birthDate) payload.birthDate = new Date(birthDate).toISOString();
      if (region) payload.region = region;
      if (Object.keys(payload).length > 0) {
        const updated = await userAuthApi.updateProfile(payload);
        setUser(updated);
      }
      resetLogin();
    } catch (err: any) {
      setError(err.message || (locale === 'ru' ? 'Ошибка' : 'Xatolik'));
    } finally {
      setLoading(false);
    }
  };

  const resetLogin = () => {
    setShowLogin(false);
    setLoginStep('phone');
    setPhone('');
    setOtpCode('');
    setFullName('');
    setGender('');
    setBirthDate('');
    setRegion('');
    setError('');
    setCountdown(0);
  };

  const loadDevices = async () => {
    setDevicesLoading(true);
    try {
      const list = await userAuthApi.getDevices();
      setDevices(list);
    } catch { /* ignore */ }
    setDevicesLoading(false);
  };

  // Load devices when authenticated
  useEffect(() => {
    if (isAuthenticated) loadDevices();
  }, [isAuthenticated]);

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    const d = getRawDigits(phone);
    setLoading(true);
    try {
      await userAuthApi.sendOtp(`+998${d}`);
      setCountdown(60);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      setError(locale === 'ru' ? 'Google kirish sozlanmagan' : 'Google kirish sozlanmagan');
      return;
    }
    const redirectUri = `${window.location.origin.replace(/^https?:\/\/[^.]+\.topla\.uz/, 'https://topla.uz')}/profile`;
    const scope = 'openid email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=select_account`;
    const popup = window.open(authUrl, 'google-oauth', 'width=500,height=600,scrollbars=yes');
    if (!popup) {
      setError(locale === 'ru' ? 'Popup blokirovka qilindi' : 'Popup bloklangan, ruxsat bering');
      return;
    }
    setGoogleLoading(true);
    setError('');
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setGoogleLoading(false);
      if (!popup.closed) popup.close();
    }, 2 * 60 * 1000);
    const pollInterval = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(pollInterval);
          clearTimeout(timeout);
          setGoogleLoading(false);
          return;
        }
        const url = popup.location.href;
        if (url && url.includes('access_token=')) {
          clearInterval(pollInterval);
          clearTimeout(timeout);
          popup.close();
          const hash = new URL(url).hash;
          const params = new URLSearchParams(hash.slice(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            const result = await loginWithGoogle(accessToken);
            if (result.success) {
              const currentUser = useAuthStore.getState().user;
              if (!currentUser?.fullName) {
                setLoginStep('name');
              } else if (result.isNewUser) {
                setLoginStep('details');
              } else {
                resetLogin();
              }
            } else {
              setError(result.error || (locale === 'ru' ? 'Google orqali kirishda xatolik' : 'Google orqali kirishda xatolik'));
            }
          }
          setGoogleLoading(false);
        }
      } catch {
        // Cross-origin tekshiruv — Google sahifasida, normal
      }
    }, 500);
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setError('');
    try {
      const result = await loginWithPasskey();
      if (result.success) {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser?.fullName) {
          setLoginStep('name');
        } else if (result.isNewUser) {
          setLoginStep('details');
        } else {
          resetLogin();
        }
      } else {
        setError(result.error || (locale === 'ru' ? 'Passkey xatolik' : 'Passkey xatolik'));
      }
    } catch {
      setError(locale === 'ru' ? 'Passkey qo\'llab-quvvatlanmaydi' : 'Passkey qo\'llab-quvvatlanmaydi');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const digits = getRawDigits(phone);

  // ===== SECTIONS =====
  const shoppingItems = [
    { href: '/orders', icon: ShoppingBag, label: t('myOrders'), color: 'text-muted-foreground' },
    { href: '/returns', icon: RotateCcw, label: t('returnsAndRefunds'), color: 'text-muted-foreground' },
    { href: '/reviews', icon: Star, label: t('reviewsAndQuestions'), color: 'text-muted-foreground' },
  ];

  const accountItems = [
    { href: '/favorites', icon: Heart, label: t('favorites'), color: 'text-muted-foreground' },
    { href: '/addresses', icon: MapPin, label: t('myAddresses'), color: 'text-muted-foreground' },
    { href: '/payments', icon: CreditCard, label: t('paymentMethods'), color: 'text-muted-foreground' },
  ];

  const MenuItem = ({ item, index }: { item: typeof shoppingItems[0]; index: number }) => {
    const Icon = item.icon;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Link
          href={item.href}
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted active:scale-[0.98] transition-all group"
        >
          <Icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.5} />
          <span className="flex-1 text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">
            {item.label}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </motion.div>
    );
  };

  // ===== LOGIN FLOW SCREEN =====
  if (showLogin && !isAuthenticated) {
    return (
      <div className="site-container py-4 sm:py-6">
        <div className="max-w-lg mx-auto">
          {/* Navigatsiya qatori */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                if (loginStep === 'code') { setLoginStep('phone'); setOtpCode(''); setError(''); }
                else if (loginStep === 'name') { /* must enter name */ }
                else if (loginStep === 'details') { /* optional — skip forward */ }
                else { resetLogin(); }
              }}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">
                {locale === 'ru' ? 'Назад' : 'Orqaga'}
              </span>
            </button>
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Home className="w-4 h-4" />
              <span>{locale === 'ru' ? 'На главную' : 'Bosh sahifa'}</span>
            </Link>
          </div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card border border-border shadow-sm p-6"
          >
            <AnimatePresence mode="wait">
              {/* ===== STEP 1: PHONE ===== */}
              {loginStep === 'phone' && (
                <motion.div key="phone-step" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Phone className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">
                      {locale === 'ru' ? 'Вход в аккаунт' : 'Hisobga kirish'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locale === 'ru' ? 'Введите номер телефона' : 'Telefon raqamingizni kiriting'}
                    </p>
                  </div>

                  <form onSubmit={handleSendOtp}>
                    <div className="flex items-center h-12 rounded-xl bg-muted border border-border focus-within:border-primary/40 focus-within:bg-background transition-all px-3 gap-2">
                      <span className="text-[16px] text-muted-foreground font-medium select-none">+998</span>
                      <div className="w-px h-6 bg-border" />
                      <input
                        ref={inputRef}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="90 123 45 67"
                        className="flex-1 bg-transparent border-none outline-none text-[16px] text-foreground placeholder:text-muted-foreground min-w-0"
                        autoFocus
                      />
                      {phone && (
                        <button type="button" onClick={() => setPhone('')} className="p-1">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <button
                      type="submit"
                      disabled={digits.length !== 9 || loading}
                      className="w-full mt-4 h-11 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-[0.98] transition-all"
                    >
                      {loading
                        ? (locale === 'ru' ? 'Отправка...' : 'Yuborilmoqda...')
                        : (locale === 'ru' ? 'Получить код' : 'Kodni olish')}
                    </button>
                  </form>

                  <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
                    {locale === 'ru'
                      ? 'Нажимая кнопку, вы соглашаетесь с условиями использования'
                      : "Davom etish orqali foydalanish shartlariga rozilik bildirasiz"}
                  </p>

                  {/* Ajratuvchi */}
                  <div className="flex items-center gap-3 mt-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{locale === 'ru' ? 'или' : 'yoki'}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Google orqali kirish */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="w-full mt-4 h-11 rounded-xl border border-border bg-card flex items-center justify-center gap-2.5 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <div className="w-4 h-4 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    {locale === 'ru' ? 'Войти через Google' : 'Google orqali kirish'}
                  </button>

                  {/* Passkey orqali kirish */}
                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={passkeyLoading || loading}
                    className="w-full mt-3 h-11 rounded-xl border border-border bg-card flex items-center justify-center gap-2.5 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {passkeyLoading ? (
                      <div className="w-4 h-4 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                      </svg>
                    )}
                    {locale === 'ru' ? 'Войти с Passkey' : 'Kirish kaliti bilan kirish'}
                  </button>
                </motion.div>
              )}

              {/* ===== STEP 2: OTP CODE ===== */}
              {loginStep === 'code' && (
                <motion.div key="code-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">
                      {locale === 'ru' ? 'Введите код' : 'Kodni kiriting'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locale === 'ru'
                        ? `Код отправлен на +998 ${phone}`
                        : `Kod +998 ${phone} raqamiga yuborildi`}
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp}>
                    <input
                      ref={codeInputRef}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5)); setError(''); }}
                      placeholder="• • • • •"
                      maxLength={5}
                      className="w-full h-14 rounded-xl bg-muted border border-border text-center text-2xl font-bold tracking-[0.5em] text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background outline-none transition-all"
                      autoFocus
                    />

                    {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

                    <button
                      type="submit"
                      disabled={otpCode.length < 5 || loading}
                      className="w-full mt-4 h-11 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-[0.98] transition-all"
                    >
                      {loading
                        ? (locale === 'ru' ? 'Проверка...' : 'Tekshirilmoqda...')
                        : (locale === 'ru' ? 'Подтвердить' : 'Tasdiqlash')}
                    </button>
                  </form>

                  <div className="text-center mt-4">
                    {countdown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {locale === 'ru' ? `Повторная отправка через ${countdown}с` : `Qayta yuborish ${countdown}s`}
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        {locale === 'ru' ? 'Отправить код повторно' : 'Kodni qayta yuborish'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 3: FULL NAME (new user) ===== */}
              {loginStep === 'name' && (
                <motion.div key="name-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                      <User className="w-7 h-7 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">
                      {locale === 'ru' ? 'Как вас зовут?' : 'Ismingiz nima?'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locale === 'ru'
                        ? 'Укажите ваше полное имя для доставки'
                        : 'Yetkazib berish uchun to\'liq ismingizni kiriting'}
                    </p>
                  </div>

                  <form onSubmit={handleSaveName}>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setError(''); }}
                      placeholder={locale === 'ru' ? 'Иван Иванов' : 'Ism Familiya'}
                      className="w-full h-12 rounded-xl bg-muted border border-border px-4 text-[16px] text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background outline-none transition-all"
                      autoFocus
                    />

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <button
                      type="submit"
                      disabled={!fullName.trim() || loading}
                      className="w-full mt-4 h-11 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-[0.98] transition-all"
                    >
                      {loading
                        ? (locale === 'ru' ? 'Сохранение...' : 'Saqlanmoqda...')
                        : (locale === 'ru' ? 'Продолжить' : 'Davom etish')}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ===== STEP 4: DEMOGRAPHICS (optional) ===== */}
              {loginStep === 'details' && (
                <motion.div key="details-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
                      <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">
                      {locale === 'ru' ? 'О вас' : 'Siz haqingizda'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locale === 'ru' ? 'Необязательно — можно пропустить' : 'Ixtiyoriy — o\'tkazib yuborish mumkin'}
                    </p>
                  </div>

                  <form onSubmit={handleSaveDetails} className="space-y-4">
                    {/* Gender */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {locale === 'ru' ? 'Пол' : 'Jins'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['male', 'female'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(gender === g ? '' : g)}
                            className={`h-10 rounded-xl text-sm font-medium border transition-all ${
                              gender === g
                                ? 'bg-primary text-white border-primary'
                                : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
                            }`}
                          >
                            {g === 'male'
                              ? (locale === 'ru' ? 'Мужской' : 'Erkak')
                              : (locale === 'ru' ? 'Женский' : 'Ayol')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Birth date */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {locale === 'ru' ? 'Дата рождения' : 'Tug\'ilgan sana'}
                      </p>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                        className="w-full h-12 rounded-xl bg-muted border border-border px-4 text-[16px] text-foreground focus:border-primary/40 focus:bg-background outline-none transition-all"
                      />
                    </div>

                    {/* Region */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {locale === 'ru' ? 'Регион' : 'Viloyat'}
                      </p>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full h-12 rounded-xl bg-muted border border-border px-4 text-[16px] text-foreground focus:border-primary/40 focus:bg-background outline-none transition-all"
                      >
                        <option value="">{locale === 'ru' ? 'Выберите регион' : 'Viloyatni tanlang'}</option>
                        {UZ_REGIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 hover:bg-primary/90 active:scale-[0.98] transition-all"
                    >
                      {loading
                        ? (locale === 'ru' ? 'Сохранение...' : 'Saqlanmoqda...')
                        : (locale === 'ru' ? 'Сохранить' : 'Saqlash')}
                    </button>
                    <button
                      type="button"
                      onClick={resetLogin}
                      className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {locale === 'ru' ? 'Пропустить' : 'O\'tkazib yuborish'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===== MAIN PROFILE SCREEN =====
  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">

        {/* Bosh sahifaga qaytish */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'ru' ? 'На главную' : 'Bosh sahifa'}</span>
        </Link>

        {/* User info or Login button */}
        {isAuthenticated && user ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 mb-6 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[15px] font-semibold text-foreground block truncate">
                {user.fullName || (locale === 'ru' ? 'Пользователь' : 'Foydalanuvchi')}
              </span>
              <span className="text-xs text-muted-foreground block">{user.phone}</span>
              {user.referralCode && (
                <span className="text-[10px] text-primary/60 font-mono">Topla ID: {user.referralCode}</span>
              )}
            </div>
            <button
              onClick={() => router.push('/profile/edit')}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
              title={locale === 'ru' ? 'Редактировать' : 'Tahrirlash'}
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowLogin(true)}
            className="w-full flex items-center gap-4 px-6 py-3 rounded-full bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 hover:from-primary/10 hover:to-primary/15 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[15px] font-semibold text-foreground">
              {locale === 'ru' ? 'Войти в профиль' : 'Profilga kirish'}
            </span>
            <ChevronRight className="w-5 h-5 text-primary/40 ml-auto" />
          </motion.button>
        )}

        {/* ===== SHOPPING SECTION ===== */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            {t('shopping')}
          </h3>
          <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden divide-y divide-border">
            {shoppingItems.map((item, i) => (
              <MenuItem key={item.href} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* ===== ACCOUNT SECTION ===== */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            {t('account')}
          </h3>
          <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden divide-y divide-border">
            {accountItems.map((item, i) => (
              <MenuItem key={item.href} item={item} index={i + shoppingItems.length} />
            ))}
          </div>
        </div>

        {/* ===== SETTINGS SECTION ===== */}
        <div className="mb-6">
          <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden divide-y divide-border">
            {/* Theme toggle */}
            <div className="flex items-center gap-3 px-4 py-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              )}
              <span className="flex-1 text-[13px] font-medium text-foreground">
                {locale === 'ru' ? 'Тёмная тема' : 'Tungi mavzu'}
              </span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`relative w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}
                aria-label="Toggle theme"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Language — opens language page */}
            <Link
              href="/profile/language"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-all group"
            >
              <Globe className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <span className="flex-1 text-[13px] font-medium text-foreground text-left">
                {t('language')}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {locale === 'uz' ? "O'zbek" : 'Русский'}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            {/* Help — opens help page */}
            <Link
              href="/help"
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-all group"
            >
              <HelpCircle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <span className="flex-1 text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">
                {t('helpCenter')}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            {/* Become seller */}
            <Link
              href="https://vendor.topla.uz/register"
              target="_blank"
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-all group"
            >
              <Store className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <div className="flex-1">
                <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors block">
                  {t('openShopAction')}
                </span>
                <span className="text-[11px] text-muted-foreground">{t('becomeSellerDesc')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            {/* Open pickup point */}
            <Link
              href="/pickup"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-all group text-left"
            >
              <MapPinned className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <div className="flex-1">
                <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors block">
                  {locale === 'ru' ? 'Открыть пункт выдачи' : 'Topshirish punkti ochish'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {locale === 'ru' ? 'Станьте партнёром Topla.uz' : 'Topla.uz hamkori bo\'ling'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            {/* Devices */}
            {isAuthenticated && (
              <button
                onClick={() => setDevicesModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-all group text-left"
              >
                <Laptop className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                <div className="flex-1">
                  <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors block">
                    {locale === 'ru' ? 'Устройства' : 'Qurilmalar'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {locale === 'ru' ? `${devices.length} активных` : `${devices.length} ta faol`}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Logout */}
        {isAuthenticated && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm text-muted-foreground font-medium text-sm hover:bg-black/10 dark:hover:bg-white/10 active:scale-[0.98] transition-all mb-6"
          >
            <LogOut className="w-4 h-4" />
            {locale === 'ru' ? 'Выйти' : 'Chiqish'}
          </motion.button>
        )}

      </div>

      {/* ===== DEVICES MODAL ===== */}
      <AnimatePresence>
        {devicesModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDevicesModalOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 w-full sm:relative sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6 shadow-2xl max-h-[80vh] overflow-y-auto overscroll-contain"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)' }}
            >
              <button
                onClick={() => setDevicesModalOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-4.5 h-4.5 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Laptop className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {locale === 'ru' ? 'Активные устройства' : 'Faol qurilmalar'}
                </h3>
              </div>

              {devicesLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {locale === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
                </div>
              ) : devices.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {locale === 'ru' ? 'Нет активных устройств' : 'Faol qurilmalar yo\'q'}
                </div>
              ) : (
                <div className="space-y-2">
                  {devices.map((device) => {
                    const DeviceIcon = device.platform === 'web' ? Monitor
                      : device.platform === 'ios' ? Smartphone
                      : Smartphone;
                    return (
                      <div key={device.id} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted">
                        <DeviceIcon className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">
                            {device.deviceName || device.browser || (locale === 'ru' ? 'Устройство' : 'Qurilma')}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {device.ipAddress}{device.location ? ` · ${device.location}` : ''} ·{' '}
                            {new Date(device.lastActiveAt).toLocaleDateString(locale === 'ru' ? 'ru' : 'uz')}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await userAuthApi.deleteDevice(device.id);
                              setDevices(prev => prev.filter(d => d.id !== device.id));
                            } catch { /* ignore */ }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-400 transition-colors"
                          title={locale === 'ru' ? 'Удалить' : 'O\'chirish'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {devices.length > 1 && (
                <button
                  onClick={async () => {
                    if (!confirm(locale === 'ru'
                      ? 'Выйти со всех других устройств?'
                      : 'Barcha boshqa qurilmalardan chiqishni xohlaysizmi?')) return;
                    try {
                      await userAuthApi.terminateOtherDevices();
                      await loadDevices();
                    } catch { /* ignore */ }
                  }}
                  className="mt-4 w-full py-2.5 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  {locale === 'ru' ? 'Выйти со всех устройств' : 'Barcha qurilmalardan chiqish'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
