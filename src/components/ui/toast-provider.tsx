'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  title: string;
  message?: string;
  tone?: ToastTone;
};

type ToastInput = Omit<Toast, 'id'>;

type ToastContextType = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3400);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live='polite' aria-atomic='true' className='pointer-events-none fixed inset-x-0 bottom-3 z-50 flex flex-col items-center gap-2 px-3 sm:inset-auto sm:bottom-4 sm:right-4 sm:items-end'>
        {toasts.map(toast => (
          <div
            key={toast.id}
            role='status'
            className={cn(
              'pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300',
              toast.tone === 'success' && 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100',
              toast.tone === 'error' && 'border-rose-400/60 bg-rose-500/15 text-rose-100',
              (!toast.tone || toast.tone === 'info') && 'border-white/15 bg-black/70 text-white'
            )}
          >
            <p className='text-sm font-medium'>{toast.title}</p>
            {toast.message ? <p className='mt-0.5 text-xs opacity-90'>{toast.message}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
