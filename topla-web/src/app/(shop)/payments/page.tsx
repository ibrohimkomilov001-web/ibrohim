'use client';

import Link from 'next/link';
import { ArrowLeft, CreditCard, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/store/locale-store';

export default function PaymentsPage() {
  const { t, locale } = useTranslation();

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/profile"
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">{t('paymentMethods')}</h1>
        </div>

        {/* Empty state */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <CreditCard className="w-9 h-9 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-700 mb-1">
            {locale === 'ru' ? 'Нет способов оплаты' : 'To\'lov usullari yo\'q'}
          </h2>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            {locale === 'ru'
              ? 'Добавьте карту для быстрой оплаты'
              : 'Tez to\'lov qilish uchun karta qo\'shing'}
          </p>
          <button className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" />
            {locale === 'ru' ? 'Добавить карту' : 'Karta qo\'shish'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
