'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/store/locale-store';

export function Header() {
  const router = useRouter();
  const { t } = useTranslation();
  const cartCount = useCartStore((s) => s.getItemCount());
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-shadow duration-200',
          scrolled && 'shadow-sm'
        )}
      >
        <div className="site-container">
          <div className="flex items-center gap-2 h-12 sm:h-14">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 min-w-0">
              <div className="flex items-center h-9 sm:h-10 px-3 rounded-xl bg-gray-50 border border-gray-100 transition-all focus-within:bg-white focus-within:border-primary/30 focus-within:shadow-sm">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="search"
                  enterKeyHint="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('findProducts')}
                  className="flex-1 bg-transparent border-none outline-none ml-2 text-[16px] sm:text-sm text-gray-800 placeholder:text-gray-400 min-w-0"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="p-2">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </form>

            {/* Cart */}
            <Link
              href="/cart"
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
              className="flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <User className="w-[18px] h-[18px] text-gray-500" />
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-12 sm:h-14" />
    </>
  );
}
