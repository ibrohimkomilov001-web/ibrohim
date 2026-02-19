'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, ShoppingBag, User, Menu, X, ChevronRight,
  Smartphone, Monitor, Tv, Shirt, ShoppingCart, Watch,
  Gem, Sparkles, Droplet, Brush, Home, Sofa, Wrench,
  FlaskConical, Baby, Gamepad2, PenTool, Milk, Cake, Coffee,
  Car, Dumbbell, BookOpen, Palette, PawPrint, Flower2, Gift,
  Package, CircuitBoard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useTranslation, useLocaleStore } from '@/store/locale-store';
import { useQuery } from '@tanstack/react-query';
import { shopApi, type Category } from '@/lib/api/shop';

// Map DB icon strings to lucide icons
const iconMap: Record<string, React.ReactNode> = {
  mobile: <Smartphone className="w-5 h-5" />,
  monitor: <Monitor className="w-5 h-5" />,
  blend_2: <Home className="w-5 h-5" />,
  screenmirroring: <Tv className="w-5 h-5" />,
  shirt: <Shirt className="w-5 h-5" />,
  bag_2: <ShoppingCart className="w-5 h-5" />,
  diamonds: <Gem className="w-5 h-5" />,
  magic_star: <Sparkles className="w-5 h-5" />,
  drop: <Droplet className="w-5 h-5" />,
  brush_1: <Brush className="w-5 h-5" />,
  lamp_charge: <Sofa className="w-5 h-5" />,
  home_2: <Home className="w-5 h-5" />,
  emoji_happy: <Baby className="w-5 h-5" />,
  weight_1: <Dumbbell className="w-5 h-5" />,
  box_1: <FlaskConical className="w-5 h-5" />,
  happyemoji: <Baby className="w-5 h-5" />,
  game: <Gamepad2 className="w-5 h-5" />,
  pen_tool: <PenTool className="w-5 h-5" />,
  milk: <Milk className="w-5 h-5" />,
  cake: <Cake className="w-5 h-5" />,
  cup: <Coffee className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  driver: <Gamepad2 className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  colorfilter: <Palette className="w-5 h-5" />,
  pet: <PawPrint className="w-5 h-5" />,
  lovely: <Flower2 className="w-5 h-5" />,
  gift: <Gift className="w-5 h-5" />,
  building_4: <Wrench className="w-5 h-5" />,
};

function getCategoryIcon(iconName?: string | null) {
  if (!iconName) return <Package className="w-5 h-5" />;
  return iconMap[iconName] || <Package className="w-5 h-5" />;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { setLocale } = useLocaleStore();
  const cartCount = useCartStore((s) => s.getItemCount());
  const [scrolled, setScrolled] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => shopApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setCatalogOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          'bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/30',
          scrolled && 'shadow-lg shadow-black/5 bg-white/80'
        )}
      >
        <div className="site-container">
          <div className="flex items-center gap-2 sm:gap-3 h-14 lg:h-16">
            {/* Hamburger → opens catalog drawer (mobile) */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 active:scale-95 transition-transform"
              onClick={() => setCatalogOpen(true)}
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Logo — only T icon on mobile, T + TOPLA on desktop */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
                <span className="text-white font-bold text-base">T</span>
              </div>
              <span className="hidden lg:block text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                TOPLA
              </span>
            </Link>

            {/* Categories button — desktop */}
            <div className="hidden lg:block relative">
              <button
                className={cn(
                  'flex items-center gap-2 px-4 h-10 rounded-xl font-medium text-sm transition-all',
                  megaMenuOpen
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-white/50 backdrop-blur-sm border border-white/40 hover:bg-primary/10 text-gray-700'
                )}
                onMouseEnter={() => setMegaMenuOpen(true)}
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              >
                <Menu className="w-4 h-4" />
                {t('catalog')}
              </button>

              <AnimatePresence>
                {megaMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-[560px] bg-white/80 backdrop-blur-2xl rounded-2xl p-3 shadow-2xl shadow-black/10 border border-white/50 z-50"
                    onMouseLeave={() => setMegaMenuOpen(false)}
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {categories?.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/categories/${cat.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 transition-colors group"
                          onClick={() => setMegaMenuOpen(false)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center text-gray-500 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            {getCategoryIcon(cat.icon)}
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                            {locale === 'ru' && cat.nameRu ? cat.nameRu : cat.nameUz}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Glass search bar — full width */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className={cn(
                'flex items-center h-10 sm:h-11 px-4 rounded-2xl transition-all',
                'bg-white/50 backdrop-blur-sm border border-white/40',
                'focus-within:bg-white/80 focus-within:border-primary/30 focus-within:shadow-lg focus-within:shadow-primary/5'
              )}>
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('findProducts')}
                  className="flex-1 bg-transparent border-none outline-none ml-3 text-sm text-gray-700 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Cart */}
              <Link
                href="/cart"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 relative hover:bg-white/80 transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Profile — hidden on small mobile */}
              <Link
                href="/profile"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 hover:bg-white/80 transition-colors"
              >
                <User className="w-5 h-5 text-gray-700" />
              </Link>

              {/* Language toggle */}
              <button
                onClick={() => setLocale(locale === 'uz' ? 'ru' : 'uz')}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 text-xs font-bold text-gray-600 hover:bg-white/80 transition-colors"
              >
                {locale === 'uz' ? 'RU' : 'UZ'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======= CATALOG DRAWER (mobile) — Categories only ======= */}
      <AnimatePresence>
        {catalogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              onClick={() => setCatalogOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-[70] w-[85%] max-w-sm bg-white/90 backdrop-blur-2xl backdrop-saturate-150 border-r border-white/40 overflow-y-auto"
            >
              <div className="p-4">
                {/* Close button */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-800">{t('catalog')}</h2>
                  <button
                    onClick={() => setCatalogOpen(false)}
                    className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Search bar inside catalog */}
                <form onSubmit={(e) => { handleSearch(e); setCatalogOpen(false); }} className="mb-5">
                  <div className="flex items-center h-11 px-4 rounded-2xl bg-gray-100/80 border border-gray-200/50">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('findProducts')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none ml-3 text-sm text-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                </form>

                {/* Categories list */}
                <div className="space-y-0.5">
                  {categories?.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.id}`}
                      onClick={() => setCatalogOpen(false)}
                      className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-gray-100/60 active:bg-gray-100 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100/80 flex items-center justify-center text-gray-500 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                        {getCategoryIcon(cat.icon)}
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                        {locale === 'ru' && cat.nameRu ? cat.nameRu : cat.nameUz}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary/50 transition-colors" />
                    </Link>
                  ))}
                </div>

                {/* Language at bottom */}
                <div className="mt-6 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center justify-between px-3">
                    <span className="text-sm text-gray-500">{t('language')}</span>
                    <button
                      onClick={() => setLocale(locale === 'uz' ? 'ru' : 'uz')}
                      className="px-4 h-9 rounded-xl bg-gray-100/80 text-sm font-medium text-gray-600 active:scale-95 transition-transform"
                    >
                      {locale === 'uz' ? "O'zbekcha" : 'Русский'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header spacer */}
      <div className="h-14 lg:h-16" />
    </>
  );
}
