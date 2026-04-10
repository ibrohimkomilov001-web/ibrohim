'use client';

import { useQuery } from '@tanstack/react-query';
import { shopApi } from '@/lib/api/shop';
import type { ReactNode } from 'react';

const DEFAULT_PHONE = '+998 20 002 49 20';
const DEFAULT_EMAIL = 'support@topla.uz';
const DEFAULT_TELEGRAM = 'https://t.me/toplauz';
const DEFAULT_INSTAGRAM = 'https://instagram.com/topla.uz';
const DEFAULT_YOUTUBE = 'https://youtube.com/@toplauz';

export function usePublicSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => shopApi.getPublicSettings(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSupportPhone() {
  const { data } = usePublicSettings();
  return data?.supportPhone || DEFAULT_PHONE;
}

export function useSupportEmail() {
  const { data } = usePublicSettings();
  return data?.supportEmail || DEFAULT_EMAIL;
}

export function useTelegramLink() {
  const { data } = usePublicSettings();
  return data?.telegramLink || DEFAULT_TELEGRAM;
}

export function useTelegramHandle() {
  const link = useTelegramLink();
  const match = link.match(/t\.me\/(.+)/);
  return match ? `@${match[1]}` : '@toplauz';
}

export function useInstagramLink() {
  const { data } = usePublicSettings();
  return data?.instagramLink || DEFAULT_INSTAGRAM;
}

export function useYoutubeLink() {
  const { data } = usePublicSettings();
  return data?.youtubeLink || DEFAULT_YOUTUBE;
}

/** Client component that renders a phone link with dynamic support phone */
export function SupportPhoneLink({ className, children }: { className?: string; children?: ReactNode }) {
  const phone = useSupportPhone();
  const digits = phone.replace(/\D/g, '');
  return (
    <a href={`tel:+${digits}`} className={className}>
      {children}
      {phone}
    </a>
  );
}

/** Client component that renders an email link with dynamic support email */
export function SupportEmailLink({ className, children }: { className?: string; children?: ReactNode }) {
  const email = useSupportEmail();
  return (
    <a href={`mailto:${email}`} className={className}>
      {children ?? email}
    </a>
  );
}
