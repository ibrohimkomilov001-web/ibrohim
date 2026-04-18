'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { shopApi } from '@/lib/api/shop';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/store/locale-store';

interface ShopFollowButtonProps {
  shopId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'default' | 'icon';
}

export function ShopFollowButton({ shopId, onFollowChange, variant = 'default' }: ShopFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { locale } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated) {
      setChecked(true);
      return;
    }
    shopApi.isFollowingShop(shopId)
      .then(res => {
        setIsFollowing(res.isFollowing);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [shopId, isAuthenticated]);

  const toggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/profile');
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        await shopApi.unfollowShop(shopId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await shopApi.followShop(shopId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch {
      // Error — possibly not authenticated
      router.push('/profile');
    }
    setLoading(false);
  }, [isFollowing, isAuthenticated, shopId, router, onFollowChange]);

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`p-2.5 rounded-full transition-all ${
          isFollowing
            ? 'bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive'
            : 'hover:bg-muted text-muted-foreground hover:text-primary'
        }`}
        title={isFollowing
          ? (locale === 'ru' ? 'Отписаться' : 'Obunani bekor qilish')
          : (locale === 'ru' ? 'Подписаться' : "Obuna bo'lish")}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="w-5 h-5" />
        ) : (
          <UserPlus className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`group shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
        isFollowing
          ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span>
        {isFollowing
          ? (locale === 'ru' ? 'Подписка' : 'Obuna')
          : (locale === 'ru' ? 'Подписаться' : "Obuna bo'lish")}
      </span>
    </button>
  );
}
