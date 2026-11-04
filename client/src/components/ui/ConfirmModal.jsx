import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button.jsx';

export default function ConfirmModal({
  isOpen,
  title = 'Confirmar acción',
  description = '¿Estás seguro de que deseas continuar?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-[440px] rounded-[20px] border border-[var(--borde)] bg-[var(--superficie)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border ${
                tone === 'danger'
                  ? 'border-red-500/35 bg-red-500/15 text-red-400'
                  : 'border-amber-500/35 bg-amber-500/15 text-amber-400'
              }`}
            >
              <AlertTriangle size={20} />
            </span>
            <h2
              id="confirm-modal-title"
              className="font-heading text-[18px] font-bold text-[var(--texto)]"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Cerrar modal"
            className="cursor-pointer rounded-lg p-1 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]"
          >
            <X size={18} />
          </button>
        </div>

        <p className="font-sans-ui mt-3 text-[14px] leading-relaxed text-[var(--texto-suave)]">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="!px-4 !py-2.5 !text-[14px]"
          >
            {cancelLabel}
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`font-sans-ui inline-flex cursor-pointer items-center justify-center rounded-[12px] px-4 py-2.5 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              tone === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[var(--acento)] text-[var(--sobre-acento)] hover:bg-[var(--acento-hover)]'
            }`}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
