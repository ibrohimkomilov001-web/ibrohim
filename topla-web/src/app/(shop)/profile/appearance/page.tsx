'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLocaleStore } from '@/store/locale-store';

type ThemeOption = 'system' | 'light' | 'dark';

export default function AppearancePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale } = useLocaleStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options: { value: ThemeOption; label: string }[] = [
    {
      value: 'system',
      label: locale === 'ru' ? 'Системная' : 'Sistem',
    },
    {
      value: 'light',
      label: locale === 'ru' ? 'Светлая' : "Yorug'",
    },
    {
      value: 'dark',
      label: locale === 'ru' ? 'Тёмная' : 'Tungi',
    },
  ];

  const current = (mounted ? theme : 'system') as ThemeOption;

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
            aria-label={locale === 'ru' ? 'Назад' : 'Orqaga'}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[17px] font-semibold text-foreground">
            {locale === 'ru' ? 'Оформление' : 'Mavzu'}
          </h1>
        </div>

        <p className="text-sm text-muted-foreground mb-4 px-1">
          {locale === 'ru'
            ? 'Выберите тему оформления сайта'
            : "Sayt ko'rinishi mavzusini tanlang"}
        </p>

        {/* Theme options */}
        <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden divide-y divide-border">
          {options.map((opt) => {
            const active = current === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className="w-full flex items-center px-4 py-3.5 hover:bg-muted active:scale-[0.995] transition-colors text-left"
              >
                <span className="flex-1 text-[14px] font-medium text-foreground">
                  {opt.label}
                </span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    active
                      ? 'bg-blue-600'
                      : 'border-2 border-muted-foreground/30'
                  }`}
                >
                  {active && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
