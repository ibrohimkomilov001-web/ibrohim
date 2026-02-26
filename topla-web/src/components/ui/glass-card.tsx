'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ─── Glass Card ─────────────────────────────────────────────
   Adaptive glass surface with multiple intensity levels.
   Uses CSS custom properties from the design system.
   ──────────────────────────────────────────────────────────── */

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Glass intensity level */
  variant?: 'default' | 'heavy' | 'light' | 'interactive';
  /** Border radius preset */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Hover glow effect */
  glow?: boolean;
  /** No padding */
  noPadding?: boolean;
}

const variantClasses = {
  default: 'glass',
  heavy: 'glass-heavy',
  light: 'glass-light',
  interactive: 'glass-interactive',
} as const;

const roundedClasses = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = 'default', rounded = '2xl', glow = false, noPadding = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          roundedClasses[rounded],
          !noPadding && 'p-4 sm:p-5',
          glow && 'glow-pulse',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
export { GlassCard };
