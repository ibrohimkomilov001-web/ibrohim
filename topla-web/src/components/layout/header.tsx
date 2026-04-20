'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/store/locale-store';
import { CategoryDrawer } from './category-drawer';
import { SearchOverlay } from '@/components/shop/search-overlay';

export function Header({ className }: { className?: string }) {
  const { t } = useTranslation();
  const cartCount = useCartStore((s) => s.getItemCount());
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={className}>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-background/75 backdrop-blur-xl border-b border-border/60 transition-shadow duration-200',
          scrolled && 'shadow-sm'
        )}
      >
        <div className="pt-[env(safe-area-inset-top)] site-container">
          <div className="flex items-center gap-2 h-12 sm:h-14">
            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label={t('catalog')}
              className="flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            >
              <Menu className="w-[22px] h-[22px] text-foreground" strokeWidth={2.2} />
            </button>

            {/* Search trigger (opens full-screen overlay) */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t('findProducts')}
              className="flex-1 min-w-0 flex items-center h-9 sm:h-10 px-3 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors text-left"
            >
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="ml-2 text-sm text-muted-foreground truncate">
                {t('findProducts')}
              </span>
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`${t('cart')}${cartCount > 0 ? ` (${cartCount})` : ''}`}
              className="relative flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            >
              <ShoppingCart className="w-[21px] h-[21px] text-foreground" strokeWidth={2.2} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <Link
              href="/profile"
              aria-label={t('profile')}
              className="flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px] text-foreground">
                <circle cx="12" cy="6.5" r="3.5"/>
                <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8H4z"/>
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-12 sm:h-14" style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* Category Drawer */}
      <CategoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Search overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
