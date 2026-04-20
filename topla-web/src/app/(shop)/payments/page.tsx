'use client';

import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useTranslation } from '@/store/locale-store';
import { EmptyState } from '@/components/shop/empty-state';

export default function PaymentsPage() {
  const { t, locale } = useTranslation();

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/profile"
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">{t('paymentMethods')}</h1>
        </div>

        <EmptyState
          icon={CreditCard}
          title={locale === 'ru' ? 'Нет способов оплаты' : "To'lov usullari yo'q"}
          description={
            locale === 'ru'
              ? 'Добавьте карту для быстрой оплаты — мы поддерживаем UzCard, Humo и Visa'
              : "Tez to'lov uchun karta qo'shing \u2014 UzCard, Humo va Visa qo'llab-quvvatlanadi"
          }
          actionLabel={locale === 'ru' ? 'Добавить карту' : "Karta qo'shish"}
          onAction={() => alert(locale === 'ru' ? 'Скоро' : 'Tez orada')}
        />
      </div>
    </div>
  );
}
