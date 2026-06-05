import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, focusRing } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-mono text-xs uppercase tracking-widest font-medium',
    'rounded-[var(--radius-app)] border',
    'transition-all duration-200 cursor-pointer select-none',
    'will-change-transform touch-action-manipulation',
    'disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none',
    'relative overflow-hidden',
    focusRing,
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--color-bg-panel)] border-[var(--color-border-color)] text-[var(--color-text-main)]',
          'hover:border-border-strong hover:bg-bg-hover',
          'hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]',
          'active:scale-[0.97] active:shadow-none active:translate-y-0',
        ],
        primary: [
          'bg-text-main border-white text-bg-main',
          'hover:bg-text-muted hover:border-[#E5E5E5]',
          'hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)]',
          'active:scale-[0.97] active:shadow-none active:translate-y-0',
        ],
        ghost: [
          'bg-transparent border-transparent text-[var(--color-text-muted)]',
          'hover:text-text-main hover:bg-bg-hover hover:border-border-color',
          'active:scale-[0.97]',
        ],
        danger: [
          'bg-transparent border-red-500/20 text-red-400',
          'hover:bg-red-500/6 hover:border-red-500/40',
          'active:scale-[0.97]',
        ],
        outline: [
          'bg-transparent border-[var(--color-border-color)] text-[var(--color-text-main)]',
          'hover:border-border-strong hover:bg-bg-panel',
          'active:scale-[0.97]',
        ],
      },
      size: {
        sm:   'h-8  px-3   text-xs gap-1.5',
        md:   'h-11 px-5',
        lg:   'h-14 px-7   text-[13px]',
        icon: 'h-11 w-11  p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {/* Shimmer overlay on hover */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        />

        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4">{leftIcon}</span>
        ) : null}

        {children && <span className="relative z-10">{children}</span>}

        {rightIcon && !loading && (
          <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
