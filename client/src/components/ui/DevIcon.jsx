/* eslint-disable react-refresh/only-export-components */
/**
 * DevIcon - Renderizador de iconos de tecnologías mediante Devicon.
 * Mapea identificadores de tecnologías a las clases font correspondientes
 * y adapta la coloración para un contraste impecable sobre superficies cósmicas.
 */

export const CURATED_TECH_ICONS = [
  { key: 'react', label: 'React', category: 'frontend' },
  { key: 'vite', label: 'Vite', category: 'frontend' },
  { key: 'tailwind', label: 'Tailwind CSS', category: 'frontend' },
  { key: 'javascript', label: 'JavaScript', category: 'frontend' },
  { key: 'typescript', label: 'TypeScript', category: 'frontend' },
  { key: 'nextjs', label: 'Next.js', category: 'frontend' },
  { key: 'html5', label: 'HTML5', category: 'frontend' },
  { key: 'css3', label: 'CSS3', category: 'frontend' },
  { key: 'sass', label: 'Sass', category: 'frontend' },
  { key: 'vue', label: 'Vue.js', category: 'frontend' },
  { key: 'angular', label: 'Angular', category: 'frontend' },
  { key: 'redux', label: 'Redux', category: 'frontend' },
  { key: 'bootstrap', label: 'Bootstrap', category: 'frontend' },
  { key: 'nodejs', label: 'Node.js', category: 'backend' },
  { key: 'express', label: 'Express', category: 'backend' },
  { key: 'python', label: 'Python', category: 'backend' },
  { key: 'graphql', label: 'GraphQL', category: 'backend' },
  { key: 'postgresql', label: 'PostgreSQL', category: 'database' },
  { key: 'prisma', label: 'Prisma', category: 'database' },
  { key: 'mongodb', label: 'MongoDB', category: 'database' },
  { key: 'mysql', label: 'MySQL', category: 'database' },
  { key: 'git', label: 'Git', category: 'tools' },
  { key: 'github', label: 'GitHub', category: 'tools' },
  { key: 'docker', label: 'Docker', category: 'tools' },
  { key: 'figma', label: 'Figma', category: 'tools' },
  { key: 'vercel', label: 'Vercel', category: 'tools' },
];

const DEVICON_CONFIG = {
  react: { icon: 'devicon-react-original', colored: true },
  vite: { icon: 'devicon-vite-original', colored: true },
  vitejs: { icon: 'devicon-vitejs-plain', colored: true },
  tailwind: { icon: 'devicon-tailwindcss-original', colored: true },
  tailwindcss: { icon: 'devicon-tailwindcss-original', colored: true },
  javascript: { icon: 'devicon-javascript-plain', colored: true },
  js: { icon: 'devicon-javascript-plain', colored: true },
  typescript: { icon: 'devicon-typescript-plain', colored: true },
  ts: { icon: 'devicon-typescript-plain', colored: true },
  nodejs: { icon: 'devicon-nodejs-plain', colored: true },
  node: { icon: 'devicon-nodejs-plain', colored: true },
  express: { icon: 'devicon-express-original', colored: false },
  expressjs: { icon: 'devicon-express-original', colored: false },
  postgresql: { icon: 'devicon-postgresql-plain', colored: true },
  postgres: { icon: 'devicon-postgresql-plain', colored: true },
  prisma: { icon: 'devicon-prisma-original', colored: false },
  git: { icon: 'devicon-git-plain', colored: true },
  github: { icon: 'devicon-github-original', colored: false },
  figma: { icon: 'devicon-figma-plain', colored: true },
  vercel: { icon: 'devicon-vercel-original', colored: false },
  html: { icon: 'devicon-html5-plain', colored: true },
  html5: { icon: 'devicon-html5-plain', colored: true },
  css: { icon: 'devicon-css3-plain', colored: true },
  css3: { icon: 'devicon-css3-plain', colored: true },
  python: { icon: 'devicon-python-plain', colored: true },
  mongodb: { icon: 'devicon-mongodb-plain', colored: true },
  mysql: { icon: 'devicon-mysql-plain', colored: true },
  docker: { icon: 'devicon-docker-plain', colored: true },
  nextjs: { icon: 'devicon-nextjs-original', colored: false },
  next: { icon: 'devicon-nextjs-original', colored: false },
  vue: { icon: 'devicon-vuejs-plain', colored: true },
  vuejs: { icon: 'devicon-vuejs-plain', colored: true },
  angular: { icon: 'devicon-angularjs-plain', colored: true },
  sass: { icon: 'devicon-sass-original', colored: true },
  redux: { icon: 'devicon-redux-original', colored: true },
  graphql: { icon: 'devicon-graphql-plain', colored: true },
  bootstrap: { icon: 'devicon-bootstrap-plain', colored: true },
};

function normalizeKey(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\.js$/, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export default function DevIcon({
  name,
  size = 20,
  colored = true,
  className = '',
  style = {},
}) {
  const normalized = normalizeKey(name);
  const config =
    DEVICON_CONFIG[normalized] ||
    DEVICON_CONFIG[normalized.replace(/js$/, '')] ||
    null;

  const iconClass = config
    ? config.icon
    : `devicon-${normalized}-plain`;

  const useColored = config ? (colored && config.colored) : colored;

  return (
    <i
      aria-hidden="true"
      className={`${iconClass} ${useColored ? 'colored' : ''} inline-flex items-center justify-center leading-none ${className}`}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        lineHeight: 1,
        ...style,
      }}
    />
  );
}
