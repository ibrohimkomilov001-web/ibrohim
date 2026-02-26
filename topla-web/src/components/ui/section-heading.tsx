'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ─── Section Heading ────────────────────────────────────────
   Consistent heading for page sections with optional action.
   Uses Space Grotesk via font-heading.
   ──────────────────────────────────────────────────────────── */

interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeading({ title, subtitle, action, className, ...props }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-6', className)} {...props}>
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
