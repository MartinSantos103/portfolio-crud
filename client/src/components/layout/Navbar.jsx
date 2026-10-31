import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import IconSlot from '../ui/IconSlot.jsx';
import { useAuth } from '../../features/auth/index.js';

/**
 * Header fijo de 72 px de alto, con padding lateral de 48 px (responsivo en móvil),
 * fondo --superficie al 72 % con desenfoque de 16 px y borde inferior de 1 px en --borde.
 *
 * - Izquierda: marca del logo (círculo de 16 px con relleno --acento al 30 % y borde --acento de 2 px)
 *   y nombre del desarrollador (Space Grotesk 700, 22 px, -0.3 px), con 10 px entre ambos.
 * - Derecha: 5 enlaces del menú (Inter 500, 15 px, --texto-suave, 32 px entre ellos) y a 36 px
 *   el grupo de acciones:
 *   - Interruptor sol y luna en píldora de 80x40 px, padding 4 px, dos espacios circulares de 32 px
 *     (activo relleno con --acento) con espacios de icono de 18 px.
 *   - A 12 px, botón circular de 40 px relleno con --acento para el icono de persona de 20 px.
 * - Cuando no hay sesión, el botón de persona abre el login emergente.
 * - Cuando hay sesión, abre un menú con Cerrar sesión y, si es admin, acceso al panel (/admin).
 */
