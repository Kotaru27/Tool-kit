/**
 * Dialog — wraps @radix-ui/react-dialog with project design tokens.
 * Falls back to a pure React portal implementation if Radix is unavailable.
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  onClose?: () => void;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const sizeMap = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-[95vw] h-[90vh]',
};

/** Root dialog — manages open state and portal */
function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <_DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </_DialogContext.Provider>
  );
}

const _DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = React.useContext(_DialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: () => onOpenChange(true),
    });
  }
  return <span onClick={() => onOpenChange(true)}>{children}</span>;
}

function DialogContent({ children, className, size = 'md', showClose = true, onClose }: DialogContentProps) {
  const { open, onOpenChange } = React.useContext(_DialogContext);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const handleClose = () => {
    onClose?.();
    onOpenChange(false);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-bg-main/80 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-10 w-full bg-[var(--color-bg-panel)]',
              'border border-[rgba(255,255,255,0.08)] rounded-xl',
              'shadow-[0_24px_48px_rgba(0,0,0,0.6)]',
              sizeMap[size],
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {showClose && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[var(--color-text-muted)] hover:text-text-main hover:border-border-color hover:bg-bg-panel transition-all duration-150 z-10"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn('px-8 pt-8 pb-0', className)}>
      {children}
    </div>
  );
}

function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('text-2xl font-medium text-text-main tracking-tighter mb-2', className)}>
      {children}
    </h2>
  );
}

function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-[var(--color-text-muted)] font-mono leading-relaxed', className)}>
      {children}
    </p>
  );
}

function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-8 py-6', className)}>
      {children}
    </div>
  );
}

function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('px-8 pb-8 pt-0 flex items-center justify-end gap-3 border-t border-[var(--color-border-color)] mt-2 pt-6', className)}>
      {children}
    </div>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
};
