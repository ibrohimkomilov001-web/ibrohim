'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Clock } from 'lucide-react';
import { useTranslation } from '@/store/locale-store';
import { EmptyState } from '@/components/shop/empty-state';

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
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
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
      {activeTab === 'active' ? (
        <EmptyState
          icon={RotateCcw}
          title={locale === 'ru' ? 'Нет активных возвратов' : "Faol qaytarishlar yo'q"}
          description={
            locale === 'ru'
              ? 'Здесь появятся ваши заявки на возврат товара'
              : "Bu yerda qaytarish so'rovlaringiz ko'rinadi"
          }
          actionLabel={locale === 'ru' ? 'Мои заказы' : 'Buyurtmalarim'}
          actionHref="/orders"
        />
      ) : (
        <EmptyState
          icon={Clock}
          title={locale === 'ru' ? 'История пуста' : "Tarix bo'sh"}
          description={
            locale === 'ru'
              ? 'Завершённые возвраты будут показаны здесь'
              : "Yakunlangan qaytarishlar shu yerda ko'rinadi"
          }
        />
      )}
    </div>
  );
}
