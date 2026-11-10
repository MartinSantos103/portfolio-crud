import { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCircle,
  FolderKanban,
  PlaySquare,
  Briefcase,
  Mail,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Palette,
  LogOut,
  Menu,
  X,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../features/auth/index.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useToast } from '../ui/Toast.jsx';
import {
  AdminFormProvider,
  useAdminFormContext,
} from '../../features/admin/context/AdminFormContext.jsx';

const SIDEBAR_GROUPS = [
  {
    title: 'Principal',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
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
  admin: 'Dashboard',
  perfil: 'Perfil',
  proyectos: 'Proyectos',
  demos: 'Demos',
  servicios: 'Servicios',
  mensajes: 'Mensajes',
  usuarios: 'Usuarios',
  metricas: 'Dashboard',
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
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <form
        onSubmit={handleReLogin}
        className="adm-card w-full max-w-[420px] rounded-[20px] p-6"
      >
        <div className="flex items-center gap-3">
          <span className="adm-ico">
            <Lock size={18} />
          </span>
          <div>
            <h2 id="relogin-modal-title" className="adm-h2">
              Tu sesión ha expirado
            </h2>
            <p className="adm-sub">
              Ingresá tu contraseña para continuar sin perder el borrador actual.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3.5">
          <div>
            <label className="adm-label">Correo de administrador</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="adm-input"
            />
          </div>

          <div>
            <label className="adm-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              className="adm-input"
            />
          </div>

          {errorMsg && (
            <p role="alert" className="font-sans-ui text-[13px] text-[var(--bad)]">
              {errorMsg}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="submit" disabled={submitting} className="adm-btn primary w-full">
            {submitting ? 'Verificando...' : 'Renovar sesión y mantener cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminLayoutInner() {
  const { user, logout } = useAuth();
  const { palettes, paletteIndex, currentPalette, setPalette } = useTheme();
  const { isDirty, isFormRoute, unreadMessagesCount } = useAdminFormContext();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [reLoginOpen, setReLoginOpen] = useState(false);
  const paletteRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setPaletteOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // En dispositivos móviles (< 1024px), cerrar el drawer de navegación al cambiar de ruta
  useEffect(() => {
    const timer = setTimeout(() => {
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
        BREADCRUMB_LABELS[seg] || (/^\d+$/.test(seg) ? `#${seg}` : seg);
      items.push({ path: currentPath, label });
    });
    return items;
  }, [location.pathname]);

  const userInitials = useMemo(() => {
    const name = user?.name || 'Admin';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [user?.name]);

  const renderSidebarContent = (isCompact = false) => (
    <div className="flex h-full flex-col justify-between">
      {/* Cabecera del Sidebar */}
      <div>
        <div
          className={`adm-brand flex h-[64px] items-center border-b border-[var(--adm-borde)] px-4 ${
            isCompact ? 'justify-center' : 'justify-between'
          }`}
        >
          {!isCompact && (
            <div className="flex items-center gap-2.5 truncate">
              <span className="logo-dot" aria-hidden="true" />
              <span className="font-heading truncate text-[16px] font-bold tracking-tight text-[var(--adm-texto)]">
                CMS Portfolio
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={isCompact ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            title={isCompact ? 'Expandir barra lateral' : 'Modo compacto (solo íconos)'}
            className="adm-iconbtn hidden lg:inline-grid"
          >
            {isCompact ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Navegación agrupada en 3 bloques */}
        <nav aria-label="Menú de administración" className="flex flex-col gap-1 p-3">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              {!isCompact && (
                <div className="adm-eyebrow adm-nav-group">{group.title}</div>
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
                      `adm-nav-item ${isCompact ? 'is-compact justify-center' : ''} ${
                        isActive ? 'is-active' : ''
                      }`
                    }
                  >
                    <Icon size={17} className="shrink-0" />
                    {!isCompact && <span className="truncate">{item.label}</span>}

                    {item.showUnreadBadge && unreadMessagesCount > 0 && (
                      <span
                        className={`adm-count ${
                          isCompact ? 'absolute top-1 right-1 !px-1.5 !py-0.5 !text-[9px]' : ''
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
      <div className="border-t border-[var(--adm-borde)] p-3">
        {!isCompact && (
          <div className="adm-user mb-2">
            <span className="adm-avatar sm" aria-hidden="true">
              {userInitials}
            </span>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[12.5px] font-semibold text-[var(--adm-texto)]">
                {user?.name || 'Administrador'}
              </b>
              <small className="adm-mono block truncate text-[11px]">
                {user?.email || 'admin@pf.local'}
              </small>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            logout();
          }}
          title={isCompact ? 'Cerrar sesión' : undefined}
          className={`adm-nav-item w-full text-left hover:!border-[rgba(251,113,133,0.35)] hover:!bg-[rgba(251,113,133,0.12)] hover:!text-[var(--bad)] ${
            isCompact ? 'is-compact justify-center' : ''
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          {!isCompact && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="adm-root flex min-h-screen w-full">
      <div className="adm-stars" aria-hidden="true" />

      {/* Sidebar fijo en escritorio (>= 1024px) */}
      <aside
        className={`adm-sidebar sticky top-0 self-start z-30 hidden h-screen h-[100dvh] shrink-0 transition-all duration-200 lg:block ${
          collapsed ? 'is-collapsed w-[72px]' : 'w-[244px]'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          {renderSidebarContent(collapsed)}
        </div>
      </aside>

      {/* Drawer móvil (< 1024px) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-[80] flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="adm-sidebar relative z-10 flex h-full w-[260px] flex-col">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Cerrar menú"
              className="adm-iconbtn absolute top-[15px] right-3 z-20"
            >
              <X size={16} />
            </button>
            <div className="flex h-full flex-col overflow-y-auto">
              {renderSidebarContent(false)}
            </div>
          </aside>
        </div>
      )}

      {/* Columna Principal: Topbar Contextual + Lienzo de Trabajo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="adm-topbar">
          <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Izquierda: Botón móvil + Migas de pan (Breadcrumbs) */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Abrir menú de navegación"
                className="adm-iconbtn lg:!hidden"
              >
                <Menu size={17} />
              </button>

              <nav aria-label="Migas de pan" className="flex items-center gap-1.5 truncate">
                <span className="adm-crumb-star" aria-hidden="true" />
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <span key={crumb.path} className="flex items-center gap-1.5 truncate">
                      {idx > 0 && (
                        <ChevronRight
                          size={14}
                          className="shrink-0 text-[var(--adm-texto-suave)]"
                        />
                      )}
                      {isLast ? (
                        <span className="font-sans-ui truncate text-[14px] font-semibold text-[var(--adm-texto)]">
                          {crumb.label}
                        </span>
                      ) : (
                        <Link
                          to={crumb.path}
                          className="font-sans-ui truncate text-[13px] font-medium text-[var(--adm-texto-suave)] hover:text-[var(--adm-texto)]"
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </span>
                  );
                })}
              </nav>
            </div>

            {/* Derecha: Estado del formulario + Selector de Paleta de Acento + Abrir sitio público */}
            <div className="flex shrink-0 items-center gap-2.5">
              {isFormRoute && (
                <span
                  role="status"
                  className={`badge hidden sm:inline-flex ${
                    isDirty ? 'badge-warn' : 'badge-ok'
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: isDirty ? 'var(--warn)' : 'var(--ok)' }}
                  />
                  <span>{isDirty ? 'Cambios sin guardar' : 'Guardado'}</span>
                </span>
              )}

              {/* Selector compartido de Paleta de Acento (misma clave 'ac' del sitio público) */}
              <div ref={paletteRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPaletteOpen((prev) => !prev)}
                  aria-label="Paleta de colores de acento"
                  aria-expanded={paletteOpen}
                  title={`Color de acento: ${currentPalette.name}`}
                  className="adm-btn secondary sm !px-2.5"
                >
                  <Palette size={15} className="text-[var(--ac2)]" />
                  <span className="hidden md:inline">{currentPalette.name}</span>
                </button>

                <div
                  className={`pp ${paletteOpen ? 'open' : ''}`}
                  role="dialog"
                  aria-label="Selector de color de acento"
                >
                  <p className="pt">Color de acento</p>
                  <div className="ps">
                    {palettes.map((p, idx) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setPalette(idx)}
                        style={{ '--c': p.ar }}
                        aria-label={p.name}
                        aria-pressed={paletteIndex === idx}
                        title={p.name}
                        className={`sw2 ${paletteIndex === idx ? 'on' : ''}`}
                      />
                    ))}
                  </div>
                  <p className="pn">{currentPalette.name}</p>
                </div>
              </div>

              {/* Botón «Volver al sitio público» */}
              <Link
                to="/"
                className="adm-btn secondary sm"
              >
                <ArrowLeft size={13} className="text-[var(--ac2)]" />
                <span className="hidden sm:inline">Volver al sitio público</span>
                <span className="sm:hidden">Sitio</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Contenido de la ruta administrativa activa */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-7">
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
