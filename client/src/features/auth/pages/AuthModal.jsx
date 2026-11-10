import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import SuspendedAccountModal from '../../../components/ui/SuspendedAccountModal.jsx';
import { useAuth } from '../index.js';
import { apiFetch } from '../../../services/api.js';

/**
 * Ventana modal emergente de Inicio de sesión y Registro tematizada según
 * Portfolio_animado_v4.html (.ov, .am, .tabs, .xb), conservando intacta la lógica
 * real de autenticación (useAuth().login, useAuth().loginWithGoogle, /auth/register, credenciales demo del seed).
 * Si la cuenta está suspendida, despliega la ventana emergente SuspendedAccountModal.
 */
export default function AuthModal({
  isOpen = false,
  initialMode = 'login',
  contextMessage = '',
  onClose,
  onSuccess,
}) {
  const { login, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [prevOpenState, setPrevOpenState] = useState({ isOpen, initialMode });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [suspendedAlert, setSuspendedAlert] = useState({
    open: false,
    email: '',
    context: 'general',
    message: '',
  });

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
      if (e.key === 'Escape' && !suspendedAlert.open) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, suspendedAlert.open]);

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
      if (
        err.code === 'ACCOUNT_SUSPENDED' ||
        err.code === 'ACCOUNT_DISABLED' ||
        err.status === 403
      ) {
        setSuspendedAlert({
          open: true,
          email: email.trim(),
          context: mode === 'register' ? 'register' : 'login',
          message: err.message || '',
        });
      } else {
        setErrorMsg(err.message || 'No se pudo completar la autenticación.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg('');
    if (!credentialResponse?.credential) {
      setErrorMsg('No se recibió la credencial de Google.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      onSuccess?.(result.user);
      onClose?.();
    } catch (err) {
      if (
        err.code === 'ACCOUNT_SUSPENDED' ||
        err.code === 'ACCOUNT_DISABLED' ||
        err.status === 403
      ) {
        setSuspendedAlert({
          open: true,
          email: email.trim(),
          context: mode === 'register' ? 'register' : 'login',
          message: err.message || '',
        });
      } else {
        setErrorMsg(err.message || 'No se pudo iniciar sesión con Google.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Se canceló o falló la autenticación con Google.');
  };

  const fillDemoCredentials = (demoEmail, demoPass) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="fixed inset-0 z-[70] flex items-center justify-center p-[16px]"
          >
            {/* Fondo translúcido con desenfoque */}
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/75 backdrop-blur-[10px]"
            />

            {/* Tarjeta modal cósmica (.am) */}
            <Motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              data-interactive-card="true"
              className="card relative z-10 flex w-full max-w-[440px] flex-col gap-[16px] rounded-[20px] p-[26px] sm:p-[28px]"
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ventana"
                className="absolute top-[16px] right-[16px] z-10 grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-[10px] border border-[var(--bd)] bg-black/40 text-[var(--mut)] transition-all duration-200 hover:rotate-90 hover:border-[var(--ac)] hover:text-white"
              >
                <IconSlot size={16} name="close" />
              </button>

              <div className="pr-[40px]">
                <h2
                  id="auth-modal-title"
                  className="font-heading text-[27px] font-bold leading-[1.15] text-white"
                >
                  {mode === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}
                </h2>
                <p className="mt-[6px] font-sans-ui text-[14px] text-[#b8bddf]">
                  {contextMessage ||
                    (mode === 'login'
                      ? 'Para ver detalles técnicos y enviar mensajes.'
                      : 'Registrate para desbloquear el detalle de los proyectos.')}
                </p>
              </div>

              {/* Selector de pestañas con indicador deslizable (.tabs) */}
              <div className="relative grid grid-cols-2 rounded-[12px] border border-[var(--bd)] bg-[var(--bg2)]/80 p-[4px] backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute top-[4px] bottom-[4px] left-[4px] w-[calc(50%-4px)] rounded-[9px] bg-[var(--ac)] shadow-[0_0_18px_rgba(var(--ar),0.5)] transition-transform duration-300 ${
                    mode === 'register' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setShowPassword(false);
                  }}
                  className={`font-sans-ui relative z-10 cursor-pointer rounded-[8px] py-[10px] text-[14px] font-medium transition-colors ${
                    mode === 'login'
                      ? 'text-[#0a0c1b]'
                      : 'text-[var(--mut)] hover:text-white'
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setShowPassword(false);
                  }}
                  className={`font-sans-ui relative z-10 cursor-pointer rounded-[8px] py-[10px] text-[14px] font-medium transition-colors ${
                    mode === 'register'
                      ? 'text-[#0a0c1b]'
                      : 'text-[var(--mut)] hover:text-white'
                  }`}
                >
                  Registrarme
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[14px]">
                {mode === 'register' && (
                  <FormField
                    as="input"
                    label="Nombre"
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
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                />

                <div className="f flex flex-col">
                  <label htmlFor="auth-password" className="field-label">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="ui-input pr-[48px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute top-1/2 right-[6px] grid h-[36px] w-[36px] -translate-y-1/2 cursor-pointer place-items-center rounded-[8px] text-[var(--mut)] transition-colors hover:text-[var(--ac2)]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--bad) 40%, transparent)',
                      backgroundColor: 'color-mix(in srgb, var(--bad) 12%, transparent)',
                      color: 'var(--bad)',
                    }}
                    className="font-sans-ui rounded-[12px] border px-[14px] py-[10px] text-[13px]"
                  >
                    {errorMsg}
                  </div>
                )}

                <Button type="submit" variant="primary" fullWidth disabled={submitting} className="h-[50px]">
                  {submitting ? (
                    <>
                      <i className="sp" aria-hidden="true" />
                      <span>{mode === 'login' ? 'Ingresando…' : 'Creando cuenta…'}</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</span>
                      <IconSlot size={16} name="auth-arrow" />
                    </>
                  )}
                </Button>
              </form>

              {/* Inicio de sesión con Google OAuth 2.0 */}
              <div className="flex flex-col items-center gap-[12px]">
                <div className="flex w-full items-center gap-[12px]">
                  <div className="h-[1px] flex-1 bg-[var(--bd)]" />
                  <span className="font-mono-ui text-[11px] uppercase tracking-wider text-[var(--mut)]">
                    o continuar con
                  </span>
                  <div className="h-[1px] flex-1 bg-[var(--bd)]" />
                </div>

                <div className="flex w-full justify-center overflow-hidden rounded-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    width="380"
                    text="continue_with"
                    locale="es"
                  />
                </div>
              </div>

              {/* Accesos rápidos a cuentas de prueba del seed */}
              <div className="flex flex-col gap-[8px] border-t border-[var(--bd)] pt-[12px]">
                <span className="font-mono-ui text-[11px] text-[var(--mut)]">
                  Cuentas de prueba (seed):
                </span>
                <div className="flex flex-wrap gap-[8px]">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('user@pf.local', 'user123')}
                    className="font-mono-ui cursor-pointer rounded-[8px] border border-[var(--bd)] bg-[var(--card)]/90 px-[10px] py-[5px] text-[11px] text-[var(--mut)] transition-colors hover:border-[var(--ac)] hover:bg-[rgba(var(--ar),0.12)] hover:text-[var(--tx)]"
                  >
                    Usuario (user@pf.local)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin@pf.local', 'admin123')}
                    className="font-mono-ui cursor-pointer rounded-[8px] border border-[var(--bd)] bg-[var(--card)]/90 px-[10px] py-[5px] text-[11px] text-[var(--mut)] transition-colors hover:border-[var(--ac)] hover:bg-[rgba(var(--ar),0.12)] hover:text-[var(--tx)]"
                  >
                    Admin (admin@pf.local)
                  </button>
                </div>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <SuspendedAccountModal
        isOpen={suspendedAlert.open}
        email={suspendedAlert.email}
        context={suspendedAlert.context}
        customMessage={suspendedAlert.message}
        onClose={() =>
          setSuspendedAlert((prev) => ({ ...prev, open: false }))
        }
      />
    </>
  );
}
