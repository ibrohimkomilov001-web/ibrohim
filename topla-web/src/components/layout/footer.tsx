'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Send, Instagram, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/store/locale-store';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-16 border-t border-border/50">
      {/* Main footer */}
      <div className="gradient-bg">
        <div className="site-container py-10 sm:py-14">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Company */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  TOPLA
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                {t('about') === 'O нас'
                  ? "Узбекистанская маркетплейс платформа. Тысячи магазинов, миллионы товаров."
                  : "O'zbekistonning eng yirik marketplace platformasi. Minglab do'konlar, millionlab mahsulotlar."
                }
              </p>
              {/* Social links */}
              <div className="flex gap-2">
                <a href="https://t.me/topla_uz" target="_blank" rel="noopener" className="w-9 h-9 rounded-xl btn-glass flex items-center justify-center hover:text-primary transition-colors">
                  <Send className="w-4 h-4" />
                </a>
                <a href="https://instagram.com/topla.uz" target="_blank" rel="noopener" className="w-9 h-9 rounded-xl btn-glass flex items-center justify-center hover:text-primary transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* For Buyers */}
            <div>
              <h4 className="font-semibold text-sm mb-4">{t('forBuyers')}</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('categories')}
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('about')}
                  </Link>
                </li>
                <li>
                  <Link href="/about#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('help')}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('termsOfService')}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('privacyPolicy')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Sellers */}
            <div>
              <h4 className="font-semibold text-sm mb-4">{t('forSellers')}</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="https://vendor.topla.uz" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                    {t('sellerCenter')} <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a href="https://vendor.topla.uz/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('becomeSeller')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-sm mb-4">{t('contactUs')}</h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href="tel:+998901234567" className="hover:text-foreground transition-colors">+998 90 123 45 67</a>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href="mailto:info@topla.uz" className="hover:text-foreground transition-colors">info@topla.uz</a>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Toshkent, O&apos;zbekiston</span>
                </li>
              </ul>

              {/* Payment methods */}
              <div className="mt-5">
                <p className="text-xs text-muted-foreground mb-2">{t('paymentMethods')}</p>
                <div className="flex gap-2 flex-wrap">
                  {['Payme', 'Click', 'Uzcard', 'Humo'].map((method) => (
                    <span
                      key={method}
                      className="px-2.5 py-1 rounded-lg glass text-[10px] font-semibold text-muted-foreground"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {currentYear} TOPLA.UZ — {t('allRightsReserved')}
            </p>
            <div className="flex gap-4">
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {t('termsOfService')}
              </Link>
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {t('privacyPolicy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
