'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Heart, MapPin, CreditCard, Globe,
  HelpCircle, ChevronRight, Store, Star, ArrowLeft,
  User, Phone, X, LogOut, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, useLocaleStore } from '@/store/locale-store';
import { useAuthStore } from '@/store/auth-store';
import { userAuthApi } from '@/lib/api/user-auth';

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

type LoginStep = 'phone' | 'code' | 'name';

export default function ProfilePage() {
  const { t, locale } = useTranslation();
  const { setLocale } = useLocaleStore();
  const { user, isAuthenticated, login, logout, setUser } = useAuthStore();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

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
    if (otpCode.length < 4) return;
    setLoading(true);
    setError('');
    try {
      const d = getRawDigits(phone);
      const result = await login(`+998${d}`, otpCode);
      if (result.success) {
        const { user: currentUser } = useAuthStore.getState();
        if (!currentUser?.fullName) {
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
    setError('');
    setCountdown(0);
  };

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

  const digits = getRawDigits(phone);

  // ===== SECTIONS =====
  const shoppingItems = [
    { href: '/orders', icon: ShoppingBag, label: t('myOrders'), color: 'text-gray-500' },
    { href: '/reviews', icon: Star, label: t('reviewsAndQuestions'), color: 'text-gray-500' },
  ];

  const accountItems = [
    { href: '/favorites', icon: Heart, label: t('favorites'), color: 'text-gray-500' },
    { href: '/addresses', icon: MapPin, label: t('myAddresses'), color: 'text-gray-500' },
    { href: '/payments', icon: CreditCard, label: t('paymentMethods'), color: 'text-gray-500' },
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
          className="flex items-center gap-3 px-4 py-3 hover:bg-white/80 active:scale-[0.98] transition-all group"
        >
          <Icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.5} />
          <span className="flex-1 text-[13px] font-medium text-gray-700 group-hover:text-primary transition-colors">
            {item.label}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </motion.div>
    );
  };

  // ===== LOGIN FLOW SCREEN =====
  if (showLogin && !isAuthenticated) {
    return (
      <div className="site-container py-4 sm:py-6">
        <div className="max-w-lg mx-auto">
          {/* Back button */}
          <button
            onClick={() => {
              if (loginStep === 'code') { setLoginStep('phone'); setOtpCode(''); setError(''); }
              else if (loginStep === 'name') { /* must enter name */ }
              else { resetLogin(); }
            }}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">
              {locale === 'ru' ? 'Назад' : 'Orqaga'}
            </span>
          </button>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6"
          >
            <AnimatePresence mode="wait">
              {/* ===== STEP 1: PHONE ===== */}
              {loginStep === 'phone' && (
                <motion.div key="phone-step" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Phone className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {locale === 'ru' ? 'Вход в аккаунт' : 'Hisobga kirish'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {locale === 'ru' ? 'Введите номер телефона' : 'Telefon raqamingizni kiriting'}
                    </p>
                  </div>

                  <form onSubmit={handleSendOtp}>
                    <div className="flex items-center h-12 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-primary/40 focus-within:bg-white transition-all px-3 gap-2">
                      <span className="text-[16px] text-gray-500 font-medium select-none">+998</span>
                      <div className="w-px h-6 bg-gray-200" />
                      <input
                        ref={inputRef}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="90 123 45 67"
                        className="flex-1 bg-transparent border-none outline-none text-[16px] text-gray-800 placeholder:text-gray-300 min-w-0"
                        autoFocus
                      />
                      {phone && (
                        <button type="button" onClick={() => setPhone('')} className="p-1">
                          <X className="w-4 h-4 text-gray-400" />
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

                  <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
                    {locale === 'ru'
                      ? 'Нажимая кнопку, вы соглашаетесь с условиями использования'
                      : "Davom etish orqali foydalanish shartlariga rozilik bildirasiz"}
                  </p>
                </motion.div>
              )}

              {/* ===== STEP 2: OTP CODE ===== */}
              {loginStep === 'code' && (
                <motion.div key="code-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {locale === 'ru' ? 'Введите код' : 'Kodni kiriting'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
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
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                      placeholder="• • • • • •"
                      maxLength={6}
                      className="w-full h-14 rounded-xl bg-gray-50 border border-gray-200 text-center text-2xl font-bold tracking-[0.5em] text-gray-800 placeholder:text-gray-300 focus:border-primary/40 focus:bg-white outline-none transition-all"
                      autoFocus
                    />

                    {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

                    <button
                      type="submit"
                      disabled={otpCode.length < 4 || loading}
                      className="w-full mt-4 h-11 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-[0.98] transition-all"
                    >
                      {loading
                        ? (locale === 'ru' ? 'Проверка...' : 'Tekshirilmoqda...')
                        : (locale === 'ru' ? 'Подтвердить' : 'Tasdiqlash')}
                    </button>
                  </form>

                  <div className="text-center mt-4">
                    {countdown > 0 ? (
                      <p className="text-sm text-gray-400">
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
                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                      <User className="w-7 h-7 text-green-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {locale === 'ru' ? 'Как вас зовут?' : 'Ismingiz nima?'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
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
                      className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 text-[16px] text-gray-800 placeholder:text-gray-300 focus:border-primary/40 focus:bg-white outline-none transition-all"
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
              <span className="text-[15px] font-semibold text-gray-800 block truncate">
                {user.fullName || (locale === 'ru' ? 'Пользователь' : 'Foydalanuvchi')}
              </span>
              <span className="text-xs text-gray-400 block">{user.phone}</span>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowLogin(true)}
            className="w-full flex items-center gap-4 p-4 mb-6 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 hover:from-primary/10 hover:to-primary/15 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-[15px] font-semibold text-gray-800 block">
                {locale === 'ru' ? 'Войти в профиль' : 'Profilga kirish'}
              </span>
              <span className="text-xs text-gray-400">
                {locale === 'ru' ? 'Телефон номер' : 'Telefon raqam orqali'}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-primary/40" />
          </motion.button>
        )}

        {/* ===== SHOPPING SECTION ===== */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            {t('shopping')}
          </h3>
          <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 overflow-hidden divide-y divide-gray-100">
            {shoppingItems.map((item, i) => (
              <MenuItem key={item.href} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* ===== ACCOUNT SECTION ===== */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            {t('account')}
          </h3>
          <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 overflow-hidden divide-y divide-gray-100">
            {accountItems.map((item, i) => (
              <MenuItem key={item.href} item={item} index={i + shoppingItems.length} />
            ))}
          </div>
        </div>

        {/* ===== SETTINGS SECTION ===== */}
        <div className="mb-6">
          <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 overflow-hidden divide-y divide-gray-100">
            {/* Language */}
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/80 transition-all group"
            >
              <Globe className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
              <span className="flex-1 text-[13px] font-medium text-gray-700 text-left">
                {t('language')}
              </span>
              <span className="text-[13px] text-gray-400">
                {locale === 'uz' ? "O'zbek" : 'Русский'}
              </span>
            </button>

            {/* Language selector */}
            <AnimatePresence>
              {langMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/50"
                >
                  <button
                    onClick={() => { setLocale('uz'); setLangMenuOpen(false); }}
                    className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                      locale === 'uz' ? 'text-primary font-semibold bg-primary/5' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {"O'zbek tili"}
                  </button>
                  <button
                    onClick={() => { setLocale('ru'); setLangMenuOpen(false); }}
                    className={`w-full px-4 py-3 text-sm text-left transition-colors border-t border-gray-100 ${
                      locale === 'ru' ? 'text-primary font-semibold bg-primary/5' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Русский язык
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Help */}
            <Link
              href="/help"
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/80 transition-all group"
            >
              <HelpCircle className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
              <span className="flex-1 text-[13px] font-medium text-gray-700 group-hover:text-primary transition-colors">
                {t('helpCenter')}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>

            {/* Become seller */}
            <Link
              href="https://vendor.topla.uz/register"
              target="_blank"
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/80 transition-all group"
            >
              <Store className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
              <div className="flex-1">
                <span className="text-[13px] font-medium text-gray-700 group-hover:text-primary transition-colors block">
                  {t('openShopAction')}
                </span>
                <span className="text-[11px] text-gray-400">{t('becomeSellerDesc')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          </div>
        </div>

        {/* Logout */}
        {isAuthenticated && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-500 font-medium text-sm hover:bg-red-100 active:scale-[0.98] transition-all mb-6"
          >
            <LogOut className="w-4 h-4" />
            {locale === 'ru' ? 'Выйти' : 'Chiqish'}
          </motion.button>
        )}

      </div>
    </div>
  );
}
