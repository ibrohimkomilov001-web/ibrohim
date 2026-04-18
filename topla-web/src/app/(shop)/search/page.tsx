'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search as SearchIcon,
  Clock,
  TrendingUp,
  SlidersHorizontal,
  X,
  Star,
  Package,
  Tag,
  ArrowUpDown,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shopApi } from '@/lib/api/shop';
import { ProductGrid } from '@/components/shop/product-card';
import { useTranslation } from '@/store/locale-store';

// ============================================
// Types
// ============================================
interface SearchFilters {
  categoryId?: string;
  brandIds?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  hasDiscount?: string;
  sort?: string;
}

// ============================================
// Main Page
// ============================================
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="site-container py-20 flex items-center justify-center">
        <div className="shimmer w-8 h-8 rounded-full" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

// ============================================
// Search Content
// ============================================
function SearchContent() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  // Sync with URL query param
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
      setDebouncedQuery(initialQuery);
      if (initialQuery.length >= 2) saveSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Close suggest on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ---- Trending searches from API ----
  const { data: trendingData } = useQuery({
    queryKey: ['popular-searches'],
    queryFn: () => shopApi.getPopularSearches(),
    staleTime: 5 * 60 * 1000,
  });
  const trendingSearches = (trendingData && Array.isArray(trendingData) && trendingData.length > 0)
    ? trendingData.map((item: any) => item.query)
    : ['telefon', 'krossovka', 'sumka', 'soat', 'naushnik', 'kiyim'];

  // ---- Autocomplete suggest ----
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggest', query],
    queryFn: () => shopApi.searchSuggest(query),
    enabled: query.length >= 2 && showSuggest,
    staleTime: 30 * 1000,
  });

  // ---- Main search ----
  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['search-products', debouncedQuery, filters],
    queryFn: () => {
      const params: Record<string, string> = { limit: '40' };
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.brandIds) params.brandIds = filters.brandIds;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.inStock) params.inStock = 'true';
      if (filters.hasDiscount) params.hasDiscount = 'true';
      if (filters.sort) params.sort = filters.sort;
      return shopApi.searchProducts(debouncedQuery, params);
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Parse result (API returns data array or products array)
  const products = searchResult?.data ?? searchResult?.products ?? searchResult ?? [];
  const totalHits = searchResult?.meta?.total ?? searchResult?.pagination?.total ?? 0;
  const searchEngine = searchResult?.meta?.engine ?? '';
  const processingTimeMs = searchResult?.meta?.processingTimeMs;

  // Track no_results
  useEffect(() => {
    if (debouncedQuery.length >= 2 && !isLoading && Array.isArray(products) && products.length === 0) {
      shopApi.trackSearch({ query: debouncedQuery, action: 'no_results', engine: searchEngine });
    }
  }, [debouncedQuery, isLoading, products]);

  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const handleSearch = (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    setShowSuggest(false);
    if (term.length >= 2) saveSearch(term);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim().length >= 2) {
      setShowSuggest(false);
      setDebouncedQuery(query.trim());
      saveSearch(query.trim());
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }
  };

  const handleProductClick = (productId: string, position: number) => {
    shopApi.trackSearch({
      query: debouncedQuery,
      productId,
      action: 'click',
      position,
      engine: searchEngine,
    });
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const updateFilter = (key: keyof SearchFilters, value: string | undefined) => {
    setFilters(prev => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  const clearFilters = () => setFilters({});
  const activeFilterCount = Object.keys(filters).length;

  const showEmpty = debouncedQuery.length >= 2 && !isLoading && Array.isArray(products) && products.length === 0;
  const showDefault = debouncedQuery.length < 2;

  return (
    <div className="min-h-[100dvh] sm:min-h-0">
      {/* ── Mobile search header (Temu-style) ── */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center gap-2 px-3 h-12">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 relative" ref={suggestRef}>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center h-10 rounded-full border border-border bg-muted/50 overflow-hidden">
              <input
                ref={inputRef}
                type="text"
                enterKeyHint="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }}
                onFocus={() => query.length >= 2 && setShowSuggest(true)}
                placeholder={locale === 'ru' ? 'Поиск в Topla' : 'Topla qidirish'}
                className="flex-1 bg-transparent border-none outline-none px-4 text-[16px] text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setDebouncedQuery(''); inputRef.current?.focus(); }}
                  className="px-2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            {/* Mobile autocomplete */}
            <AnimatePresence>
              {showSuggest && suggestions && Array.isArray(suggestions) && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-50 top-full mt-1 w-full bg-card rounded-xl border border-border shadow-xl overflow-hidden"
                >
                  {suggestions.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.id}`}
                      onClick={() => { setShowSuggest(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      {item.image && (
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img src={item.image} alt="" width={36} height={36} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.name}</p>
                        <p className="text-xs text-primary font-semibold">
                          {Number(item.price).toLocaleString()} {locale === 'ru' ? 'сум' : "so'm"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white flex-shrink-0"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile spacer */}
      <div className="sm:hidden h-12" style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* ── Desktop search (original style) ── */}
      <div className="hidden sm:block site-container py-10">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">{t('search')}</span>
        </nav>

        <div className="relative max-w-3xl mx-auto mb-6" ref={suggestRef}>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }}
              onFocus={() => query.length >= 2 && setShowSuggest(true)}
              placeholder={locale === 'ru' ? 'Поиск товаров...' : 'Mahsulotlarni qidirish...'}
              className="w-full pl-12 pr-20 py-3.5 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setDebouncedQuery(''); inputRef.current?.focus(); }}
                className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${activeFilterCount > 0 ? 'bg-primary text-white' : 'hover:bg-muted'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop autocomplete */}
          <AnimatePresence>
            {showSuggest && suggestions && Array.isArray(suggestions) && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 top-full mt-2 w-full bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
              >
                {suggestions.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    onClick={() => {
                      setShowSuggest(false);
                      shopApi.trackSearch({ query, productId: item.id, action: 'click', position: 0 });
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    {item.image && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img src={item.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-primary font-semibold">
                        {Number(item.price).toLocaleString()} {locale === 'ru' ? 'сум' : "so'm"}
                      </p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Shared content ── */}
      <div className="site-container sm:pb-10">
        {/* Filters panel (desktop only) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="hidden sm:block max-w-3xl mx-auto mb-6 overflow-hidden"
            >
              <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    {locale === 'ru' ? 'Фильтры' : 'Filterlar'}
                  </h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                      {locale === 'ru' ? 'Сбросить' : 'Tozalash'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">{locale === 'ru' ? 'Мин. цена' : 'Min narx'}</label>
                    <input
                      type="number"
                      value={filters.minPrice || ''}
                      onChange={(e) => updateFilter('minPrice', e.target.value || undefined)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">{locale === 'ru' ? 'Макс. цена' : 'Max narx'}</label>
                    <input
                      type="number"
                      value={filters.maxPrice || ''}
                      onChange={(e) => updateFilter('maxPrice', e.target.value || undefined)}
                      placeholder="∞"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="w-3 h-3" /> {locale === 'ru' ? 'Мин. рейтинг' : 'Min reyting'}
                    </label>
                    <select
                      value={filters.minRating || ''}
                      onChange={(e) => updateFilter('minRating', e.target.value || undefined)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">{locale === 'ru' ? 'Все' : 'Barchasi'}</option>
                      <option value="4">4+ ⭐</option>
                      <option value="3">3+ ⭐</option>
                      <option value="2">2+ ⭐</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3" /> {locale === 'ru' ? 'Сортировка' : 'Saralash'}
                    </label>
                    <select
                      value={filters.sort || ''}
                      onChange={(e) => updateFilter('sort', e.target.value || undefined)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">{locale === 'ru' ? 'По умолчанию' : 'Standart'}</option>
                      <option value="price_asc">{locale === 'ru' ? 'Цена ↑' : 'Narx ↑'}</option>
                      <option value="price_desc">{locale === 'ru' ? 'Цена ↓' : 'Narx ↓'}</option>
                      <option value="rating">{locale === 'ru' ? 'Рейтинг' : 'Reyting'}</option>
                      <option value="newest">{locale === 'ru' ? 'Новые' : 'Yangi'}</option>
                      <option value="popular">{locale === 'ru' ? 'Популярные' : 'Mashhur'}</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFilter('inStock', filters.inStock ? undefined : 'true')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      filters.inStock ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Package className="w-3 h-3" />
                    {locale === 'ru' ? 'В наличии' : 'Mavjud'}
                  </button>
                  <button
                    onClick={() => updateFilter('hasDiscount', filters.hasDiscount ? undefined : 'true')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      filters.hasDiscount ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    {locale === 'ru' ? 'Со скидкой' : 'Chegirmali'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count & meta */}
        {debouncedQuery.length >= 2 && !isLoading && Array.isArray(products) && products.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {totalHits} {locale === 'ru' ? 'результатов' : 'natija'}
              {processingTimeMs !== undefined && (
                <span className="ml-2 text-xs opacity-60">({processingTimeMs}ms)</span>
              )}
            </p>
            {searchEngine && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {searchEngine === 'meilisearch' ? '⚡ Tezkor' : '🐢 DB'}
              </span>
            )}
          </div>
        )}

        {/* Default state - recent & trending */}
        {showDefault && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6 pt-4 sm:pt-0"
          >
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {locale === 'ru' ? 'Недавние поиски' : "So'nggi qidiruvlar"}
                  </h3>
                  <button onClick={clearRecent} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {locale === 'ru' ? 'Очистить' : 'Tozalash'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="category-pill text-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                {locale === 'ru' ? 'Популярные запросы' : 'Trend qidiruvlar'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.slice(0, 12).map((term: string, i: number) => (
                  <motion.button
                    key={term}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSearch(term)}
                    className="category-pill text-sm"
                  >
                    {term}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {isLoading && debouncedQuery.length >= 2 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square skeleton" />
                <div className="p-3 space-y-2">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-5 skeleton rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {showEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 max-w-lg mx-auto"
          >
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium mb-2">
              &quot;{debouncedQuery}&quot; — {locale === 'ru' ? 'ничего не найдено' : 'topilmadi'}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {locale === 'ru'
                ? 'Попробуйте другие ключевые слова или уберите фильтры'
                : "Boshqa kalit so'zlarni sinab ko'ring yoki filterlarni olib tashlang"}
            </p>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium mb-4 hover:bg-primary/90 transition-colors"
              >
                {locale === 'ru' ? 'Сбросить фильтры' : 'Filterlarni tozalash'} ({activeFilterCount})
              </button>
            )}

            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-3">
                {locale === 'ru' ? 'Попробуйте:' : "Sinab ko'ring:"}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {trendingSearches.slice(0, 6).map((term: string) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="category-pill text-sm"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {!showDefault && Array.isArray(products) && products.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ProductGrid products={products} columns={5} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
