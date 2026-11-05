import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  UserCircle,
  FolderKanban,
  PlaySquare,
  Briefcase,
  Mail,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../features/auth/index.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useToast } from '../ui/Toast.jsx';
import { AdminFormProvider, useAdminFormContext } from '../../features/admin/context/AdminFormContext.jsx';

const SIDEBAR_GROUPS = [
  {
    title: 'Principal',
    items: [
      { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
      { to: '/admin/metricas', label: 'Métricas', icon: BarChart3 },
    ],
  },
  {
    title: 'Contenido',
    items: [
      { to: '/admin/perfil', label: 'Perfil', icon: UserCircle },
      { to: '/admin/proyectos', label: 'Proyectos', icon: FolderKanban },
      { to: '/admin/demos', label: 'Demos', icon: PlaySquare },
      { to: '/admin/servicios', label: 'Servicios', icon: Briefcase },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { to: '/admin/mensajes', label: 'Mensajes', icon: Mail, showUnreadBadge: true },
      { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
    ],
  },
];

const BREADCRUMB_LABELS = {
  admin: 'Panel',
  perfil: 'Perfil',
  proyectos: 'Proyectos',
  demos: 'Demos',
  servicios: 'Servicios',
  mensajes: 'Mensajes',
  usuarios: 'Usuarios',
  metricas: 'Métricas',
  nuevo: 'Nuevo',
  editar: 'Editar',
};

/**
 * ReLoginModal - Renovación de Sesión sin Pérdida de Trabajo (Sección 2.3).
 * Se despliega sobre el formulario actual cuando cualquier pedido en /admin/* devuelve 401.
 * Conserva intacto el borrador en memoria tras volver a iniciar sesión.
 */
function ReLoginModal({ isOpen, onClose }) {
  const { user, login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState(user?.email || 'admin@pf.local');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleReLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!password.trim()) {
      setErrorMsg('Ingresá tu contraseña para renovar la sesión.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      setPassword('');
      toast.success('Sesión renovada. Tus cambios en memoria están intactos.');
      onClose?.();
    } catch (err) {
      setErrorMsg(err.message || 'Contraseña incorrecta. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="relogin-modal-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
    >
      <form
        onSubmit={handleReLogin}
        className="w-full max-w-[420px] rounded-[20px] border border-[var(--borde)] bg-[var(--superficie)] p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-violet-500/35 bg-violet-500/15 text-[var(--acento-texto)]">
            <Lock size={20} />
          </span>
          <div>
            <h2
              id="relogin-modal-title"
              className="font-heading text-[18px] font-bold text-[var(--texto)]"
            >
              Tu sesión ha expirado
            </h2>
            <p className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
              Ingresá tu contraseña para continuar sin perder el borrador actual.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3.5">
          <div>
            <label className="font-sans-ui mb-1.5 block text-[12px] font-medium text-[var(--texto)]">
              Correo de administrador
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
            />
          </div>

          <div>
            <label className="font-sans-ui mb-1.5 block text-[12px] font-medium text-[var(--texto)]">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
            />
          </div>

          {errorMsg && (
            <p role="alert" className="font-sans-ui text-[13px] text-red-400">
              {errorMsg}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="font-sans-ui w-full cursor-pointer rounded-[12px] bg-[var(--acento)] px-4 py-2.5 text-[14px] font-semibold text-[var(--sobre-acento)] transition-colors hover:bg-[var(--acento-hover)] disabled:opacity-60"
          >
            {submitting ? 'Verificando...' : 'Renovar sesión y mantener cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminLayoutInner() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isDirty, isFormRoute, unreadMessagesCount } = useAdminFormContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [reLoginOpen, setReLoginOpen] = useState(false);

  // Regla 4.2.1: Al entrar a una vista de edición o creación (o perfil), el Sidebar se colapsa
  // automáticamente a modo íconos para maximizar el ancho útil en notebooks de 1366px.
  useEffect(() => {
    const p = location.pathname;
    const isSplitPreviewRoute =
      p.endsWith('/nuevo') ||
      p.endsWith('/editar') ||
      p === '/admin/perfil';
    const timer = setTimeout(() => {
      if (isSplitPreviewRoute) {
        setCollapsed(true);
      }
      setMobileDrawerOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Regla 2.3: Escuchar el evento 'auth:session-expired' emitido por services/api.js
  useEffect(() => {
    const handleSessionExpired = () => {
      setReLoginOpen(true);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const items = [];
    let currentPath = '';
    segments.forEach((seg) => {
      currentPath += `/${seg}`;
      const label =
        BREADCRUMB_LABELS[seg] ||
        (/^\d+$/.test(seg) ? `#${seg}` : seg);
      items.push({ path: currentPath, label });
    });
    return items;
  }, [location.pathname]);

  const renderSidebarContent = (isCompact = false) => (
    <div className="flex h-full flex-col justify-between">
      {/* Cabecera del Sidebar */}
      <div>
        <div
          className={`flex h-[64px] items-center border-b border-[var(--borde)] px-4 ${
            isCompact ? 'justify-center' : 'justify-between'
          }`}
        >
          {!isCompact && (
            <div className="flex items-center gap-2.5 truncate">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[var(--acento)] bg-[var(--logo-marca-bg)]" />
              <span className="font-heading truncate text-[16px] font-bold tracking-tight text-[var(--texto)]">
                CMS Portfolio
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={isCompact ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            title={isCompact ? 'Expandir barra lateral' : 'Modo compacto (solo íconos)'}
            className="hidden cursor-pointer rounded-[8px] p-1.5 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)] lg:inline-flex"
          >
            {isCompact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navegación agrupada en 3 bloques */}
        <nav aria-label="Menú de administración" className="flex flex-col gap-5 p-3">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              {!isCompact && (
                <span className="font-mono-ui px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--texto-suave)]">
                  {group.title}
                </span>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={isCompact ? item.label : undefined}
                    className={({ isActive }) =>
                      `font-sans-ui relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors ${
                        isCompact ? 'justify-center' : 'justify-between'
                      } ${
                        isActive
                          ? 'bg-[var(--tile-icono-bg)] font-semibold text-[var(--acento-texto)]'
                          : 'text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon size={18} className="shrink-0" />
                      {!isCompact && <span className="truncate">{item.label}</span>}
                    </div>

                    {item.showUnreadBadge && unreadMessagesCount > 0 && (
                      <span
                        className={`font-mono-ui inline-flex items-center justify-center rounded-full bg-[var(--acento)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[var(--sobre-acento)] ${
                          isCompact ? 'absolute top-1 right-1' : ''
                        }`}
                      >
                        {unreadMessagesCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Pie del Sidebar: Usuario y Cerrar sesión */}
      <div className="border-t border-[var(--borde)] p-3">
        {!isCompact && (
          <div className="mb-2 rounded-[10px] bg-[var(--fondo)] px-3 py-2">
            <p className="font-sans-ui truncate text-[12px] font-semibold text-[var(--texto)]">
              {user?.name || 'Administrador'}
            </p>
            <p className="font-mono-ui truncate text-[11px] text-[var(--texto-suave)]">
              {user?.email || 'admin@pf.local'}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            logout();
          }}
          title={isCompact ? 'Cerrar sesión' : undefined}
          className={`font-sans-ui flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] font-medium text-[var(--texto-suave)] transition-colors hover:bg-red-500/10 hover:text-red-400 ${
            isCompact ? 'justify-center' : ''
          }`}
        >
          <LogOut size={17} />
          {!isCompact && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[var(--fondo)] text-[var(--texto)]">
      {/* Sidebar fijo en escritorio (>= 1024px) */}
      <aside
        className={`hidden shrink-0 border-r border-[var(--borde)] bg-[var(--superficie)] transition-all duration-200 lg:block ${
          collapsed ? 'w-[72px]' : 'w-[248px]'
        }`}
      >
        <div className="sticky top-0 h-screen overflow-y-auto">
          {renderSidebarContent(collapsed)}
        </div>
      </aside>

      {/* Drawer móvil (< 1024px) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-[80] flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[260px] flex-col border-r border-[var(--borde)] bg-[var(--superficie)]">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-4 right-3 cursor-pointer rounded-lg p-1.5 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)]"
            >
              <X size={18} />
            </button>
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Columna Principal: Topbar Contextual + Lienzo de Trabajo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-[64px] items-center justify-between gap-4 border-b border-[var(--borde)] bg-[var(--superficie)] px-4 sm:px-6">
          {/* Izquierda: Botón móvil + Migas de pan (Breadcrumbs) */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Abrir menú de navegación"
              className="inline-flex cursor-pointer rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)] p-2 text-[var(--texto)] lg:hidden"
            >
              <Menu size={18} />
            </button>

            <nav aria-label="Migas de pan" className="flex items-center gap-1.5 truncate">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <span key={crumb.path} className="flex items-center gap-1.5 truncate">
                    {idx > 0 && (
                      <ChevronRight size={14} className="shrink-0 text-[var(--texto-suave)]" />
                    )}
                    {isLast ? (
                      <span className="font-sans-ui truncate text-[14px] font-semibold text-[var(--texto)]">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        to={crumb.path}
                        className="font-sans-ui truncate text-[13px] font-medium text-[var(--texto-suave)] hover:text-[var(--texto)]"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>

          {/* Derecha: Estado del formulario + Conmutador de Tema + Abrir sitio público */}
          <div className="flex shrink-0 items-center gap-3">
            {isFormRoute && (
              <span
                role="status"
                className={`font-mono-ui hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium sm:inline-flex ${
                  isDirty
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-800 [html[data-theme="dark"]_&]:text-amber-300'
                    : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 [html[data-theme="dark"]_&]:text-emerald-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isDirty ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span>{isDirty ? 'Cambios sin guardar' : 'Guardado'}</span>
              </span>
            )}

            {/* Conmutador de Tema Claro / Oscuro */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              title={isDark ? 'Modo oscuro activo (clic para modo claro)' : 'Modo claro activo (clic para modo oscuro)'}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)] text-[var(--texto)] transition-colors hover:border-[var(--acento)]"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Botón «Volver al sitio público» — SPA navigation */}
            <Link
              to="/"
              className="font-sans-ui inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2 text-[13px] font-medium text-[var(--texto)] transition-colors hover:border-[var(--acento)] hover:bg-[var(--superficie-alta)]"
            >
              <ArrowLeft size={14} className="text-[var(--acento-texto)]" />
              <span className="hidden sm:inline">Volver al sitio público</span>
              <span className="sm:hidden">Sitio</span>
            </Link>
          </div>
        </header>

        {/* Contenido de la ruta administrativa activa */}
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Modal de Re-autenticación sobre el formulario actual */}
      <ReLoginModal isOpen={reLoginOpen} onClose={() => setReLoginOpen(false)} />
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminFormProvider>
      <AdminLayoutInner />
    </AdminFormProvider>
  );
}
