/* eslint-disable react-refresh/only-export-components */
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
  Database,
  Shield,
  Smartphone,
  Cloud,
  Cpu,
  Globe,
  Layers,
  Terminal,
  Zap,
  Wrench,
  BarChart3,
} from 'lucide-react';
import DevIcon from './DevIcon.jsx';

export const CURATED_SERVICE_ICONS = [
  { key: 'sitios-landing', label: 'Diseño Web / Landing' },
  { key: 'apps-medida', label: 'Aplicación a Medida' },
  { key: 'apis-backend', label: 'API / Servidor Backend' },
  { key: 'database', label: 'Base de Datos / SQL' },
  { key: 'smartphone', label: 'Mobile / Responsivo' },
  { key: 'cloud', label: 'Despliegue Cloud / DevOps' },
  { key: 'shield', label: 'Seguridad / Auditoría' },
  { key: 'bar-chart', label: 'Analítica / Dashboards' },
  { key: 'layers', label: 'Arquitectura Fullstack' },
  { key: 'terminal', label: 'Automatización / CLI' },
  { key: 'zap', label: 'Optimización / Performance' },
  { key: 'wrench', label: 'Mantenimiento / Soporte' },
  { key: 'globe', label: 'SEO / Presencia Digital' },
  { key: 'cpu', label: 'Integraciones / IA' },
];

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
  'layout': Layout,
  'service-apps-medida': AppWindow,
  'apps-medida': AppWindow,
  'app-window': AppWindow,
  'service-apis-backend': Server,
  'apis-backend': Server,
  'server': Server,
  'service-database': Database,
  'database': Database,
  'service-shield': Shield,
  'shield': Shield,
  'service-smartphone': Smartphone,
  'smartphone': Smartphone,
  'service-cloud': Cloud,
  'cloud': Cloud,
  'service-cpu': Cpu,
  'cpu': Cpu,
  'service-globe': Globe,
  'globe': Globe,
  'service-layers': Layers,
  'layers': Layers,
  'service-terminal': Terminal,
  'terminal': Terminal,
  'service-zap': Zap,
  'zap': Zap,
  'service-wrench': Wrench,
  'wrench': Wrench,
  'service-bar-chart': BarChart3,
  'bar-chart': BarChart3,

  // Trayectoria
  'formacion': GraduationCap,
  'educacion': GraduationCap,
  'experiencia': Briefcase,
};

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

  const LucideIcon = LUCIDE_ICON_MAP[name] || LUCIDE_ICON_MAP[name.replace(/^service-/, '')];
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
