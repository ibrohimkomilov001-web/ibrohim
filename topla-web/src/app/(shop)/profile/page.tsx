'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User, ShoppingBag, Heart, MapPin, CreditCard, Globe,
  HelpCircle, LogOut, ChevronRight, Store, ShoppingCart,
  Package, RotateCcw, Star, Users, Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation, useLocaleStore } from '@/store/locale-store';
import { useAuthStore } from '@/store/auth-store';
import { OtpLogin } from '@/components/auth/otp-login';

export default function ProfilePage() {
  const { t, locale } = useTranslation();
  const { setLocale } = useLocaleStore();
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuthStore();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
  };

  // ===== SECTIONS (matching Flutter app exactly) =====

  // Shopping section items
  const shoppingItems = [
    { href: '/orders', icon: ShoppingBag, label: t('myOrders'), color: 'text-blue-500', bg: 'bg-blue-50' },
    { href: '/purchased', icon: Package, label: t('purchasedProducts'), color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { href: '/returns', icon: RotateCcw, label: t('returnsAndRefunds'), color: 'text-orange-500', bg: 'bg-orange-50' },
    { href: '/reviews', icon: Star, label: t('reviewsAndQuestions'), color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  // Account section items
  const accountItems = [
    { href: '/favorites', icon: Heart, label: t('favorites'), color: 'text-red-400', bg: 'bg-red-50' },
    { href: '/addresses', icon: MapPin, label: t('myAddresses'), color: 'text-green-500', bg: 'bg-green-50' },
    { href: '/payments', icon: CreditCard, label: t('paymentMethods'), color: 'text-purple-500', bg: 'bg-purple-50' },
    { href: '/invite', icon: Users, label: t('inviteFriends'), color: 'text-blue-400', bg: 'bg-blue-50' },
  ];

  // Menu item renderer
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
          className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80 active:scale-[0.98] transition-all group"
        >
          <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
            {item.label}
          </span>
          <ChevronRight className="w-4.5 h-4.5 text-gray-300 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">

        {/* Loading state */}
        {isLoading && (
          <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 p-10 flex items-center justify-center mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* === NOT AUTHENTICATED — Login card === */}
        {!isLoading && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {/* Guest profile card */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/10 p-5 mb-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">
                  {locale === 'ru' ? 'Гость' : 'Mehmon'}
                </h2>
                <p className="text-sm text-gray-500">
                  {locale === 'ru' ? 'Войдите в аккаунт' : 'Hisobingizga kiring'}
                </p>
              </div>
            </div>
            <OtpLogin />
          </motion.div>
        )}

        {/* === AUTHENTICATED — User card === */}
        {!isLoading && isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 p-5 mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-800 truncate">
                  {user.fullName || (locale === 'ru' ? 'Пользователь' : 'Foydalanuvchi')}
                </h2>
                <p className="text-sm text-gray-500">{user.phone}</p>
                {user.email && <p className="text-sm text-gray-400">{user.email}</p>}
              </div>
              <Link
                href="/profile/edit"
                className="text-primary text-sm font-medium shrink-0"
              >
                {t('settings')}
              </Link>
            </div>
          </motion.div>
        )}

        {/* ===== SHOPPING SECTION ===== */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            {t('shopping')}
          </h3>
          <div className="space-y-2">
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
          <div className="space-y-2">
            {accountItems.map((item, i) => (
              <MenuItem key={item.href} item={item} index={i + shoppingItems.length} />
            ))}
          </div>
        </div>

        {/* ===== SETTINGS SECTION ===== */}
        <div className="mb-6">
          <div className="space-y-2">
            {/* Language */}
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                <Globe className="w-5 h-5" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">
                {t('language')}
              </span>
              <span className="text-sm text-gray-400">
                {locale === 'uz' ? "O'zbek" : 'Русский'}
              </span>
            </button>

            {/* Language selector */}
            {langMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50"
              >
                <button
                  onClick={() => { setLocale('uz'); setLangMenuOpen(false); }}
                  className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                    locale === 'uz' ? 'text-primary font-semibold bg-primary/5' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  O'zbek tili
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

            {/* Help */}
            <Link
              href="/help"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                {t('helpCenter')}
              </span>
              <ChevronRight className="w-4.5 h-4.5 text-gray-300" />
            </Link>

            {/* Become seller / My shop */}
            <Link
              href="https://vendor.topla.uz/register"
              target="_blank"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors block">
                  {t('openShopAction')}
                </span>
                <span className="text-xs text-gray-400">{t('becomeSellerDesc')}</span>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-gray-300" />
            </Link>
          </div>
        </div>

        {/* Logout button */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 active:scale-[0.98] transition-all"
            >
              <LogOut className="w-4.5 h-4.5" />
              {t('logout')}
            </button>
          </motion.div>
        )}

        {/* App version */}
        <p className="text-center text-xs text-gray-300 mt-6 mb-4">
          topla • web v1.0.0
        </p>
      </div>
    </div>
  );
}
