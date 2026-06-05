/**
 * Custom hooks for common UI patterns.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/* ─── useLocalStorage ────────────────────────────────────────────────────── */

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const prefixed = `cts_${key}`;

  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(prefixed);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev)
        : newValue;
      try { localStorage.setItem(prefixed, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [prefixed]);

  return [value, set] as const;
}

/* ─── useClipboard ───────────────────────────────────────────────────────── */

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), timeout);
    } catch (err) {
      console.error('Clipboard write failed:', err);
    }
  }, [timeout]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { copied, copy };
}

/* ─── useDebounce ────────────────────────────────────────────────────────── */

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ─── useMediaQuery ──────────────────────────────────────────────────────── */

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTouch  = () => useMediaQuery('(hover: none)');

/* ─── useToggle ──────────────────────────────────────────────────────────── */

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  const on     = useCallback(() => setValue(true), []);
  const off    = useCallback(() => setValue(false), []);
  return [value, toggle, on, off] as const;
}

/* ─── useKeyPress ────────────────────────────────────────────────────────── */

export function useKeyPress(targetKey: string, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === targetKey) handler(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetKey, handler]);
}

/* ─── useAsyncOperation ──────────────────────────────────────────────────── */

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsyncOperation<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const run = useCallback(async (operation: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await operation();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setState({ data: null, loading: false, error: msg });
      throw err;
    }
  }, []);

  const reset = useCallback(() => setState({ data: null, loading: false, error: null }), []);

  return { ...state, run, reset };
}

/* ─── useProgress ────────────────────────────────────────────────────────── */

export function useProgress() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);

  const start = useCallback(() => {
    setProgress(0);
    setActive(true);
  }, []);

  const update = useCallback((value: number) => {
    setProgress(Math.min(99, Math.max(0, value)));
  }, []);

  const complete = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 400);
  }, []);

  const fail = useCallback(() => {
    setActive(false);
    setProgress(0);
  }, []);

  return { progress, active, start, update, complete, fail };
}
