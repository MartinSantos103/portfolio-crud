import { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Ban, X } from 'lucide-react';

/**
 * Ventana emergente de aviso de Cuenta Suspendida.
 * Aparece tanto al intentar registrarse / iniciar sesión como al intentar enviar un correo
 * a través del formulario de contacto con una cuenta o dirección suspendida.
 */
export default function SuspendedAccountModal({
  isOpen = false,
  email = '',
  context = 'general', // 'register' | 'login' | 'mail' | 'general'
  customMessage = '',
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getContextExplanation = () => {
    if (customMessage) return customMessage;
    if (context === 'mail') {
      return 'Tu cuenta se encuentra suspendida por el administrador. El correo del emisario no es válido y no tienes permitido enviar correos ni consultas a través del programa.';
    }
    if (context === 'register') {
      return 'La cuenta asociada a este correo electrónico se encuentra suspendida. No es posible volver a registrarse ni operar en la plataforma con esta dirección.';
    }
    return 'Tu cuenta ha sido suspendida por el administrador. Mientras permanezca en este estado no podrás iniciar sesión, registrarte ni enviar correos a través del programa.';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="suspended-modal-title"
          aria-describedby="suspended-modal-desc"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        >
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-[10px]"
          />

          <Motion.div
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.95 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="card relative z-10 flex w-full max-w-[440px] flex-col gap-5 rounded-[22px] border border-[rgba(251,113,133,0.45)] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar aviso"
              className="absolute top-4 right-4 grid h-8 w-8 cursor-pointer place-items-center rounded-[10px] border border-[var(--bd)] bg-black/40 text-[var(--mut)] transition-colors hover:border-[var(--bad)] hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3.5 pr-8">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border"
                style={{
                  borderColor: 'color-mix(in srgb, var(--bad) 45%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--bad) 14%, transparent)',
                  color: 'var(--bad)',
                }}
              >
                <ShieldAlert size={24} />
              </div>
              <div>
                <span className="font-mono-ui inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-[var(--bad)]">
                  <Ban size={12} />
                  Acceso Restringido
                </span>
                <h2
                  id="suspended-modal-title"
                  className="font-heading mt-0.5 text-[22px] font-bold leading-tight text-white"
                >
                  Cuenta Suspendida
                </h2>
              </div>
            </div>

            <p
              id="suspended-modal-desc"
              className="font-sans-ui text-[14.5px] leading-relaxed text-[#d4d8f0]"
            >
              {getContextExplanation()}
            </p>

            {email && (
              <div
                className="flex items-center justify-between gap-2 rounded-[12px] border px-3.5 py-2.5 text-[12.5px]"
                style={{
                  borderColor: 'color-mix(in srgb, var(--bad) 35%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--bad) 10%, transparent)',
                }}
              >
                <span className="font-mono-ui text-[var(--mut)]">Correo afectado:</span>
                <span className="font-mono-ui truncate font-semibold text-[var(--bad)]">
                  {email}
                </span>
              </div>
            )}

            <div className="rounded-[12px] border border-[var(--bd)] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-[var(--mut)]">
              Restricciones activas: inicio de sesión deshabilitado, registro bloqueado y envío de correos inválido a través del formulario de contacto.
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'var(--bad)',
                  borderColor: 'var(--bad)',
                  color: '#0a0c1b',
                }}
                className="btn h-[44px] w-full cursor-pointer justify-center rounded-[12px] text-[14px] font-bold transition-opacity hover:opacity-90 sm:w-auto sm:px-6"
              >
                Entendido
              </button>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
