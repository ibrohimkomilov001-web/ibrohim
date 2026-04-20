'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search as SearchIcon,
  Clock,
  SlidersHorizontal,
  X,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shopApi } from '@/lib/api/shop';
import { ProductGrid } from '@/components/shop/product-card';
import { useTranslation } from '@/store/locale-store';
import {
  FilterSheet,
  EMPTY_FILTERS,
  countActiveFilters,
  filtersToParams,
  type FilterValues,
} from '@/components/shop/filter-sheet';

// ============================================
// Types
// ============================================

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>(EMPTY_FILTERS);
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

  // ---- Trending searches removed per design ----

  // ---- Autocomplete suggest ----
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggest', query],
    queryFn: () => shopApi.searchSuggest(query),
    enabled: query.length >= 2 && showSuggest,
    staleTime: 30 * 1000,
  });

  // ---- Main search ----
  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['search-products', debouncedQuery, filterValues],
    queryFn: () => {
      const params: Record<string, string> = { limit: '40', ...filtersToParams(filterValues) };
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

  const clearFilters = () => setFilterValues(EMPTY_FILTERS);
  const activeFilterCount = countActiveFilters(filterValues);

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
            onClick={() => setSheetOpen(true)}
            className={`relative flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${activeFilterCount > 0 ? 'bg-blue-600 text-white' : 'hover:bg-muted text-foreground'}`}
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
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
              onClick={() => setSheetOpen(true)}
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
        {/* Filter sheet is rendered below (as overlay) */}

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

        {/* Default state - recent searches only */}
        {showDefault && (
          <div className="max-w-2xl mx-auto space-y-6 pt-4 sm:pt-0">
            {recentSearches.length > 0 ? (
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
            ) : (
              <div className="flex flex-col items-center text-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <SearchIcon className="w-9 h-9 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {locale === 'ru' ? 'Что ищете?' : 'Nimani qidiryapsiz?'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  {locale === 'ru'
                    ? 'Введите название товара, бренда или категории'
                    : "Mahsulot, brend yoki kategoriya nomini kiriting"}
                </p>
              </div>
            )}
          </div>
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
          </motion.div>
        )}

        {/* Results */}
        {!showDefault && Array.isArray(products) && products.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ProductGrid products={products} columns={5} />
          </motion.div>
        )}
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onApply={(v) => setFilterValues(v)}
        initial={filterValues}
      />
    </div>
  );
}
