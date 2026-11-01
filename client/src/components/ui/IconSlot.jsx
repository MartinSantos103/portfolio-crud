import {
  Sun,
  Moon,
  User,
  ArrowRight,
  ArrowLeft,
  Download,
  Sparkles,
  Users,
  Target,
  Lock,
  Layout,
  AppWindow,
  Server,
  Check,
  Mail,
  Send,
  ChevronDown,
  ExternalLink,
  X,
  Menu,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Compass,
  Lightbulb,
  Code2,
} from 'lucide-react';
import DevIcon from './DevIcon.jsx';

/**
 * Mapeo de nombres de iconos de interfaz a componentes Lucide.
 */
const LUCIDE_ICON_MAP = {
  // Tema y usuario
  'theme-sun': Sun,
  'sun': Sun,
  'theme-moon': Moon,
  'moon': Moon,
  'user-person': User,
  'user': User,
  'profile-photo-placeholder': User,

  // Navegación y flechas
  'hero-arrow-right': ArrowRight,
  'arrow-right': ArrowRight,
  'send-arrow-right': Send,
  'auth-arrow': ArrowRight,
  'arrow-left': ArrowLeft,
  'chevron-down': ChevronDown,
  'external-demo': ExternalLink,
  'external-link': ExternalLink,
  'close': X,
  'x': X,
  'menu': Menu,
  'logout': LogOut,
  'dashboard': LayoutDashboard,

  // Acciones y estados
  'download-cv': Download,
  'download': Download,
  'check': Check,
  'lock-badge': Lock,
  'contact-lock': Lock,
  'lock': Lock,
  'contact-mail': Mail,
  'mail': Mail,

  // Actitudes (Sobre mí)
  'attitude-curiosidad': Sparkles,
  'curiosidad': Sparkles,
  'compass': Compass,
  'lightbulb': Lightbulb,
  'attitude-trabajo-en-equipo': Users,
  'trabajo-en-equipo': Users,
  'attitude-foco-en-lo-esencial': Target,
  'foco-en-lo-esencial': Target,

  // Servicios
  'service-sitios-landing': Layout,
  'sitios-landing': Layout,
  'service-apps-medida': AppWindow,
  'apps-medida': AppWindow,
  'service-apis-backend': Server,
  'apis-backend': Server,

  // Trayectoria
  'formacion': GraduationCap,
  'experiencia': Briefcase,
};

/**
 * IconSlot - Despachador de iconos para el portfolio.
 * - Iconos de interfaz: implementados mediante Lucide.
 * - Stack tecnológico y redes: implementados mediante Devicon.
 * - Soporte de URL directa de imagen si ya proviene de una API.
 *
 * @param {Object} props
 * @param {number} props.size - Tamaño del icono en píxeles
 * @param {string} [props.name] - Identificador semántico del icono
 * @param {string|null} [props.iconUrl] - URL del icono si ya proviene de la API
 * @param {string} [props.className] - Clases CSS adicionales
 * @param {number} [props.strokeWidth] - Grosor del trazo para iconos Lucide
 */
export default function IconSlot({
  size = 20,
  name = 'icon',
  iconUrl = null,
  className = '',
  strokeWidth = 2,
  ...props
}) {
  const dimensionStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
  };

  // 1. Si viene una URL directa, se renderiza la imagen
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        aria-hidden="true"
        data-icon-slot={name}
        style={dimensionStyle}
        className={`inline-block shrink-0 object-contain select-none ${className}`}
        {...props}
      />
    );
  }

  // 2. Redes sociales específicas de desarrollador (GitHub, LinkedIn)
  if (
    name.includes('github') ||
    name === 'github' ||
    name === 'repo-github'
  ) {
    return (
      <span
        data-icon-slot={name}
        style={dimensionStyle}
        className={`inline-flex shrink-0 items-center justify-center select-none ${className}`}
        {...props}
      >
        <DevIcon name="github" size={size} colored={false} />
      </span>
    );
  }

  if (name.includes('linkedin') || name === 'linkedin') {
    return (
      <span
        data-icon-slot={name}
        style={dimensionStyle}
        className={`inline-flex shrink-0 items-center justify-center select-none ${className}`}
        {...props}
      >
        <DevIcon name="linkedin" size={size} colored={false} />
      </span>
    );
  }

  // 3. Tecnologías (prefijo 'tech-')
  if (name.startsWith('tech-')) {
    const techKey = name.replace(/^tech-/, '');
    return (
      <span
        data-icon-slot={name}
        style={dimensionStyle}
        className={`inline-flex shrink-0 items-center justify-center select-none ${className}`}
        {...props}
      >
        <DevIcon name={techKey} size={size} />
      </span>
    );
  }

  // 4. Iconos de interfaz mediante Lucide
  const LucideIcon = LUCIDE_ICON_MAP[name];
  if (LucideIcon) {
    return (
      <LucideIcon
        size={size}
        strokeWidth={strokeWidth}
        aria-hidden="true"
        data-icon-slot={name}
        className={`shrink-0 select-none ${className}`}
        {...props}
      />
    );
  }

  // 5. Fallback por defecto si no coincide con ningún icono conocido
  return (
    <span
      aria-hidden="true"
      data-icon-slot={name}
      style={dimensionStyle}
      className={`inline-flex shrink-0 items-center justify-center text-[var(--texto-suave)] ${className}`}
      {...props}
    >
      <Code2 size={Math.max(12, size - 2)} strokeWidth={1.8} />
    </span>
  );
}
