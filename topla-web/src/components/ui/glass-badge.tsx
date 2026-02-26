'use client';

import { cn } from '@/lib/utils';

/* ─── Glass Badge ────────────────────────────────────────────
   Pill-shaped status/tag badge with glass styling.
   ──────────────────────────────────────────────────────────── */

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  default: 'glass text-foreground',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  danger: 'bg-destructive/10 text-destructive border border-destructive/20',
  accent: 'bg-accent/10 text-accent border border-accent/20',
} as const;

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
} as const;

export function GlassBadge({ children, variant = 'default', size = 'md', className }: GlassBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
