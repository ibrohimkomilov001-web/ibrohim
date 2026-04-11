'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/store/locale-store';
import { CategoryDrawer } from './category-drawer';

export function Header() {
  const router = useRouter();
  const { t } = useTranslation();
  const cartCount = useCartStore((s) => s.getItemCount());
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Blur input to dismiss keyboard on mobile
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setSearchFocused(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleOverlayClick = () => {
    setSearchFocused(false);
    if (searchRef.current) searchRef.current.blur();
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-white/75 backdrop-blur-xl border-b border-gray-100/60 transition-shadow duration-200',
          scrolled && 'shadow-sm'
        )}
      >
        <div className="pt-[env(safe-area-inset-top)] site-container">
          <div className="flex items-center gap-2 h-12 sm:h-14">
            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label={t('catalog')}
              className="flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <Menu className="w-[20px] h-[20px] text-gray-600" />
            </button>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 min-w-0">
              <div className="flex items-center h-9 sm:h-10 px-3 rounded-xl bg-gray-50 border border-gray-100 transition-all focus-within:bg-white focus-within:border-primary/30 focus-within:shadow-sm">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="search"
                  enterKeyHint="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={t('findProducts')}
                  className="flex-1 bg-transparent border-none outline-none ml-2 text-[16px] sm:text-sm text-gray-800 placeholder:text-gray-400 min-w-0"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="p-2" aria-label="Qidiruvni tozalash">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </form>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`${t('cart')}${cartCount > 0 ? ` (${cartCount})` : ''}`}
              className="relative flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <ShoppingBag className="w-[18px] h-[18px] text-gray-500" />
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
              className="flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <User className="w-[18px] h-[18px] text-gray-500" />
            </Link>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchFocused && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={handleOverlayClick}
          style={{ top: 'calc(env(safe-area-inset-top) + 3rem)' }}
        />
      )}

      {/* Spacer */}
      <div className="h-12 sm:h-14" style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* Category Drawer */}
      <CategoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
