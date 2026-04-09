'use client';

import { useQuery } from '@tanstack/react-query';
import { shopApi } from '@/lib/api/shop';
import type { ReactNode } from 'react';

const DEFAULT_PHONE = '+998 95 000 94 16';

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
