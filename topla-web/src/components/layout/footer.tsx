'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/store/locale-store';
import { SupportPhoneLink, useSupportEmail, useTelegramLink, useInstagramLink, useYoutubeLink } from '@/hooks/useSettings';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const email = useSupportEmail();
  const telegramLink = useTelegramLink();
  const instagramLink = useInstagramLink();
  const youtubeLink = useYoutubeLink();

  return (
    <footer className="relative mt-8 border-t border-border bg-muted/50">
      <div className="site-container py-8 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">

          {/* Company */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-base font-bold text-foreground mb-3">TOPLA.UZ</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs leading-relaxed">
              {t('about') === 'О нас'
                ? "Узбекистанский маркетплейс. Тысячи магазинов, миллионы товаров."
                : "O'zbekistonning eng yirik marketplace platformasi."
              }
            </p>
            <div className="flex gap-2">
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener"
                className="w-9 h-9 rounded-full bg-[#2AABEE] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                aria-label="Telegram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/></svg>
              </a>
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a
                href={youtubeLink}
                target="_blank"
                rel="noopener"
                className="w-9 h-9 rounded-full bg-[#FF0000] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                aria-label="YouTube"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* For Buyers */}
          <div>
            <h4 className="font-semibold text-xs text-foreground mb-3">{t('forBuyers')}</h4>
            <ul className="space-y-2">
              {[
                { href: '/about', label: t('about') },
                { href: '/help', label: t('help') },
                { href: '/terms', label: t('termsOfService') },
                { href: '/privacy', label: t('privacyPolicy') },
                { href: '/refund-policy', label: t('refundPolicy') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="font-semibold text-xs text-foreground mb-3">{t('forSellers')}</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://vendor.topla.uz"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  {t('sellerCenter')} <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              </li>
              <li>
                <a href="https://vendor.topla.uz/register" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('becomeSeller')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-xs text-foreground mb-3">{t('contactUs')}</h4>
            <ul className="space-y-2">
              <li>
                <SupportPhoneLink className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="w-3 h-3" />
                </SupportPhoneLink>
              </li>
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-3 h-3" /> {email}
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> Toshkent, O&apos;zbekiston
                </div>
              </li>
            </ul>

          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">
            © {currentYear} TOPLA.UZ — {t('allRightsReserved')}
          </p>
          <div className="flex gap-3">
            <Link href="/terms" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              {t('termsOfService')}
            </Link>
            <Link href="/privacy" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              {t('privacyPolicy')}
            </Link>
            <Link href="/refund-policy" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              {t('refundPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
