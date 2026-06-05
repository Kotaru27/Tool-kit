import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circle' | 'button';
  width?: string | number;
  height?: string | number;
  lines?: number; // for text variant
}

export function Skeleton({ className, variant = 'default', width, height, lines = 3, style, ...props }: SkeletonProps) {
  const base = cn(
    'animate-pulse bg-gradient-to-r from-[#111] via-[#1A1A1A] to-[#111] bg-[length:200%_100%]',
    '[background-position:100%_0] rounded-[var(--radius-app)]',
    className
  );

  if (variant === 'circle') {
    return <div className={cn(base, 'rounded-full')} style={{ width, height, ...style }} {...props} />;
  }

  if (variant === 'text') {
    return (
      <div className="flex flex-col gap-2" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={base}
            style={{ height: 12, width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'button') {
    return <div className={cn(base, 'h-11 rounded-[var(--radius-app)]')} style={{ width: width ?? 120, ...style }} {...props} />;
  }

  return <div className={base} style={{ width, height, ...style }} {...props} />;
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return <Loader2 className={cn('animate-spin text-text-main', spinnerSizes[size], className)} />;
}

/* ─── FullPageLoader ─────────────────────────────────────────────────────── */

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-main gap-4"
    >
      <Spinner size="lg" />
      <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">{message}</p>
    </motion.div>
  );
}

/* ─── InlineLoader ───────────────────────────────────────────────────────── */

export function InlineLoader({ message, className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 text-[var(--color-text-muted)]', className)}>
      <Spinner size="sm" />
      {message && <span className="font-mono text-xs uppercase tracking-widest">{message}</span>}
    </div>
  );
}

/* ─── SkeletonCard ───────────────────────────────────────────────────────── */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[var(--color-bg-panel)] border border-[var(--color-border-color)] rounded-[var(--radius-app)] p-6', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="flex-1">
          <Skeleton height={14} className="mb-2 w-3/4" />
          <Skeleton height={10} className="w-1/2" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
    </div>
  );
}

/* ─── ProgressBar ────────────────────────────────────────────────────────── */

export interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'danger';
}

const progressColors = {
  default: 'bg-white',
  success: 'bg-emerald-400',
  danger:  'bg-red-400',
};

export function ProgressBar({ value, className, showLabel, label, variant = 'default' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1.5">
          {label && <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">{label}</span>}
          {showLabel && <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{clamped}%</span>}
        </div>
      )}
      <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', progressColors[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
