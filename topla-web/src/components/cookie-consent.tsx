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

  const accept = () => {
    localStorage.setItem('topla-cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('topla-cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium mb-1">
              {t('cookieTitle')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('cookieDescription')}{' '}
              <Link href="/privacy" className="underline hover:text-foreground transition-colors">
                {t('privacyPolicy')}
              </Link>
            </p>
          </div>
          <button onClick={decline} className="text-muted-foreground hover:text-foreground shrink-0 p-1" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={accept}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('cookieAccept')}
          </button>
          <button
            onClick={decline}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {t('cookieDecline')}
          </button>
        </div>
      </div>
    </div>
  );
}
