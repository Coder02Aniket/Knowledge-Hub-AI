import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4800);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.variant === 'success';
          const isError = t.variant === 'error';
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto animate-fade-slide-up flex items-start gap-3 rounded-xl border p-3.5 shadow-lg backdrop-blur-md transition-all bg-[var(--bg-elevated)] border-[var(--border-subtle)]"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <span className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-[var(--accent-grounded)]" aria-hidden="true" />}
                {isError && <AlertTriangle className="w-4 h-4 text-[var(--status-danger)]" aria-hidden="true" />}
                {!isSuccess && !isError && <Info className="w-4 h-4 text-[var(--accent-primary)]" aria-hidden="true" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)] leading-relaxed break-words">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      pushToast: () => {},
      dismissToast: () => {},
    };
  }
  return ctx;
}
