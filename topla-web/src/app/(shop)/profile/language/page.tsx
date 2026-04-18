'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useLocaleStore } from '@/store/locale-store';

function UzFlag() {
  return (
    <svg viewBox="0 0 30 20" className="w-10 h-7 rounded-md shadow-sm shrink-0" aria-hidden="true">
      <rect width="30" height="20" fill="#1EB53A" />
      <rect width="30" height="7" fill="#0099B5" />
      <rect y="7" width="30" height="1" fill="#CE1126" />
      <rect width="30" height="6" y="8" fill="#fff" />
      <rect y="14" width="30" height="1" fill="#CE1126" />
      <circle cx="9" cy="3.5" r="2.2" fill="#fff" />
      <circle cx="10" cy="3.5" r="1.8" fill="#0099B5" />
      <rect width="30" height="20" rx="1" fill="none" stroke="#d1d5db" strokeWidth="0.8" />
      {Array.from({ length: 12 }).map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return <circle key={i} cx={13 + col * 1.8} cy={1.5 + row * 1.8} r="0.5" fill="#fff" />;
      })}
    </svg>
  );
}

function RuFlag() {
  return (
    <svg viewBox="0 0 30 20" className="w-10 h-7 rounded-md shadow-sm shrink-0" aria-hidden="true">
      <rect width="30" height="20" rx="1" fill="#fff" />
      <rect y="7" width="30" height="7" fill="#0039A6" />
      <rect y="14" width="30" height="6" fill="#D52B1E" />
      <rect width="30" height="20" rx="1" fill="none" stroke="#d1d5db" strokeWidth="0.8" />
    </svg>
  );
}

export default function LanguagePage() {
  const router = useRouter();
  const { locale, setLocale } = useLocaleStore();

  const handleSelect = (lang: 'uz' | 'ru') => {
    setLocale(lang);
    router.back();
  };

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-[17px] font-semibold text-foreground">
            {locale === 'ru' ? 'Выберите язык' : 'Tilni tanlang'}
          </h1>
        </div>

        {/* Language options card */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <button
            onClick={() => handleSelect('uz')}
            className={`w-full flex items-center gap-4 px-4 py-4 transition-colors ${
              locale === 'uz' ? 'bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <UzFlag />
            <span className={`flex-1 text-left text-[15px] font-medium ${
              locale === 'uz' ? 'text-primary' : 'text-foreground'
            }`}>
              {"O'zbek tili"}
            </span>
            {locale === 'uz' && <Check className="w-5 h-5 text-primary" />}
          </button>

          <div className="h-px bg-border mx-4" />

          <button
            onClick={() => handleSelect('ru')}
            className={`w-full flex items-center gap-4 px-4 py-4 transition-colors ${
              locale === 'ru' ? 'bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <RuFlag />
            <span className={`flex-1 text-left text-[15px] font-medium ${
              locale === 'ru' ? 'text-primary' : 'text-foreground'
            }`}>
              Русский язык
            </span>
            {locale === 'ru' && <Check className="w-5 h-5 text-primary" />}
          </button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          {locale === 'ru'
            ? 'Ваш выбор языка будет сохранён'
            : 'Tilni tanlashingiz saqlanadi'}
        </p>
      </div>
    </div>
  );
}
