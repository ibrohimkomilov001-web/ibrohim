'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, X, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/store/locale-store';
import { shopApi } from '@/lib/api/shop';
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

  const { data: suggestions } = useQuery({
    queryKey: ['header-suggest', searchQuery],
    queryFn: () => shopApi.searchSuggest(searchQuery),
    enabled: searchQuery.length >= 2 && searchFocused,
    staleTime: 30 * 1000,
  });

  const suggestItems: string[] = Array.isArray(suggestions)
    ? suggestions.map((s: any) => s.nameUz || s.name || s.query || String(s)).slice(0, 6)
    : [];

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
              <Menu className="w-[20px] h-[20px] text-muted-foreground" />
            </button>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 min-w-0 relative">
              <div className="flex items-center h-9 sm:h-10 px-3 rounded-xl bg-muted border border-border transition-all focus-within:bg-background focus-within:border-primary/30 focus-within:shadow-sm">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="search"
                  enterKeyHint="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={t('findProducts')}
                  className="flex-1 bg-transparent border-none outline-none ml-2 text-[16px] sm:text-sm text-foreground placeholder:text-muted-foreground min-w-0"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="p-2" aria-label="Qidiruvni tozalash">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              {/* Search suggestions dropdown */}
              {searchFocused && suggestItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background rounded-xl shadow-lg border border-border overflow-hidden z-[60]">
                  {suggestItems.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearchQuery(item);
                        setSearchFocused(false);
                        if (searchRef.current) searchRef.current.blur();
                        router.push(`/search?q=${encodeURIComponent(item)}`);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                    >
                      <Search className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                      <span className="text-sm text-foreground truncate">{item}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`${t('cart')}${cartCount > 0 ? ` (${cartCount})` : ''}`}
              className="relative flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            >
              <ShoppingCart className="w-[18px] h-[18px] text-muted-foreground" />
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-muted-foreground">
                <circle cx="12" cy="8" r="3.5"/>
                <path d="M20 21c0-3.37-3.58-6.5-8-6.5s-8 3.13-8 6.5"/>
              </svg>
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
