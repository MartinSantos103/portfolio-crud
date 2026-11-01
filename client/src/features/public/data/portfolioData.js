/**
 * Colección única de tecnologías.
 * Los proyectos referencian esta colección por `id` para mantener consistencia
 * cuando los datos provengan de la API del backend y la API de iconos.
 */
export const TECHNOLOGIES_COLLECTION = [
  { id: 'react', name: 'React', category: 'frontend', iconUrl: null },
  { id: 'vite', name: 'Vite', category: 'frontend', iconUrl: null },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend', iconUrl: null },
  { id: 'javascript', name: 'JavaScript', category: 'frontend', iconUrl: null },
  { id: 'nodejs', name: 'Node.js', category: 'backend', iconUrl: null },
  { id: 'express', name: 'Express', category: 'backend', iconUrl: null },
  { id: 'postgresql', name: 'PostgreSQL', category: 'database', iconUrl: null },
  { id: 'prisma', name: 'Prisma', category: 'database', iconUrl: null },
  { id: 'git', name: 'Git', category: 'tools', iconUrl: null },
  { id: 'github', name: 'GitHub', category: 'tools', iconUrl: null },
  { id: 'figma', name: 'Figma', category: 'tools', iconUrl: null },
  { id: 'vercel', name: 'Vercel', category: 'tools', iconUrl: null },
];

export const STACK_CATEGORIES = [
  { id: 'frontend', label: 'FRONTEND' },
  { id: 'backend', label: 'BACKEND' },
  { id: 'database', label: 'BASE DE DATOS' },
  { id: 'tools', label: 'HERRAMIENTAS' },
];

export const NAV_LINKS = [
  { id: 'sobre-mi', label: 'Sobre mí', href: '#sobre-mi' },
  { id: 'trayectoria', label: 'Trayectoria', href: '#trayectoria' },
  { id: 'proyectos', label: 'Proyectos', href: '#proyectos' },
  { id: 'servicios', label: 'Servicios', href: '#servicios' },
  { id: 'contacto', label: 'Contacto', href: '#contacto' },
];

