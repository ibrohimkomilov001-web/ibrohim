import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-5">
        <Icon className="w-11 h-11 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-foreground max-w-md">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex items-center justify-center h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium active:scale-[0.98] transition-colors"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="mt-6 inline-flex items-center justify-center h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium active:scale-[0.98] transition-colors"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
