'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ─── Glass Button ───────────────────────────────────────────
   Glassmorphic button with multiple variants.
   ──────────────────────────────────────────────────────────── */

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  /** Shimmer shine effect on hover */
  shimmer?: boolean;
}

const baseClasses =
  'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]';

const variantClasses = {
  primary: 'liquid-btn',
  glass: 'btn-glass',
  ghost:
    'hover:bg-foreground/5 bg-transparent border border-transparent hover:border-border',
  danger:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
} as const;

const sizeClasses = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
  icon: 'h-10 w-10 rounded-xl',
} as const;

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'glass', size = 'md', shimmer = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          shimmer && 'shimmer',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
export { GlassButton };
