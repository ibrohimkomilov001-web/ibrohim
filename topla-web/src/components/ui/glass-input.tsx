'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Glass Input ────────────────────────────────────────────
   Glassmorphic input field.
   ──────────────────────────────────────────────────────────── */

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Show search icon */
  icon?: React.ReactNode;
  /** Show clear button when value exists */
  onClear?: () => void;
  /** Size variant */
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-9 text-xs px-3',
  md: 'h-11 text-sm px-4',
  lg: 'h-12 text-base px-5',
} as const;

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ icon, onClear, inputSize = 'md', className, value, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl transition-all',
          'bg-foreground/[0.04] border border-border/60',
          'focus-within:bg-background focus-within:border-primary/30 focus-within:shadow-lg focus-within:shadow-primary/5',
          'dark:bg-foreground/[0.06] dark:focus-within:bg-card',
          sizeClasses[inputSize],
          className
        )}
      >
        {icon && (
          <span className="text-muted-foreground flex-shrink-0">{icon}</span>
        )}
        <input
          ref={ref}
          value={value}
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground min-w-0"
          {...props}
        />
        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
export { GlassInput };
