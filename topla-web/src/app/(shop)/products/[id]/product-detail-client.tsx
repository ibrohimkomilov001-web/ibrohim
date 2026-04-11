'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/api/upload';
import { useQuery } from '@tanstack/react-query';
import {
  Share2, Heart, Star, ShoppingCart, Plus, Minus,
  Store, ChevronRight, Truck, Shield, RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { shopApi, type ProductDetail } from '@/lib/api/shop';
import { formatPrice } from '@/lib/utils';
import { ProductRecommendations } from '@/components/shop/product-recommendations';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { useTranslation } from '@/store/locale-store';
import { ProductCard } from '@/components/shop/product-card';

interface ProductDetailClientProps {
  productId: string;
  initialProduct: ProductDetail | null;
}

export default function ProductDetailClient({ productId, initialProduct }: ProductDetailClientProps) {
  const id = productId;
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [currentImage, setCurrentImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');

  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = isFavorite(id);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => shopApi.getProduct(id),
    enabled: !!id,
    initialData: initialProduct ?? undefined,
  });

  // Similar products
  const { data: similarData } = useQuery({
    queryKey: ['similar-products', product?.category?.id],
    queryFn: () => shopApi.getProducts({ categoryId: product!.category!.id, limit: '8' }),
    enabled: !!product?.category?.id,
  });
  const similarProducts = (similarData?.products ?? []).filter((p) => p.id !== id).slice(0, 6);

  // Product reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['product-reviews', id],
    queryFn: () => shopApi.getProductReviews(id),
    enabled: !!id && activeTab === 'reviews',
  });
  const reviews = reviewsData?.data ?? reviewsData ?? [];
  const reviewsMeta = reviewsData?.meta;

  if (isLoading) {
    return (
      <div className="site-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 skeleton rounded w-3/4" />
            <div className="h-10 skeleton rounded w-1/2" />
            <div className="h-4 skeleton rounded w-full" />
            <div className="h-4 skeleton rounded w-2/3" />
            <div className="h-12 skeleton rounded w-full mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-5xl mb-4">😔</p>
        <p className="text-lg font-medium mb-2">{t('noResults')}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          {locale === 'ru' ? 'Назад' : 'Ortga qaytish'}
        </Button>
      </div>
    );
  }

  const name = locale === 'ru' && product.nameRu ? product.nameRu : product.nameUz;
  const description = locale === 'ru' && product.descriptionRu
    ? product.descriptionRu
    : (product.descriptionUz || product.description || '');
  const images = product.images?.length ? product.images : [];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.nameUz,
      nameUz: product.nameUz,
      nameRu: product.nameRu,
      price: product.price,
      originalPrice: product.compareAtPrice,
      image: images[0],
      stock: product.stock,
      quantity: qty,
      shopId: product.shop?.id,
      shopName: product.shop?.name,
    });
    router.push('/cart');
  };

  const tabs = [
    { key: 'description' as const, label: t('description') },
    { key: 'specs' as const, label: t('specs') },
    { key: 'reviews' as const, label: t('reviews') },
  ];

  return (
    <div className="site-container py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
        <span className="mx-2">/</span>
        {product.category && (
          <>
            <Link href={`/categories/${product.category.id}`} className="hover:text-primary transition-colors">
              {locale === 'ru' && product.category.nameRu ? product.category.nameRu : product.category.nameUz}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-foreground font-medium line-clamp-1">{name}</span>
      </nav>

      {/* Main product section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* Left - Image gallery */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="sticky top-24">
            {/* Main image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              {images.length > 0 ? (
                <Image
                  src={resolveImageUrl(images[currentImage])}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-7xl">📦</div>
              )}

              {/* Discount badge */}
              {discountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{discountPercent}%
                </div>
              )}

              {/* Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => toggleFavorite(id)}
                  className="w-11 h-11 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={async () => {
                    const url = window.location.href;
                    const title = name;
                    if (navigator.share) {
                      try {
                        await navigator.share({ title, url });
                      } catch {}
                    } else {
                      await navigator.clipboard.writeText(url);
                      alert(locale === 'ru' ? 'Ссылка скопирована' : 'Havola nusxalandi');
                    }
                  }}
                  className="w-11 h-11 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Image dots removed */}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      i === currentImage ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={resolveImageUrl(img)} alt="" width={80} height={80} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right - Product info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">{name}</h1>

          {/* Rating & stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(product.rating || 0)
                      ? 'rating-star fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-1 text-sm font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {product.salesCount || 0} {t('sold')}
            </span>
          </div>

          {/* Price */}
          <div className="glass rounded-2xl p-4 sm:p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-bold text-primary">{formatPrice(product.price)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                  <span className="text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>
            <p className={`text-sm mt-2 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0
                ? `${t('inStock')} — ${product.stock} ${locale === 'ru' ? 'шт.' : 'dona'}`
                : t('outOfStock')}
            </p>
          </div>

          {/* Qty + Add to cart */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center glass rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              className="flex-1 liquid-btn flex items-center justify-center gap-2 !py-2.5 text-sm whitespace-nowrap"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>{t('addToCart')}</span>
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-primary mb-1.5" />
              <p className="text-xs text-muted-foreground">{t('delivery')}</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-green-500 mb-1.5" />
              <p className="text-xs text-muted-foreground">{locale === 'ru' ? 'Гарантия' : 'Kafolat'}</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-orange-500 mb-1.5" />
              <p className="text-xs text-muted-foreground">{locale === 'ru' ? 'Возврат' : 'Qaytarish'}</p>
            </div>
          </div>

          {/* Shop info */}
          {product.shop && (
            <Link
              href={`/shops/${product.shop.id}`}
              className="glass rounded-2xl p-4 flex items-center gap-4 hover-spring group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {product.shop.logoUrl ? (
                  <Image src={resolveImageUrl(product.shop.logoUrl)} alt="" width={48} height={48} className="object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold group-hover:text-primary transition-colors">{product.shop.name}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="w-3.5 h-3.5 rating-star fill-current" />
                  {product.shop.rating?.toFixed(1) || '0.0'}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </motion.div>
      </div>

      {/* Tabs section */}
      <div className="mt-10 sm:mt-14">
        {/* Tab buttons */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="py-6 sm:py-8">
          {activeTab === 'description' && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {description ? (
                <div
                  className="text-sm sm:text-base text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: description.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '') }}
                />
              ) : (
                <p className="text-muted-foreground">{locale === 'ru' ? 'Описание отсутствует' : 'Tavsif mavjud emas'}</p>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="glass rounded-2xl p-5 sm:p-6 max-w-2xl">
              <div className="space-y-3 text-sm sm:text-base">
                {product.category && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">{locale === 'ru' ? 'Категория' : 'Kategoriya'}</span>
                    <span className="font-medium">
                      {locale === 'ru' && product.category.nameRu ? product.category.nameRu : product.category.nameUz}
                    </span>
                  </div>
                )}
                {product.brand && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">{t('brand')}</span>
                    <span className="font-medium">{product.brand.name}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">{locale === 'ru' ? 'Вес' : 'Og\'irlik'}</span>
                    <span className="font-medium">{product.weight} g</span>
                  </div>
                )}
                {product.sku && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">{locale === 'ru' ? 'В наличии' : 'Mavjudlik'}</span>
                  <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stock > 0
                      ? `${product.stock} ${locale === 'ru' ? 'шт.' : 'dona'}`
                      : t('outOfStock')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {reviewsMeta && reviewsMeta.totalReviews > 0 && (
                <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{reviewsMeta.averageRating}</div>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviewsMeta.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{reviewsMeta.totalReviews} {locale === 'ru' ? 'отзывов' : 'sharh'}</div>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5,4,3,2,1].map(r => (
                      <div key={r} className="flex items-center gap-2 text-xs">
                        <span className="w-3">{r}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${reviewsMeta.totalReviews > 0 ? (reviewsMeta.ratingDistribution?.[r] || 0) / reviewsMeta.totalReviews * 100 : 0}%` }} />
                        </div>
                        <span className="w-6 text-right text-muted-foreground">{reviewsMeta.ratingDistribution?.[r] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(reviews) && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {(review.user?.fullName || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{review.user?.fullName || (locale === 'ru' ? 'Пользователь' : 'Foydalanuvchi')}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      {review.comment && <p className="text-sm text-foreground/80">{review.comment}</p>}
                      {review.images?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {review.images.map((img: string, i: number) => (
                            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                              <img src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-muted-foreground">
                    {locale === 'ru' ? 'Отзывов пока нет' : 'Hozircha sharhlar yo\'q'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <div className="mt-8 sm:mt-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">{t('similarProducts')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {similarProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations: Cross-sell & Up-sell */}
      <ProductRecommendations productId={id} />
    </div>
  );
}