export default function Navbar({
  developerName = 'Lucas Andrade',
  navLinks = [],
  onOpenAuthModal,
}) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeNotice, setThemeNotice] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScrollToSection = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/' + href);
      return;
    }

    if (href === '#inicio' || href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleThemeToggle = () => {
    // Por ahora solo existe el tema oscuro; las variables CSS ya están preparadas para sumar el claro
    document.documentElement.setAttribute('data-theme', 'dark');
    setThemeNotice(true);
    setTimeout(() => setThemeNotice(false), 2200);
  };

  const handleUserButtonClick = () => {
    if (!isAuthenticated) {
      if (onOpenAuthModal) {
        onOpenAuthModal('login');
      } else {
        navigate('/login');
      }
    } else {
      setUserMenuOpen((prev) => !prev);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 h-[72px] border-b border-[var(--borde)] bg-[var(--header-bg)] backdrop-blur-[16px]">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-[20px] sm:px-[32px] lg:px-[48px]">
        {/* Izquierda: Marca del logo (16px) + 10px + Nombre del desarrollador */}
        <a
          href="#inicio"
          onClick={(e) => handleScrollToSection(e, '#inicio')}
          className="flex items-center gap-[10px] text-[var(--texto)] no-underline focus:outline-none"
        >
          <span
            aria-hidden="true"
            className="inline-block h-[16px] w-[16px] shrink-0 rounded-full border-2 border-[var(--acento)] bg-[var(--logo-marca-bg)]"
          />
          <span className="font-heading text-[22px] font-bold tracking-[-0.3px] text-[var(--texto)]">
            {developerName}
          </span>
        </a>

        {/* Derecha (Escritorio >= 1024px): 5 enlaces con 32px entre ellos + 36px al grupo de acciones */}
        <div className="hidden items-center lg:flex">
          <nav aria-label="Navegación principal" className="flex items-center gap-[32px]">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleScrollToSection(e, link.href)}
                className="font-sans-ui text-[15px] font-medium text-[var(--texto-suave)] transition-colors duration-150 hover:text-[var(--texto)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Grupo de acciones a 36 px de distancia */}
          <div className="relative ml-[36px] flex items-center">
            {/* Interruptor sol y luna: píldora de 80 x 40 px, padding 4 px, dos círculos de 32 px */}
            <button
              type="button"
              onClick={handleThemeToggle}
              aria-label="Cambiar tema (modo oscuro activo)"
              title="Tema oscuro activo"
              className="flex h-[40px] w-[80px] cursor-pointer items-center justify-between rounded-full border border-[var(--borde)] bg-[var(--superficie-alta)] p-[4px]"
            >
              <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[var(--texto-suave)]">
                <IconSlot size={18} name="theme-sun" />
              </span>
              <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[var(--acento)] text-[var(--sobre-acento)]">
                <IconSlot size={18} name="theme-moon" />
              </span>
            </button>

            {themeNotice && (
              <div
                role="status"
                className="font-mono-ui absolute top-[48px] right-[52px] whitespace-nowrap rounded-[8px] border border-[var(--borde)] bg-[var(--superficie)] px-[10px] py-[6px] text-[11px] text-[var(--texto-suave)] shadow-lg"
              >
                Tema oscuro activo
              </div>
            )}

            {/* Botón circular de 40 px a 12 px del interruptor */}
            <div ref={menuRef} className="relative ml-[12px]">
              <button
                type="button"
                onClick={handleUserButtonClick}
                aria-label={
                  isAuthenticated ? `Menú de ${user?.name || 'usuario'}` : 'Iniciar sesión'
                }
                aria-expanded={userMenuOpen}
                className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[var(--acento)] text-[var(--sobre-acento)] transition-colors duration-150 hover:bg-[var(--acento-hover)]"
              >
                <IconSlot size={20} name="user-person" />
              </button>

              {/* Menú desplegable cuando hay sesión activa */}
              {isAuthenticated && userMenuOpen && (
                <div
                  role="menu"
                  className="absolute top-[48px] right-0 z-50 min-w-[210px] rounded-[12px] border border-[var(--borde)] bg-[var(--superficie)] p-[8px] shadow-xl"
                >
                  <div className="mb-[6px] border-b border-[var(--borde)] px-[12px] py-[8px]">
                    <p className="font-sans-ui truncate text-[14px] font-medium text-[var(--texto)]">
                      {user?.name}
                    </p>
                    <p className="font-mono-ui truncate text-[11px] text-[var(--texto-suave)]">
                      {user?.email}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/admin');
                      }}
                      className="font-sans-ui flex w-full cursor-pointer items-center justify-between rounded-[8px] px-[12px] py-[9px] text-left text-[14px] font-medium text-[var(--acento)] transition-colors hover:bg-[var(--superficie-alta)]"
                    >
                      <span>Panel de administración</span>
                    </button>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="font-sans-ui flex w-full cursor-pointer items-center justify-between rounded-[8px] px-[12px] py-[9px] text-left text-[14px] font-medium text-[var(--texto)] transition-colors hover:bg-[var(--superficie-alta)]"
                  >
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controles móviles (< 1024px): acciones y botón hamburguesa */}
        <div className="flex items-center gap-[10px] lg:hidden">
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label="Cambiar tema"
            className="flex h-[36px] w-[72px] cursor-pointer items-center justify-between rounded-full border border-[var(--borde)] bg-[var(--superficie-alta)] p-[3px]"
          >
            <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-[var(--texto-suave)]">
              <IconSlot size={16} name="theme-sun" />
            </span>
            <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[var(--acento)] text-[var(--sobre-acento)]">
              <IconSlot size={16} name="theme-moon" />
            </span>
          </button>

          <button
            type="button"
            onClick={handleUserButtonClick}
            aria-label={isAuthenticated ? 'Menú de usuario' : 'Iniciar sesión'}
            className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[var(--acento)] text-[var(--sobre-acento)]"
          >
            <IconSlot size={20} name="user-person" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
            className="flex h-[40px] w-[40px] cursor-pointer flex-col items-center justify-center gap-[5px] rounded-[12px] border border-[var(--borde)] bg-[var(--superficie)] text-[var(--texto)]"
          >
            <span
              className={`block h-[2px] w-[18px] bg-current transition-transform ${
                mobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />
            <span
              className={`block h-[2px] w-[18px] bg-current transition-opacity ${
                mobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`block h-[2px] w-[18px] bg-current transition-transform ${
                mobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {mobileMenuOpen && (
        <div className="border-b border-[var(--borde)] bg-[var(--superficie)] px-[24px] py-[20px] lg:hidden">
          <nav className="flex flex-col gap-[16px]">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleScrollToSection(e, link.href)}
                className="font-sans-ui text-[16px] font-medium text-[var(--texto-suave)] hover:text-[var(--texto)]"
              >
                {link.label}
              </a>
            ))}
            {isAuthenticated && (
              <div className="mt-[8px] flex flex-col gap-[10px] border-t border-[var(--borde)] pt-[12px]">
                <span className="font-mono-ui text-[12px] text-[var(--texto-suave)]">
                  Sesión activa: {user?.email}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/admin');
                    }}
                    className="font-sans-ui text-left text-[15px] font-medium text-[var(--acento)]"
                  >
                    Ir al Panel de administración
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="font-sans-ui text-left text-[15px] font-medium text-[var(--texto)]"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
