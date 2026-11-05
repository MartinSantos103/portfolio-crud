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

  const isDanger = tone === 'danger';
  const toneColor = isDanger ? 'var(--bad)' : 'var(--warn)';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="card w-full max-w-[440px] rounded-[20px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border"
              style={{
                borderColor: `color-mix(in srgb, ${toneColor} 38%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${toneColor} 15%, transparent)`,
                color: toneColor,
              }}
            >
              <AlertTriangle size={20} />
            </span>
            <h2
              id="confirm-modal-title"
              className="font-heading text-[18px] font-bold text-[var(--tx)]"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Cerrar modal"
            className="cursor-pointer rounded-lg p-1 text-[var(--mut)] hover:bg-[var(--bg2)] hover:text-[var(--tx)]"
          >
            <X size={18} />
          </button>
        </div>

        <p className="font-sans-ui mt-3 text-[14px] leading-relaxed text-[var(--mut)]">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={
              isDanger
                ? {
                    backgroundColor: 'var(--bad)',
                    borderColor: 'var(--bad)',
                    color: '#0a0c1b',
                  }
                : undefined
            }
            className={`btn btn-sm font-semibold ${
              isDanger ? '' : 'p'
            }`}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
