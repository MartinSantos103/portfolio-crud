import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import { useAuth } from '../index.js';
import { apiFetch } from '../../../services/api.js';

/**
 * Ventana modal emergente de Inicio de sesión y Registro.
 * - Incluye selector de pestañas con radio de 12 px ("Iniciar sesión" / "Registrarse")
 * - Se integra con useAuth().login y ejecuta el callback `onSuccess` al autenticarse
 *   (por ejemplo, para redirigir al proyecto seleccionado o completar el envío de Contacto).
 */
export default function AuthModal({
  isOpen = false,
  initialMode = 'login',
  contextMessage = '',
  onClose,
  onSuccess,
}) {
  const { login } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [prevOpenState, setPrevOpenState] = useState({ isOpen, initialMode });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (
    prevOpenState.isOpen !== isOpen ||
    prevOpenState.initialMode !== initialMode
  ) {
    setPrevOpenState({ isOpen, initialMode });
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Completá tu correo y contraseña.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Completá tu nombre para registrarte.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        });
      }

      const result = await login(email.trim(), password);
      onSuccess?.(result.user);
      onClose?.();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo completar la autenticación.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCredentials = (demoEmail, demoPass) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-[20px]"
        >
          {/* Fondo translúcido con desenfoque */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--fondo)]/80 backdrop-blur-[8px]"
          />

          {/* Tarjeta modal (radio 20 px, padding 32 px, superficie y borde 1 px) */}
          <Motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            data-interactive-card="true"
            className="relative z-10 flex w-full max-w-[440px] flex-col gap-[20px] rounded-[20px] border border-[var(--borde)] bg-[var(--superficie)] p-[24px] shadow-2xl sm:p-[32px]"
          >
            <div className="flex items-start justify-between gap-[16px]">
              <div className="flex flex-col gap-[6px]">
                <span className="font-mono-ui text-[12px] font-medium uppercase tracking-[1.5px] text-[var(--acento)]">
                  ACCESO DE USUARIO
                </span>
                <h2
                  id="auth-modal-title"
                  className="font-heading text-[26px] font-bold tracking-[-0.4px] text-[var(--texto)]"
                >
                  {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ventana"
                className="font-mono-ui flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] text-[var(--texto-suave)] transition-colors hover:border-[var(--acento)] hover:text-[var(--texto)]"
              >
                <IconSlot size={18} name="close" />
              </button>
            </div>

            {contextMessage && (
              <p className="font-sans-ui rounded-[12px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-[14px] py-[10px] text-[13px] leading-[20px] text-[var(--texto-suave)]">
                {contextMessage}
              </p>
            )}

            {/* Selector de pestañas (radio 12 px) */}
            <div className="grid grid-cols-2 gap-[6px] rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] p-[4px]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`font-sans-ui cursor-pointer rounded-[8px] py-[8px] text-[14px] font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-[var(--superficie)] text-[var(--texto)] shadow-sm'
                    : 'text-[var(--texto-suave)] hover:text-[var(--texto)]'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`font-sans-ui cursor-pointer rounded-[8px] py-[8px] text-[14px] font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-[var(--superficie)] text-[var(--texto)] shadow-sm'
                    : 'text-[var(--texto-suave)] hover:text-[var(--texto)]'
                }`}
              >
                Registrarse
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[16px]">
              {mode === 'register' && (
                <FormField
                  as="input"
                  label="Nombre completo"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              )}

              <FormField
                as="input"
                label="Correo electrónico"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
              />

              <FormField
                as="input"
                label="Contraseña"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {errorMsg && (
                <div
                  role="alert"
                  className="font-sans-ui rounded-[12px] border border-red-400/40 bg-red-500/10 px-[14px] py-[10px] text-[13px] text-red-300"
                >
                  {errorMsg}
                </div>
              )}

              <Button type="submit" variant="primary" fullWidth disabled={submitting}>
                <span>
                  {submitting
                    ? 'Procesando...'
                    : mode === 'login'
                      ? 'Ingresar'
                      : 'Crear cuenta'}
                </span>
                <IconSlot size={18} name="auth-arrow" />
              </Button>
            </form>

            {/* Accesos rápidos a cuentas de prueba del seed */}
            <div className="flex flex-col gap-[8px] border-t border-[var(--borde)] pt-[14px]">
              <span className="font-mono-ui text-[11px] text-[var(--texto-suave)]">
                Cuentas de prueba (seed):
              </span>
              <div className="flex flex-wrap gap-[8px]">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('user@pf.local', 'user123')}
                  className="font-mono-ui cursor-pointer rounded-[8px] border border-[var(--borde)] bg-[var(--fondo)] px-[10px] py-[5px] text-[11px] text-[var(--texto-suave)] transition-colors hover:border-[var(--acento)] hover:text-[var(--texto)]"
                >
                  Usuario (user@pf.local)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin@pf.local', 'admin123')}
                  className="font-mono-ui cursor-pointer rounded-[8px] border border-[var(--borde)] bg-[var(--fondo)] px-[10px] py-[5px] text-[11px] text-[var(--texto-suave)] transition-colors hover:border-[var(--acento)] hover:text-[var(--texto)]"
                >
                  Admin (admin@pf.local)
                </button>
              </div>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
