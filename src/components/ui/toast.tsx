/**
 * Toast — lightweight notification system.
 * Uses a React context + portal for app-wide toasts.
 * Zero external deps — no react-hot-toast required (though compatible).
 */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms, 0 = persistent
}

interface ToastCtx {
  toast: (opts: Omit<Toast, 'id'> | string) => void;
  success: (message: string, description?: string) => void;
  error:   (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info:    (message: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastCtx>({
  toast:   () => {},
  success: () => {},
  error:   () => {},
  warning: () => {},
  info:    () => {},
  dismiss: () => {},
});

const variantStyles: Record<ToastVariant, { border: string; icon: React.ReactNode }> = {
  default: {
    border: 'border-border-strong',
    icon: <Info className="w-4 h-4 text-text-main" />,
  },
  success: {
    border: 'border-emerald-500/30',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  },
  error: {
    border: 'border-red-500/30',
    icon: <AlertCircle className="w-4 h-4 text-red-400" />,
  },
  warning: {
    border: 'border-amber-500/30',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  },
  info: {
    border: 'border-blue-500/30',
    icon: <Info className="w-4 h-4 text-blue-400" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const addToast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const duration = opts.duration ?? 4000;
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]);
    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    }
  }, [dismiss]);

  const ctx: ToastCtx = {
    toast:   (opts) => addToast(typeof opts === 'string' ? { message: opts } : opts),
    success: (msg, desc) => addToast({ message: msg, description: desc, variant: 'success' }),
    error:   (msg, desc) => addToast({ message: msg, description: desc, variant: 'error' }),
    warning: (msg, desc) => addToast({ message: msg, description: desc, variant: 'warning' }),
    info:    (msg, desc) => addToast({ message: msg, description: desc, variant: 'info' }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-label="Notifications"
          className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-2 pointer-events-none max-w-sm w-full"
          style={{ paddingBottom: 'var(--safe-bottom, 0px)' }}
        >
          <AnimatePresence>
            {toasts.map(t => {
              const style = variantStyles[t.variant ?? 'default'];
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.97, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 8, scale: 0.97, filter: 'blur(4px)' }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'pointer-events-auto flex items-start gap-3',
                    'bg-bg-panel border rounded-xl px-4 py-3.5',
                    'shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
                    'backdrop-blur-xl',
                    style.border
                  )}
                >
                  <span className="mt-0.5 shrink-0">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-main font-medium leading-snug">{t.message}</p>
                    {t.description && (
                      <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5 leading-relaxed">{t.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="shrink-0 mt-0.5 text-[var(--color-text-muted)] hover:text-text-main transition-colors duration-150"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/** Convenience singleton — use in non-component code after calling initToast(ctx) */
let _toast: ToastCtx | null = null;
export function initToastSingleton(ctx: ToastCtx) { _toast = ctx; }
export const toast = {
  show:    (opts: Omit<Toast, 'id'> | string) => _toast?.toast(opts),
  success: (msg: string, desc?: string) => _toast?.success(msg, desc),
  error:   (msg: string, desc?: string) => _toast?.error(msg, desc),
  warning: (msg: string, desc?: string) => _toast?.warning(msg, desc),
  info:    (msg: string, desc?: string) => _toast?.info(msg, desc),
};
