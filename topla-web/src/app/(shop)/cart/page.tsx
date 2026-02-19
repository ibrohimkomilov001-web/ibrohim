'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/store/locale-store';

export default function CartPage() {
  const { t, locale } = useTranslation();
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore();

  const itemCount = getItemCount();
  const subtotal = getTotal();
  const deliveryFee = subtotal > 100000 ? 0 : 15000;
  const total = subtotal + deliveryFee;

  return (
    <div className="site-container py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{t('cart')}</span>
      </nav>

      {/* Page title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('cart')}</h1>
          {itemCount > 0 && (
            <span className="text-sm text-muted-foreground">({itemCount})</span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm text-destructive hover:text-destructive/80 transition-colors"
          >
            {t('clearCart')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground/20 mb-6" />
          <h2 className="font-semibold text-xl mb-2">{t('emptyCart')}</h2>
          <p className="text-muted-foreground mb-8">{t('emptyCartDesc')}</p>
          <Link
            href="/"
            className="liquid-btn inline-flex items-center gap-2 px-8 py-3"
          >
            {t('startShopping')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const name = locale === 'ru' && item.nameRu ? item.nameRu : item.nameUz;
                return (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    className="glass rounded-2xl p-4 sm:p-5 flex gap-4"
                  >
                    {/* Image */}
                    <Link
                      href={`/products/${item.productId}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 relative"
                    >
                      {item.image ? (
                        <Image src={item.image} alt={name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-2xl">📦</div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.productId}`}>
                        <p className="font-medium line-clamp-2 leading-snug hover:text-primary transition-colors">
                          {name}
                        </p>
                      </Link>
                      {item.shopName && (
                        <p className="text-xs text-muted-foreground mt-1">{item.shopName}</p>
                      )}

                      <div className="flex items-end gap-2 mt-2">
                        <span className="text-lg font-bold">{formatPrice(item.price)}</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Qty */}
                        <div className="flex items-center glass rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, Math.min(item.stock, item.quantity + 1))}
                            className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold hidden sm:block">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Continue shopping */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              {t('continueShopping')}
            </Link>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-5 sm:p-6 sticky top-24 space-y-4">
              <h3 className="font-bold text-lg">{t('orderSummary')}</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {locale === 'ru' ? 'Товары' : 'Mahsulotlar'} ({itemCount})
                  </span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('delivery')}</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {deliveryFee === 0 ? t('free') : formatPrice(deliveryFee)}
                  </span>
                </div>
                {deliveryFee > 0 && subtotal > 0 && (
                  <div className="bg-primary/5 rounded-xl p-3 text-xs">
                    <p className="text-primary">
                      {locale === 'ru'
                        ? `Добавьте ещё ${formatPrice(100000 - subtotal)} — доставка бесплатно!`
                        : `${formatPrice(100000 - subtotal)} qo'shsangiz yetkazish bepul!`}
                    </p>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (subtotal / 100000) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Promo code */}
                <div className="pt-2">
                  <div className="flex gap-2">
                    <div className="flex-1 search-glass flex items-center gap-2 px-3 py-2 rounded-xl">
                      <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        placeholder={t('promoCode')}
                        className="flex-1 bg-transparent text-sm outline-none"
                      />
                    </div>
                    <button className="btn-glass px-4 text-sm font-medium text-primary">
                      {t('apply')}
                    </button>
                  </div>
                </div>

                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                  <span>{t('total')}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Link href="/checkout" className="block">
                <button className="w-full liquid-btn flex items-center justify-center gap-2 !py-4 text-base font-semibold">
                  {t('checkout')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>

              {/* Payment methods hint */}
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-1">
                <span>💳 Payme</span>
                <span>💰 Click</span>
                <span>🏦 Uzum</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
