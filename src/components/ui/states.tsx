import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Inbox, RefreshCw, SearchX } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

/* ─── EmptyState ─────────────────────────────────────────────────────────── */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'search' | 'compact';
}

export function EmptyState({
  icon,
  title = 'Nothing here yet',
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-8 px-4 gap-2' : 'py-16 px-6 gap-4',
        'border border-dashed border-[var(--color-border-color)] rounded-[var(--radius-app)]',
        'bg-[var(--color-bg-panel)]',
        className
      )}
    >
      <div className={cn(
        'text-[var(--color-text-muted)]',
        isCompact ? '[&>svg]:w-6 [&>svg]:h-6' : '[&>svg]:w-8 [&>svg]:h-8'
      )}>
        {icon ?? (variant === 'search' ? <SearchX strokeWidth={1.5} /> : <Inbox strokeWidth={1.5} />)}
      </div>

      <div className="max-w-xs">
        <p className={cn(
          'font-medium text-[var(--color-text-main)]',
          isCompact ? 'text-sm' : 'text-base'
        )}>{title}</p>
        {description && (
          <p className={cn(
            'text-[var(--color-text-muted)] font-sans uppercase tracking-widest mt-1',
            isCompact ? 'text-[11px]' : 'text-xs'
          )}>{description}</p>
        )}
      </div>

      {action && !isCompact && (
        <Button size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

/* ─── ErrorState ─────────────────────────────────────────────────────────── */

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6 gap-4',
        'border border-red-500/20 rounded-[var(--radius-app)] bg-red-500/[0.03]',
        className
      )}
    >
      <AlertCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />

      <div className="max-w-xs">
        <p className="text-base font-medium text-text-main">{title}</p>
        {message && (
          <p className="text-xs text-[var(--color-text-muted)] font-sans uppercase tracking-widest mt-1 leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {onRetry && (
        <Button
          size="sm"
          variant="danger"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try again
        </Button>
      )}
    </motion.div>
  );
}

/* ─── Divider ────────────────────────────────────────────────────────────── */

export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) {
    return <div className={cn('h-px bg-[var(--color-border-color)] w-full', className)} />;
  }
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="h-px bg-[var(--color-border-color)] flex-1" />
      <span className="text-[11px] font-sans uppercase tracking-widest text-[var(--color-text-muted)] shrink-0">{label}</span>
      <div className="h-px bg-[var(--color-border-color)] flex-1" />
    </div>
  );
}

/* ─── SectionHeader ──────────────────────────────────────────────────────── */

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <h2 className="text-lg font-medium text-text-main tracking-tight">{title}</h2>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)] font-sans uppercase tracking-widest mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
