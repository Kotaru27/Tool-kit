import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, focusRing } from '../../lib/utils';

/* ─── Badge ─────────────────────────────────────────────────────────────── */

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-sans text-xs uppercase tracking-widest font-medium rounded-full border px-2.5 py-0.5 transition-colors duration-150 whitespace-nowrap',
  {
    variants: {
      variant: {
        default:  'bg-[var(--color-bg-panel)] border-[var(--color-border-color)] text-[var(--color-text-muted)]',
        white:    'bg-text-main border-white text-bg-main',
        success:  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        warning:  'bg-amber-500/10  border-amber-500/20  text-amber-400',
        danger:   'bg-red-500/10    border-red-500/20    text-red-400',
        info:     'bg-blue-500/10   border-blue-500/20   text-blue-400',
        outline:  'bg-transparent   border-[var(--color-border-color)] text-[var(--color-text-muted)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' ? 'bg-emerald-400' :
          variant === 'warning' ? 'bg-amber-400' :
          variant === 'danger'  ? 'bg-red-400' :
          variant === 'info'    ? 'bg-blue-400' : 'bg-current'
        )} />
      )}
      {children}
    </span>
  );
}

/* ─── Label ─────────────────────────────────────────────────────────────── */

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block font-sans text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

/* ─── Input ─────────────────────────────────────────────────────────────── */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, type, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3 flex items-center pointer-events-none text-[var(--color-text-muted)] [&>svg]:w-4 [&>svg]:h-4">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full h-11 bg-[var(--color-bg-input)] border text-[var(--color-text-main)]',
            'font-sans text-sm rounded-[var(--radius-app)] px-3',
            'placeholder:text-[var(--color-text-muted)]',
            'transition-all duration-150 outline-none',
            error
              ? 'border-red-500/50 focus:border-red-500/80'
              : 'border-[var(--color-border-color)] focus:border-border-strong focus:ring-1 focus:ring-white/10',
            leftIcon  && 'pl-10',
            rightIcon && 'pr-10',
            focusRing,
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 flex items-center pointer-events-none text-[var(--color-text-muted)] [&>svg]:w-4 [&>svg]:h-4">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/* ─── Textarea ───────────────────────────────────────────────────────────── */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[100px] bg-[var(--color-bg-input)] border text-[var(--color-text-main)]',
        'font-sans text-sm rounded-[var(--radius-app)] px-3 py-3',
        'placeholder:text-[var(--color-text-muted)]',
        'transition-all duration-150 outline-none resize-vertical',
        error
          ? 'border-red-500/50 focus:border-red-500/80'
          : 'border-[var(--color-border-color)] focus:border-border-strong focus:ring-1 focus:ring-white/10',
        focusRing,
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

/* ─── Select ─────────────────────────────────────────────────────────────── */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full h-11 bg-[var(--color-bg-input)] border text-[var(--color-text-main)]',
          'font-sans text-sm rounded-[var(--radius-app)] px-3 appearance-none cursor-pointer pr-9',
          'placeholder:text-[var(--color-text-muted)]',
          'transition-all duration-150 outline-none',
          error
            ? 'border-red-500/50 focus:border-red-500/80'
            : 'border-[var(--color-border-color)] focus:border-border-strong focus:ring-1 focus:ring-white/10',
          focusRing,
          className
        )}
        {...props}
      >
        {children}
      </select>
      {/* Chevron */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  )
);
Select.displayName = 'Select';
