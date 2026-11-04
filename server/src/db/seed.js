import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getPool, closePool } from './pool.js';
import { applySchema } from './schema.js';

const INITIAL_STACK = [
  { id: 'react', name: 'React', category: 'frontend', icon_key: 'react' },
  { id: 'vite', name: 'Vite', category: 'frontend', icon_key: 'vite' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend', icon_key: 'tailwind' },
  { id: 'javascript', name: 'JavaScript', category: 'frontend', icon_key: 'javascript' },
  { id: 'nodejs', name: 'Node.js', category: 'backend', icon_key: 'nodejs' },
  { id: 'express', name: 'Express', category: 'backend', icon_key: 'express' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'database', icon_key: 'postgresql' },
  { id: 'prisma', name: 'Prisma', category: 'database', icon_key: 'prisma' },
  { id: 'git', name: 'Git', category: 'tools', icon_key: 'git' },
  { id: 'github', name: 'GitHub', category: 'tools', icon_key: 'github' },
  { id: 'figma', name: 'Figma', category: 'tools', icon_key: 'figma' },
  { id: 'vercel', name: 'Vercel', category: 'tools', icon_key: 'vercel' },
];

const INITIAL_EXPERIENCE = [
  {
    id: 'exp-1',
    type: 'experiencia',
    title: 'Desarrollador Full Stack Freelance',
    organization: 'Proyectos para clientes',
    place: 'Proyectos para clientes',
    start_date: '2025',
    end_date: '',
    current: true,
    date: '2025 — Actualidad',
    description:
      'Diseño y desarrollo de sitios web, paneles administrativos y APIs REST para pequeños negocios y profesionales.',
  },
  {
    id: 'exp-2',
    type: 'experiencia',
    title: 'Desarrollador Frontend Jr.',
    organization: 'Estudio Digital Nexo',
    place: 'Estudio Digital Nexo',
    start_date: '2024',
    end_date: '2025',
    current: false,
    date: '2024 — 2025',
    description:
      'Maquetación en React y Tailwind, consumo de APIs y mantenimiento de componentes reutilizables en equipo ágil.',
  },
];

const INITIAL_EDUCATION = [
  {
    id: 'form-1',
    type: 'educacion',
    title: 'Tecnicatura en Desarrollo Web',
    organization: 'Universidad / Instituto Superior',
    place: 'Universidad / Instituto Superior',
    start_date: '2023',
    end_date: '',
    current: true,
    date: '2023 — Actualidad',
    description:
      'Programación, estructuras de datos, bases de datos relacionales, ingeniería de software y arquitectura web.',
  },
  {
    id: 'form-2',
    type: 'educacion',
    title: 'Curso Full Stack JavaScript',
    organization: 'Academia Online',
    place: 'Academia Online',
    start_date: '2023',
    end_date: '2023',
    current: false,
    date: '2023',
    description:
      'Desarrollo práctico con Node.js, Express, PostgreSQL y React aplicando control de versiones y despliegue en la nube.',
  },
];

const INITIAL_SOCIAL_LINKS = {
  github: 'https://github.com',
  linkedin: 'https://linkedin.com',
};

const INITIAL_SERVICES = [
  {
    title: 'Sitios y landing pages',
    description:
      'Páginas rápidas, bien posicionadas y adaptadas a celular para presentar tu marca o producto.',
    icon: 'sitios-landing',
    items: ['Diseño responsive', 'Optimización de carga', 'Formulario de contacto'],
    sort_order: 1,
    active: true,
  },
  {
    title: 'Aplicaciones web a medida',
    description:
      'Sistemas con paneles de administración, usuarios, roles y lógica de negocio específica.',
    icon: 'apps-medida',
    items: ['Autenticación y roles', 'Panel autogestionable', 'Base de datos en la nube'],
    sort_order: 2,
    active: true,
  },
  {
    title: 'APIs y backend',
    description:
      'Desarrollo de servicios REST seguros, integraciones con terceros y modelado de datos.',
    icon: 'apis-backend',
    items: ['Node.js y Express', 'PostgreSQL y migraciones', 'Documentación clara'],
    sort_order: 3,
    active: true,
  },
];

const INITIAL_PROJECTS = [
  {
    title: 'Tienda en línea',
    slug: 'tienda-en-linea',
    summary:
      'Catálogo con carrito, pasarela de pagos e inventario administrable desde un panel privado.',
    description:
      'Catálogo con carrito, pasarela de pagos e inventario administrable desde un panel privado.',
    problem:
      'El cliente gestionaba pedidos por mensajería manual sin control de stock en tiempo real, generando quiebres de inventario y demoras en el despacho.',
    solution:
      'Se construyó una plataforma de comercio electrónico con catálogo filtrable, carrito persistente, checkout integrado y panel administrativo de inventario.',
    tech_decisions:
      'Se eligió React 19 con estado sincronizado para el carrito, API REST en Express y PostgreSQL transaccional para bloquear stock durante la compra.',
    technologies: ['react', 'nodejs', 'postgresql'],
    repo_url: 'https://github.com',
    live_url: 'https://example.com',
    featured: true,
    published: true,
    sort_order: 1,
  },
  {
    title: 'Gestor de turnos',
    slug: 'gestor-de-turnos',
    summary:
      'Sistema de reservas online con recordatorios automáticos y agenda por profesional.',
    description:
      'Sistema de reservas online con recordatorios automáticos y agenda por profesional.',
    problem:
      'Los consultorios tenían alta tasa de ausentismo y superposición de horarios por llevar las agendas en planillas desconectadas.',
    solution:
      'Aplicación web de reservas en tiempo real con disponibilidad por profesional, bloqueo de franjas y recordatorios automáticos por correo.',
    tech_decisions:
      'Índices únicos compuestos en PostgreSQL para evitar dobles reservas concurrentes y envío transaccional con Nodemailer.',
    technologies: ['react', 'express', 'postgresql'],
    repo_url: 'https://github.com',
    live_url: 'https://example.com',
    featured: true,
    published: true,
    sort_order: 2,
  },
  {
    title: 'Landing para estudio jurídico',
    slug: 'landing-estudio-juridico',
    summary:
      'Sitio institucional optimizado para buscadores con formulario de consultas y carga rápida.',
    description:
      'Sitio institucional optimizado para buscadores con formulario de consultas y carga rápida.',
    problem:
      'El estudio carecía de presencia digital clara y perdía consultas calificadas por no clasificar las especialidades legales.',
    solution:
      'Landing page de alto rendimiento con secciones por área de práctica y formulario de derivación directa.',
    tech_decisions:
      'Vite + React + Tailwind CSS v4 priorizando Core Web Vitals, semántica HTML accesible y carga instantánea.',
    technologies: ['react', 'tailwind', 'vite'],
    repo_url: 'https://github.com',
    live_url: 'https://example.com',
    featured: false,
    published: true,
    sort_order: 3,
  },
  {
    title: 'Panel de métricas',
    slug: 'panel-de-metricas',
    summary:
      'Tablero administrativo con gráficos interactivos, filtros por período y exportación de datos.',
    description:
      'Tablero administrativo con gráficos interactivos, filtros por período y exportación de datos.',
    problem:
      'Las métricas de negocio se calculaban manualmente cada fin de mes sin visibilidad diaria de conversión.',
    solution:
      'Dashboard analítico interactivo con series temporales parametrizadas, KPIs de conversión y ranking de contenidos.',
    tech_decisions:
      'Consultas SQL con generate_series en zona horaria local y visualización responsiva mediante Recharts.',
    technologies: ['react', 'nodejs', 'postgresql'],
    repo_url: 'https://github.com',
    live_url: 'https://example.com',
    featured: true,
    published: true,
    sort_order: 4,
  },
];

async function runSeed() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const hasForceFlag = process.argv.includes('--force');

  if (isProduction && !hasForceFlag) {
    console.error('⛔ ERROR: Se detectó un entorno de producción.');
    console.error('El script de seed inserta o altera datos de desarrollo.');
    console.error('Para forzar la ejecución en producción, ejecuta: npm run seed -- --force');
    process.exit(1);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🔄 Aplicando esquema y migraciones (schema.sql + 002_admin_spec_alignment.sql)...');
    await applySchema(client);
    console.log('✅ Tablas, columnas e índices verificados/creados correctamente.');

    console.log('🔄 Generando credenciales de prueba con bcrypt...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);

    await client.query(
      `
      INSERT INTO users (name, email, password_hash, role, active)
      VALUES 
        ('Administrador', 'admin@pf.local', $1, 'admin', TRUE),
        ('Usuario Prueba', 'user@pf.local', $2, 'user', TRUE)
      ON CONFLICT (lower(email)) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        active = EXCLUDED.active;
    `,
      [adminHash, userHash]
    );
    console.log('✅ Usuarios de prueba creados/actualizados (admin@pf.local y user@pf.local).');

    const fullBio = [
      'Soy desarrollador web full stack con foco en el ecosistema JavaScript. Disfruto construir productos desde la base de datos hasta los detalles de la interfaz, cuidando que el código sea legible y fácil de mantener.',
      'Me formé en programación universitaria y complementé con proyectos reales donde aprendí a tomar decisiones técnicas simples, priorizar lo importante y entregar a tiempo.',
      'Busco sumarme a equipos o proyectos donde pueda aportar criterio técnico, buena comunicación y ganas de seguir aprendiendo.',
    ].join('\n\n');

    await client.query(
      `
      INSERT INTO profile (
        id, full_name, headline, short_bio, bio, location, contact_email, cv_url, available,
        social_links, skills, stack, experience, education
      )
      VALUES (
        1,
        'Lucas Andrade',
        'Desarrollador Web Full Stack',
        'Construyo aplicaciones web rápidas, escalables, intuitivas y modernas.',
        $1,
        'Salta, Argentina',
        'martinsantos4890@gmail.com',
        '#descargar-cv',
        TRUE,
        $2::jsonb,
        $3::jsonb,
        $3::jsonb,
        $4::jsonb,
        $5::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = CASE
          WHEN profile.full_name IS NULL OR profile.full_name = '' OR profile.full_name = 'Desarrollador Fullstack'
          THEN EXCLUDED.full_name
          ELSE profile.full_name
        END,
        headline = CASE
          WHEN profile.headline IS NULL OR profile.headline = '' OR profile.headline = 'React & Node.js Developer'
          THEN EXCLUDED.headline
          ELSE profile.headline
        END,
        short_bio = CASE
          WHEN profile.short_bio IS NULL OR profile.short_bio = ''
          THEN EXCLUDED.short_bio
          ELSE profile.short_bio
        END,
        bio = CASE
          WHEN profile.bio IS NULL OR profile.bio = '' OR profile.full_name = 'Desarrollador Fullstack'
          THEN EXCLUDED.bio
          ELSE profile.bio
        END,
        location = CASE
          WHEN profile.location IS NULL OR profile.location = ''
          THEN EXCLUDED.location
          ELSE profile.location
        END,
        contact_email = CASE
          WHEN profile.contact_email IS NULL OR profile.contact_email = '' OR profile.contact_email = 'contacto@pf.local'
          THEN EXCLUDED.contact_email
          ELSE profile.contact_email
        END,
        cv_url = CASE
          WHEN profile.cv_url IS NULL OR profile.cv_url = ''
          THEN EXCLUDED.cv_url
          ELSE profile.cv_url
        END,
        stack = CASE WHEN jsonb_array_length(profile.stack) = 0 THEN EXCLUDED.stack ELSE profile.stack END,
        skills = CASE WHEN jsonb_array_length(profile.skills) = 0 THEN EXCLUDED.skills ELSE profile.skills END,
        experience = CASE WHEN jsonb_array_length(profile.experience) = 0 THEN EXCLUDED.experience ELSE profile.experience END,
        education = CASE WHEN jsonb_array_length(profile.education) = 0 THEN EXCLUDED.education ELSE profile.education END,
        social_links = CASE WHEN profile.social_links = '{}'::jsonb THEN EXCLUDED.social_links ELSE profile.social_links END;
    `,
      [
        fullBio,
        JSON.stringify(INITIAL_SOCIAL_LINKS),
        JSON.stringify(INITIAL_STACK),
        JSON.stringify(INITIAL_EXPERIENCE),
        JSON.stringify(INITIAL_EDUCATION),
      ]
    );
    console.log('✅ Registro de perfil inicializado/sincronizado.');

    const { rows: serviceCountRows } = await client.query('SELECT COUNT(*)::int AS count FROM services');
    if (serviceCountRows[0].count === 0) {
      for (const srv of INITIAL_SERVICES) {
        await client.query(
          `INSERT INTO services (title, description, icon, items, sort_order, active)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
          [srv.title, srv.description, srv.icon, JSON.stringify(srv.items), srv.sort_order, srv.active]
        );
      }
      console.log('✅ Servicios iniciales creados.');
    }

    const { rows: projectCountRows } = await client.query('SELECT COUNT(*)::int AS count FROM projects');
    if (projectCountRows[0].count === 0) {
      for (const proj of INITIAL_PROJECTS) {
        const { rows: insertedProj } = await client.query(
          `INSERT INTO projects (
            title, slug, summary, description, problem, solution, tech_decisions,
            technologies, repo_url, live_url, featured, published, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id`,
          [
            proj.title,
            proj.slug,
            proj.summary,
            proj.description,
            proj.problem,
            proj.solution,
            proj.tech_decisions,
            proj.technologies,
            proj.repo_url,
            proj.live_url,
            proj.featured,
            proj.published,
            proj.sort_order,
          ]
        );

        if (proj.sort_order === 1 && insertedProj[0]?.id) {
          await client.query(
            `INSERT INTO demos (project_id, title, description, type, url, urls, sort_order)
             VALUES ($1, $2, $3, 'iframe', $4, '[]'::jsonb, 1)`,
            [
              insertedProj[0].id,
              'Vista interactiva de Tienda en línea',
              'Demostración interactiva embebida en iframe con catálogo y carrito.',
              'https://example.com',
            ]
          );
        }
      }
      console.log('✅ Proyectos y demos iniciales creados.');
    }

    console.log('🎉 Seed completado exitosamente.');
  } finally {
    client.release();
    await closePool();
  }
}

runSeed().catch((err) => {
  console.error('❌ Error al ejecutar el seed:', err);
  process.exit(1);
});
