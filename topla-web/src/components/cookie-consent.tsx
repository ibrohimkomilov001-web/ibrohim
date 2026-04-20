'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useTranslation } from '@/store/locale-store';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const consent = localStorage.getItem('topla-cookie-consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('topla-cookie-consent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-lg p-4">
        <div className="flex items-start gap-3">
          <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
            {t('cookieDescription')}{' '}
            <Link href="/privacy" className="underline hover:text-foreground transition-colors">
              {t('privacyPolicy')}
            </Link>
          </p>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0 p-1" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={dismiss}
          className="mt-3 px-5 py-1.5 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
