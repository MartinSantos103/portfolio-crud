import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import IconSlot from '../ui/IconSlot.jsx';
import { useAuth } from '../../features/auth/index.js';
import { useTheme } from '../../hooks/useTheme.js';

/**
 * Header fijo del sitio público con selector de paleta de acento (7 paletas),
 * menú de usuario y navegación responsive. Exclusivamente oscuro.
 */
export default function Navbar({
  developerName = 'Lucas Andrade',
  navLinks = [],
  onOpenAuthModal,
}) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { palettes, paletteIndex, currentPalette, setPalette } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const paletteRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setPaletteOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleScrollToSection = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setPaletteOpen(false);

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

  const handleUserButtonClick = () => {
    setPaletteOpen(false);
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
    <header className="fixed top-0 right-0 left-0 z-50 h-[72px] border-b border-[var(--bd)] bg-[var(--header-bg)] backdrop-blur-[14px]">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-[20px] sm:px-[32px] lg:px-[48px]">
        {/* Izquierda: Marca del logo + Nombre del desarrollador */}
        <a
          href="#inicio"
          onClick={(e) => handleScrollToSection(e, '#inicio')}
          className="flex items-center gap-[10px] text-[var(--tx)] no-underline focus:outline-none"
        >
          <span
            aria-hidden="true"
            className="inline-block h-[12px] w-[12px] shrink-0 rounded-full border-2 border-[var(--ac)] bg-[var(--logo-marca-bg)]"
          />
          <span className="font-heading text-[20px] font-bold tracking-[-0.3px] text-[var(--tx)]">
            {developerName}
          </span>
        </a>

        {/* Navegación central en escritorio */}
        <nav aria-label="Navegación principal" className="hidden items-center gap-[32px] lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(e) => handleScrollToSection(e, link.href)}
              className="font-sans-ui text-[15px] font-medium text-[var(--mut)] transition-colors duration-150 hover:text-[var(--tx)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Derecha: Selector de Paleta de Acento + Usuario + Menú móvil */}
        <div className="flex items-center gap-[10px]">
          {/* Selector de color de acento (.pal + .pp) */}
          <div ref={paletteRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setPaletteOpen((prev) => !prev);
                setUserMenuOpen(false);
                setMobileMenuOpen(false);
              }}
              aria-label="Paleta de colores"
              aria-expanded={paletteOpen}
              title={`Color de acento: ${currentPalette.name}`}
              className="pal"
            >
              <IconSlot size={18} name="palette" />
            </button>

            <div className={`pp ${paletteOpen ? 'open' : ''}`} role="dialog" aria-label="Selector de color de acento">
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

          {/* Botón circular de usuario / login */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={handleUserButtonClick}
              aria-label={
                isAuthenticated ? `Menú de ${user?.name || 'usuario'}` : 'Iniciar sesión'
              }
              aria-expanded={userMenuOpen}
              className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full border border-[var(--bd)] bg-[var(--ac)] text-[var(--sobre-acento)] transition-all duration-200 hover:bg-[var(--ac2)] hover:shadow-[0_0_18px_rgba(var(--ar),0.55)]"
            >
              {isAuthenticated && user?.name ? (
                <b className="font-heading text-[16px] leading-none">
                  {user.name.charAt(0).toUpperCase()}
                </b>
              ) : (
                <IconSlot size={20} name="user-person" />
              )}
            </button>

            {/* Menú desplegable cuando hay sesión activa */}
            {isAuthenticated && userMenuOpen && (
              <div
                role="menu"
                className="absolute top-[48px] right-0 z-50 min-w-[220px] rounded-[14px] border border-[var(--bd)] bg-[#04040af2] p-[8px] shadow-[0_20px_50px_-10px_#000,0_0_30px_-10px_rgba(var(--ar),0.5)] backdrop-blur-md"
              >
                <div className="mb-[6px] border-b border-[var(--bd)] px-[12px] py-[8px]">
                  <p className="font-sans-ui truncate text-[14px] font-medium text-[var(--tx)]">
                    {user?.name}
                  </p>
                  <p className="font-mono-ui truncate text-[11px] text-[var(--mut)]">
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
                    className="font-sans-ui flex w-full cursor-pointer items-center justify-between rounded-[8px] px-[12px] py-[9px] text-left text-[14px] font-medium text-[var(--ac2)] transition-colors hover:bg-[rgba(var(--ar),0.16)]"
                  >
                    <span>Panel de administración</span>
                    <IconSlot size={16} name="dashboard" />
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="font-sans-ui flex w-full cursor-pointer items-center justify-between rounded-[8px] px-[12px] py-[9px] text-left text-[14px] font-medium text-[var(--tx)] transition-colors hover:bg-[rgba(var(--ar),0.16)]"
                >
                  <span>Cerrar sesión</span>
                  <IconSlot size={16} name="logout" />
                </button>
              </div>
            )}
          </div>

          {/* Botón hamburguesa móvil */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((prev) => !prev);
              setPaletteOpen(false);
              setUserMenuOpen(false);
            }}
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
            className="flex h-[40px] w-[40px] cursor-pointer flex-col items-center justify-center gap-[5px] rounded-[10px] border border-[var(--bd)] bg-black/60 text-[var(--tx)] lg:hidden"
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
        <div className="border-b border-[var(--bd)] bg-[#04040af2] px-[24px] py-[20px] backdrop-blur-md lg:hidden">
          <nav className="flex flex-col gap-[16px]">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleScrollToSection(e, link.href)}
                className="font-sans-ui text-[16px] font-medium text-[var(--mut)] hover:text-[var(--tx)]"
              >
                {link.label}
              </a>
            ))}
            {isAuthenticated && (
              <div className="mt-[8px] flex flex-col gap-[12px] border-t border-[var(--bd)] pt-[14px]">
                <span className="font-mono-ui text-[12px] text-[var(--mut)]">
                  Sesión activa: {user?.email}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/admin');
                    }}
                    className="font-sans-ui flex items-center gap-[8px] text-left text-[15px] font-medium text-[var(--ac2)]"
                  >
                    <IconSlot size={16} name="dashboard" />
                    <span>Ir al Panel de administración</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="font-sans-ui flex items-center gap-[8px] text-left text-[15px] font-medium text-[var(--tx)]"
                >
                  <IconSlot size={16} name="logout" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
