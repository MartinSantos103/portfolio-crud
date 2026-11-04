/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'success', title, message, duration = 4200 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (message, title = 'Operación exitosa') =>
      showToast({ type: 'success', title, message }),
    error: (message, title = 'Error en la operación') =>
      showToast({ type: 'error', title, message, duration: 5500 }),
    info: (message, title = 'Aviso') =>
      showToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-[390px] flex-col gap-2.5"
      >
        {toasts.map((item) => {
          const isSuccess = item.type === 'success';
          const isError = item.type === 'error';

          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-[14px] border p-4 shadow-xl transition-all ${
                isSuccess
                  ? 'border-emerald-500/40 bg-[var(--superficie)] text-[var(--texto)]'
                  : isError
                    ? 'border-red-500/45 bg-[var(--superficie)] text-[var(--texto)]'
                    : 'border-[var(--borde)] bg-[var(--superficie)] text-[var(--texto)]'
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {isSuccess ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : isError ? (
                  <AlertCircle size={18} className="text-red-400" />
                ) : (
                  <Info size={18} className="text-[var(--acento-texto)]" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                {item.title && (
                  <p className="font-sans-ui text-[13px] font-semibold leading-tight text-[var(--texto)]">
                    {item.title}
                  </p>
                )}
                <p className="font-sans-ui mt-1 text-[13px] leading-snug text-[var(--texto-suave)]">
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(item.id)}
                aria-label="Cerrar notificación"
                className="cursor-pointer rounded-md p-1 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]"
              >
                <X size={15} />
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
    throw new Error('useToast debe usarse dentro de un <ToastProvider>');
  }
  return ctx;
}
