'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/store/locale-store';

type Tab = 'active' | 'history';

export default function ReturnsPage() {
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: locale === 'ru' ? 'Активные' : 'Faol' },
    { key: 'history', label: locale === 'ru' ? 'История' : 'Tarix' },
  ];

  return (
    <div className="site-container py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">
          {t('returnsAndRefunds')}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'active' ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Empty state */}
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {locale === 'ru' ? 'Нет активных возвратов' : 'Faol qaytarishlar yo\'q'}
              </p>
              <p className="text-xs text-muted-foreground">
                {locale === 'ru'
                  ? 'Здесь появятся ваши заявки на возврат'
                  : 'Bu yerda qaytarish so\'rovlaringiz ko\'rinadi'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {/* Empty state */}
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {locale === 'ru' ? 'История пуста' : 'Tarix bo\'sh'}
              </p>
              <p className="text-xs text-muted-foreground">
                {locale === 'ru'
                  ? 'Завершённые возвраты будут показаны здесь'
                  : 'Yakunlangan qaytarishlar shu yerda ko\'rinadi'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