export const PROFILE_DATA = {
  fullName: 'Lucas Andrade',
  available: true,
  availabilityLabel: 'Disponible para nuevos proyectos',
  greeting: 'Hola, soy',
  role: 'Desarrollador Web Full Stack',
  shortDescription: 'Construyo aplicaciones web rápidas, escalables, intuitivas y modernas.',
  typewriterPrefix: 'Construyo aplicaciones web',
  typewriterWords: ['rápidas', 'escalables', 'intuitivas', 'modernas'],
  primaryCtaLabel: 'Ver proyectos',
  secondaryCtaLabel: 'Contactar',
  cvLabel: 'Descargar CV',
  cvUrl: '#descargar-cv',
  photoUrl: null,
  photoPlaceholderLabel: 'Foto del profesional',
  scrollLabel: 'SCROLL',
  contactEmail: 'martinsantos4890@gmail.com',
  socialLinks: [
    { id: 'github', name: 'GitHub', url: 'https://github.com', iconUrl: null },
    { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com', iconUrl: null },
  ],
};

export const ABOUT_DATA = {
  sectionLabel: '01 / SOBRE MÍ',
  title: 'Sobre mí',
  subtitle: 'Quién soy, cómo trabajo y qué herramientas uso.',
  paragraphs: [
    'Soy desarrollador web full stack con foco en el ecosistema JavaScript. Disfruto construir productos desde la base de datos hasta los detalles de la interfaz, cuidando que el código sea legible y fácil de mantener.',
    'Me formé en programación universitaria y complementé con proyectos reales donde aprendí a tomar decisiones técnicas simples, priorizar lo importante y entregar a tiempo.',
    'Busco sumarme a equipos o proyectos donde pueda aportar criterio técnico, buena comunicación y ganas de seguir aprendiendo.',
  ],
  attitudes: [
    {
      id: 'curiosidad',
      title: 'Curiosidad',
      description: 'Exploro herramientas nuevas y entiendo el porqué detrás de cada tecnología.',
      iconUrl: null,
    },
    {
      id: 'trabajo-en-equipo',
      title: 'Trabajo en equipo',
      description: 'Código claro, revisiones constructivas y comunicación directa.',
      iconUrl: null,
    },
    {
      id: 'foco-en-lo-esencial',
      title: 'Foco en lo esencial',
      description: 'Soluciones simples primero, sin sobreingeniería innecesaria.',
      iconUrl: null,
    },
  ],
  stackTitle: 'Stack y herramientas',
  stackSubtitle: 'Tecnologías con las que trabajo en el día a día.',
};

export const TRAJECTORY_DATA = {
  sectionLabel: '02 / TRAYECTORIA',
  title: 'Trayectoria',
  subtitle: 'Mi recorrido académico y profesional hasta hoy.',
  filters: [
    { id: 'todo', label: 'Todo' },
    { id: 'formacion', label: 'Formación' },
    { id: 'experiencia', label: 'Experiencia' },
  ],
  entries: [
    {
      id: 'exp-1',
      type: 'experiencia',
      typeLabel: 'EXPERIENCIA',
      title: 'Desarrollador Full Stack Freelance',
      place: 'Proyectos para clientes',
      description:
        'Diseño y desarrollo de sitios web, paneles administrativos y APIs REST para pequeños negocios y profesionales.',
      date: '2025 — Actualidad',
    },
    {
      id: 'exp-2',
      type: 'experiencia',
      typeLabel: 'EXPERIENCIA',
      title: 'Desarrollador Frontend Jr.',
      place: 'Estudio Digital Nexo',
      description:
        'Maquetación en React y Tailwind, consumo de APIs y mantenimiento de componentes reutilizables en equipo ágil.',
      date: '2024 — 2025',
    },
    {
      id: 'form-1',
      type: 'formacion',
      typeLabel: 'FORMACIÓN',
      title: 'Tecnicatura en Desarrollo Web',
      place: 'Universidad / Instituto Superior',
      description:
        'Programación, estructuras de datos, bases de datos relacionales, ingeniería de software y arquitectura web.',
      date: '2023 — Actualidad',
    },
    {
      id: 'form-2',
      type: 'formacion',
      typeLabel: 'FORMACIÓN',
      title: 'Curso Full Stack JavaScript',
      place: 'Academia Online',
      description:
        'Desarrollo práctico con Node.js, Express, PostgreSQL y React aplicando control de versiones y despliegue en la nube.',
      date: '2023',
    },
  ],
};

export const PROJECTS_DATA = {
  sectionLabel: '03 / PROYECTOS',
  title: 'Proyectos',
  subtitle:
    'Selección de trabajos reales y académicos. Iniciá sesión para ver el detalle técnico y las demos.',
  lockBadgeLabel: 'Detalle con sesión',
  items: [
    {
      id: 1,
      title: 'Tienda en línea',
      summary:
        'Catálogo con carrito, pasarela de pagos e inventario administrable desde un panel privado.',
      description:
        'Plataforma de comercio electrónico completa con catálogo filtrable por categorías, carrito persistente, integración con pasarela de pagos, control de stock en tiempo real y panel de administración con métricas de ventas.',
      technologyIds: ['react', 'nodejs', 'postgresql'],
      cover_image_url: null,
      mockupVariant: 'store',
      repo_url: 'https://github.com',
      live_url: 'https://example.com',
    },
    {
      id: 2,
      title: 'Gestor de turnos',
      summary:
        'Sistema de reservas online con recordatorios automáticos y agenda por profesional.',
      description:
        'Aplicación web para consultorios y estudios profesionales que permite reservar turnos en tiempo real, configurar horarios de atención, gestionar bloqueos de agenda y enviar recordatorios automáticos por correo.',
      technologyIds: ['react', 'express', 'postgresql'],
      cover_image_url: null,
      mockupVariant: 'cards',
      repo_url: 'https://github.com',
      live_url: 'https://example.com',
    },
    {
      id: 3,
      title: 'Landing para estudio jurídico',
      summary:
        'Sitio institucional optimizado para buscadores con formulario de consultas y carga rápida.',
      description:
        'Sitio institucional moderno enfocado en conversión y posicionamiento orgánico (SEO), con secciones de áreas de práctica, equipo profesional y formulario de derivación directa por especialidad.',
      technologyIds: ['react', 'tailwind', 'vite'],
      cover_image_url: null,
      mockupVariant: 'chart',
      repo_url: 'https://github.com',
      live_url: 'https://example.com',
    },
    {
      id: 4,
      title: 'Panel de métricas',
      summary:
        'Tablero administrativo con gráficos interactivos, filtros por período y exportación de datos.',
      description:
        'Dashboard analítico para visualización de KPIs operativos, embudos de conversión, actividad de usuarios por período y exportación de reportes en CSV, con consultas agregadas en PostgreSQL.',
      technologyIds: ['react', 'nodejs', 'postgresql'],
      cover_image_url: null,
      mockupVariant: 'store',
      repo_url: 'https://github.com',
      live_url: 'https://example.com',
    },
    {
      id: 5,
      title: 'Sistema de reservas',
      summary:
        'Gestión de disponibilidad en tiempo real, estados de reserva y notificaciones por correo.',
      description:
        'Motor de reservas con validación de concurrencia en base de datos, estados de confirmación/cancelación, panel para operadores y notificaciones transaccionales con Nodemailer.',
      technologyIds: ['javascript', 'express', 'postgresql'],
      cover_image_url: null,
      mockupVariant: 'cards',
      repo_url: 'https://github.com',
      live_url: 'https://example.com',
    },
    {
      id: 6,
      title: 'Portfolio personal',
      summary:
        'Este mismo sitio: portfolio administrable con autenticación, métricas y modo oscuro.',
      description:
        'Aplicación fullstack desarrollada con React, Tailwind CSS, Framer Motion, Express y PostgreSQL (Neon), con protección de rutas por rol, fondo interactivo de estrellas en Canvas y panel de administración.',
      technologyIds: ['react', 'tailwind', 'vite'],
      cover_image_url: null,
      mockupVariant: 'chart',
      repo_url: 'https://github.com',
      live_url: 'https://example.com',
    },
  ],
};

export const SERVICES_DATA = {
  sectionLabel: '04 / SERVICIOS',
  title: 'Servicios',
  subtitle: 'En qué puedo ayudarte si trabajamos juntos.',
  ctaLabel: 'Solicitar cotización',
  items: [
    {
      id: 'sitios-landing',
      title: 'Sitios y landing pages',
      description:
        'Páginas rápidas, bien posicionadas y adaptadas a celular para presentar tu marca o producto.',
      items: ['Diseño responsive', 'Optimización de carga', 'Formulario de contacto'],
      iconUrl: null,
    },
    {
      id: 'apps-medida',
      title: 'Aplicaciones web a medida',
      description:
        'Sistemas con paneles de administración, usuarios, roles y lógica de negocio específica.',
      items: ['Autenticación y roles', 'Panel autogestionable', 'Base de datos en la nube'],
      iconUrl: null,
    },
    {
      id: 'apis-backend',
      title: 'APIs y backend',
      description:
        'Desarrollo de servicios REST seguros, integraciones con terceros y modelado de datos.',
      items: ['Node.js y Express', 'PostgreSQL y migraciones', 'Documentación clara'],
      iconUrl: null,
    },
  ],
};

export const CONTACT_DATA = {
  sectionLabel: '05 / CONTACTO',
  titleLines: ['¿Tenés una idea?', 'Hablemos.'],
  description:
    'Contame sobre tu proyecto, propuesta laboral o consulta. Respondo personalmente dentro de las 24 a 48 horas hábiles.',
  email: 'martinsantos4890@gmail.com',
  consultationTypes: [
    { value: 'cotizacion', label: 'Cotización' },
    { value: 'consulta', label: 'Consulta general' },
    { value: 'asesoria', label: 'Asesoría técnica' },
  ],
  defaultServiceOption: 'Sitios y landing pages',
  submitLabel: 'Enviar mensaje',
  authNotice: 'Mensaje directo a mi casilla de correo (o iniciá sesión si querés vincular tu cuenta)',
};

export const FOOTER_DATA = {
  copyright: '© 2026 Lucas Andrade. Hecho con dedicación.',
};

/**
 * Resuelve la lista de objetos de tecnología a partir de sus IDs o nombres,
 * utilizando la colección única TECHNOLOGIES_COLLECTION.
 */
export function resolveTechnologies(techRefs = [], collection = TECHNOLOGIES_COLLECTION) {
  const byId = new Map(collection.map((t) => [t.id.toLowerCase(), t]));
  const byName = new Map(collection.map((t) => [t.name.toLowerCase(), t]));

  return techRefs.map((ref) => {
    if (typeof ref === 'object' && ref !== null) {
      return ref;
    }
    const key = String(ref).toLowerCase().trim();
    return (
      byId.get(key) ||
      byName.get(key) || {
        id: key,
        name: String(ref),
        category: 'other',
        iconUrl: null,
      }
    );
  });
}
