import { useState, useEffect } from 'react';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import Button from '../../../components/ui/Button.jsx';

/**
 * Sección Inicio (Hero).
 * - Altura fija de 820 px en escritorio, padding 72 px arriba, 24 px abajo y 160 px a los lados.
 * - Fila con dos bloques separados a los extremos y centrados en vertical.
 * - Columna izquierda de 640 px con 22 px entre elementos:
 *   1. Saludo "Hola, soy" en Inter 500, 20 px, --texto-suave
 *   2. Nombre grande en Space Grotesk 700, 76 px, interlineado 80 px, -1.5 px
 *   3. Rol en Space Grotesk 500, 32 px, --acento
 *   4. Descripción breve con animación de escritura letra a letra y barra vertical en --acento
 *   5. Fila de dos botones con 16 px de separación: "Ver proyectos" (primario con flecha de 18 px) y "Contactar" (secundario)
 *   6. Fila de redes con 24 px de separación: GitHub (22 px), LinkedIn (22 px) y "Descargar CV" (JetBrains Mono 500, 13 px + icono descarga 16 px)
 * - Bloque derecho de 440 x 440 px:
 *   - Halo difuso de 380 px (--acento al 35 %, blur 60 px)
 *   - Anillo punteado de 440 px (--acento al 40 %, 1.5 px, trazo 6 px y hueco 10 px)
 *   - Disco de 360 px (--superficie-alta, borde --acento de 3 px) con icono de persona de 150 px y etiqueta
 */
export default function HeroSection({ profile }) {
  const fullText =
    profile.shortDescription ||
    'Construyo aplicaciones web rápidas, claras y pensadas para escalar.';

  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let index = 0;
    let intervalId = null;

    const timeoutId = setTimeout(() => {
      setTypedText('');
      intervalId = setInterval(() => {
        index += 1;
        setTypedText(fullText.slice(0, index));
        if (index >= fullText.length) {
          clearInterval(intervalId);
        }
      }, 40);
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fullText]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="inicio"
      className="relative z-10 w-full pt-[72px] pb-[24px] lg:h-[820px]"
    >
      <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col items-center justify-between gap-[48px] px-[24px] py-[40px] sm:px-[64px] lg:flex-row lg:gap-0 lg:py-0 xl:px-[160px]">
        {/* Columna izquierda: 640 px de ancho, 22 px entre elementos */}
        <div className="flex w-full max-w-[640px] flex-col items-start gap-[22px]">
          {/* 1. Saludo */}
          <p className="font-sans-ui text-[20px] font-medium leading-none text-[var(--texto-suave)]">
            {profile.greeting}
          </p>

          {/* 2. Nombre grande: Space Grotesk 700, 76 px, interlineado 80 px, -1.5 px */}
          <h1 className="font-heading text-[46px] font-bold leading-[1.08] tracking-[-1.5px] text-[var(--texto)] sm:text-[62px] lg:text-[76px] lg:leading-[80px]">
            {profile.fullName}
          </h1>

          {/* 3. Rol: Space Grotesk 500, 32 px, --acento */}
          <p className="font-heading text-[24px] font-medium leading-[1.2] text-[var(--acento)] sm:text-[32px]">
            {profile.role}
          </p>

          {/* 4. Descripción breve con efecto de escritura letra a letra y barra vertical en --acento */}
          <p className="font-sans-ui min-h-[56px] max-w-[540px] text-[18px] font-normal leading-[28px] text-[var(--texto-suave)]">
            <span>{typedText}</span>
            <span aria-hidden="true" className="typing-cursor" />
          </p>

          {/* 5. Fila de dos botones con 16 px de separación */}
          <div className="flex flex-wrap items-center gap-[16px]">
            <Button variant="primary" onClick={() => scrollTo('proyectos')}>
              <span>{profile.primaryCtaLabel}</span>
              <IconSlot size={18} name="hero-arrow-right" />
            </Button>

            <Button variant="secondary" onClick={() => scrollTo('contacto')}>
              <span>{profile.secondaryCtaLabel}</span>
            </Button>
          </div>

          {/* 6. Fila de redes con 24 px de separación */}
          <div className="flex items-center gap-[24px]">
            {profile.socialLinks?.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                className="inline-flex text-[var(--texto-suave)] transition-colors duration-150 hover:text-[var(--texto)]"
              >
                <IconSlot
                  size={22}
                  name={`hero-${social.id}`}
                  iconUrl={social.iconUrl}
                />
              </a>
            ))}

            <a
              href={profile.cvUrl}
              className="font-mono-ui inline-flex items-center gap-[8px] text-[13px] font-medium text-[var(--texto-suave)] transition-colors duration-150 hover:text-[var(--texto)]"
            >
              <IconSlot size={16} name="download-cv" />
              <span>{profile.cvLabel}</span>
            </a>
          </div>
        </div>

        {/* Bloque derecho: 440 x 440 px con la foto */}
        <div className="relative flex h-[320px] w-[320px] shrink-0 items-center justify-center sm:h-[440px] sm:w-[440px]">
          {/* 1. Halo difuso detrás de la foto: 380 px, --acento al 35 %, desenfoque 60 px */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-[280px] w-[280px] rounded-full bg-[var(--foto-halo-bg)] blur-[60px] sm:h-[380px] sm:w-[380px]"
          />

          {/* 2. Anillo punteado de 440 px: borde --acento al 40 %, 1.5 px, trazo 6 px y hueco 10 px */}
          <svg
            aria-hidden="true"
            viewBox="0 0 440 440"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <circle
              cx="220"
              cy="220"
              r="218.5"
              fill="none"
              stroke="var(--acento)"
              strokeOpacity="0.4"
              strokeWidth="1.5"
              strokeDasharray="6 10"
            />
          </svg>

          {/* 3. Disco de 360 px con relleno --superficie-alta y borde --acento de 3 px */}
          <div className="relative z-10 flex h-[260px] w-[260px] flex-col items-center justify-center overflow-hidden rounded-full border-[3px] border-[var(--acento)] bg-[var(--superficie-alta)] sm:h-[360px] sm:w-[360px]">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.fullName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-[16px] text-[var(--texto-suave)]">
                <IconSlot
                  size={150}
                  name="profile-photo-placeholder"
                  className="max-h-[110px] max-w-[110px] sm:max-h-[150px] sm:max-w-[150px]"
                />
                <span className="font-mono-ui text-[12px] font-normal text-[var(--texto-suave)]">
                  {profile.photoPlaceholderLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
