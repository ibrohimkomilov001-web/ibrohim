'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shopApi, type Category } from '@/lib/api/shop';
import { useTranslation, useLocaleStore } from '@/store/locale-store';
import { ICON_BY_VALUE } from '@/lib/iconsax-map';

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryDrawer({ open, onClose }: CategoryDrawerProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Category | null>(null);

  useEffect(() => {
    if (open && categories.length === 0) {
      setLoading(true);
      shopApi.getCategoryTree()
        .then(setCategories)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, categories.length]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const getName = (cat: Category) => 
    locale === 'ru' && cat.nameRu ? cat.nameRu : cat.nameUz;

  const handleCategoryClick = (cat: Category) => {
    if (cat.children && cat.children.length > 0) {
      setSelected(cat);
    } else {
      router.push(`/search?categoryId=${cat.id}`);
      onClose();
      setSelected(null);
    }
  };

  const handleSubClick = (sub: Category) => {
    router.push(`/search?categoryId=${sub.id}`);
    onClose();
    setSelected(null);
  };

  const renderIcon = (icon?: string) => {
    if (!icon) return null;
    const opt = ICON_BY_VALUE[icon];
    if (!opt) return null;
    const IconComp = opt.Icon;
    return <span className="text-muted-foreground"><IconComp size={20} color="currentColor" /></span>;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            style={{ touchAction: 'none' }}
            onClick={() => { onClose(); setSelected(null); }}
            onTouchMove={(e) => e.preventDefault()}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-[61] w-[85%] max-w-[320px] bg-background shadow-2xl flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
              {selected ? (
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('catalog')}
                </button>
              ) : (
                <h2 className="text-base font-semibold text-foreground">{t('catalog')}</h2>
              )}
              <button
                onClick={() => { onClose(); setSelected(null); }}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
                aria-label="Yopish"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-11 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : selected ? (
                /* Subcategories */
                <div className="py-2">
                  {/* View all in this category */}
                  <button
                    onClick={() => handleSubClick(selected)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary hover:bg-orange-50 transition-colors"
                  >
                    {t('allCategories')}
                  </button>
                  {selected.children?.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        if (sub.children && sub.children.length > 0) {
                          setSelected(sub);
                        } else {
                          handleSubClick(sub);
                        }
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span>{getName(sub)}</span>
                      {sub.children && sub.children.length > 0 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                /* Root categories */
                <div className="py-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted">
                          {renderIcon(cat.icon)}
                        </div>
                        <span className="text-sm text-foreground font-medium">{getName(cat)}</span>
                      </div>
                      {cat.children && cat.children.length > 0 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
