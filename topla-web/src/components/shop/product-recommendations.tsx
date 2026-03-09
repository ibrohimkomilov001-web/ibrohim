"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Star, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/store/locale-store";
import { formatPrice } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

async function fetchRecommendations(productId: string) {
  const res = await fetch(`${API_BASE}/products/${productId}/recommendations`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

interface ProductCardMiniProps {
  product: any;
}

function ProductCardMini({ product }: ProductCardMiniProps) {
  const image = product.images?.[0];
  const effectivePrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-white rounded-xl overflow-hidden border hover:shadow-md transition-shadow"
    >
      <div className="aspect-square relative bg-gray-50">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="150px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium line-clamp-2 leading-snug mb-1">{product.name}</p>
        <div className="flex items-center gap-1 mb-0.5">
          <Star className="w-3 h-3 text-amber-400 fill-current" />
          <span className="text-[10px] text-gray-500">{product.rating?.toFixed(1) || '0.0'}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-primary">{formatPrice(effectivePrice)}</span>
          {hasDiscount && (
            <span className="text-[10px] line-through text-gray-400">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

interface ProductRecommendationsProps {
  productId: string;
}

export function ProductRecommendations({ productId }: ProductRecommendationsProps) {
  const t = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["product-recommendations", productId],
    queryFn: () => fetchRecommendations(productId),
    enabled: !!productId,
  });

  if (isLoading) return <SectionSkeleton />;
  if (!data) return null;

  const { similar, crossSell, upSell } = data;

  const hasContent = (similar?.length > 0) || (crossSell?.length > 0) || (upSell?.length > 0);
  if (!hasContent) return null;

  return (
    <div className="space-y-8 mt-8">
      {/* Similar Products */}
      {similar?.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            O&apos;xshash mahsulotlar
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {similar.slice(0, 8).map((p: any) => (
              <ProductCardMini key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Cross-sell: Bought Together */}
      {crossSell?.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            Birga xarid qilingan
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {crossSell.slice(0, 4).map((p: any) => (
              <ProductCardMini key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Up-sell: Premium Alternatives */}
      {upSell?.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            Yuqori sifatli alternativalar
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {upSell.slice(0, 4).map((p: any) => (
              <ProductCardMini key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
