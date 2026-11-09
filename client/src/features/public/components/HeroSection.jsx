import { useState, useEffect, useMemo } from 'react';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import Button from '../../../components/ui/Button.jsx';

const DEFAULT_PREFIX = 'Desarrollo software';
const DEFAULT_WORDS = [
  'robusto',
  'eficiente',
  'escalable',
  'intuitivo',
  'seguro',
  'mantenible',
];

/**
 * Sección Inicio (Hero) según el prototipo Portfolio_animado_v4.html:
 * - Izquierda: saludo, nombre grande, rol en acento, texto máquina de escribir (que
 *   respeta prefers-reduced-motion y se pausa si la pestaña está oculta), botones y enlaces.
 * - Derecha: foto de perfil en orbe (.orb con .orb-disk, .orb-disk.d2, .orb-hole y .av).
 */
export default function HeroSection({ profile }) {
  const rawPrefix =
    profile?.typewriterPrefix ??
    profile?.shortDescriptionPrefix ??
    DEFAULT_PREFIX;

  const cleanPrefix = rawPrefix.trimEnd();

  const rawWords =
    Array.isArray(profile?.typewriterWords) && profile.typewriterWords.length > 0
      ? profile.typewriterWords
      : Array.isArray(profile?.shortDescriptionWords) && profile.shortDescriptionWords.length > 0
        ? profile.shortDescriptionWords
        : DEFAULT_WORDS;

  const wordsKey = rawWords.filter(Boolean).join('|') || DEFAULT_WORDS.join('|');
  const words = useMemo(() => wordsKey.split('|'), [wordsKey]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const [typedPrefix, setTypedPrefix] = useState(() =>
    prefersReducedMotion ? cleanPrefix : ''
  );
  const [typedWord, setTypedWord] = useState(() =>
    prefersReducedMotion ? (words[0] || '') : ''
  );

  useEffect(() => {
    if (prefersReducedMotion) return;

    let timerId = null;
    let isCancelled = false;

    let prefixIndex = 0;
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const TYPE_PREFIX_SPEED = 35;
    const TYPE_WORD_SPEED = 65;
    const DELETE_SPEED = 40;
    const PAUSE_BEFORE_DELETE = 1800;
    const PAUSE_BEFORE_NEXT_WORD = 350;

    function scheduleNext(delay) {
      if (isCancelled) return;
      if (timerId) clearTimeout(timerId);
      // Si la pestaña está oculta, no avanzamos el temporizador hasta que vuelva a ser visible
      if (typeof document !== 'undefined' && document.hidden) return;
      timerId = setTimeout(step, delay);
    }

    function step() {
      if (isCancelled) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      // Fase 1: Escribir el prefijo base ("Construyo aplicaciones web")
      if (prefixIndex < cleanPrefix.length) {
        if (prefixIndex === 0) {
          setTypedWord('');
        }
        prefixIndex += 1;
        setTypedPrefix(cleanPrefix.slice(0, prefixIndex));
        scheduleNext(TYPE_PREFIX_SPEED);
        return;
      }

      // Fase 2: Ciclo de escritura y borrado de las palabras dinámicas
      const currentFullWord = words[wordIndex] || '';

      if (!isDeleting) {
        if (charIndex < currentFullWord.length) {
          charIndex += 1;
          setTypedWord(currentFullWord.slice(0, charIndex));
          scheduleNext(TYPE_WORD_SPEED);
        } else if (words.length > 1) {
          isDeleting = true;
          scheduleNext(PAUSE_BEFORE_DELETE);
        }
      } else {
        if (charIndex > 0) {
          charIndex -= 1;
          setTypedWord(currentFullWord.slice(0, charIndex));
          scheduleNext(DELETE_SPEED);
        } else {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          scheduleNext(PAUSE_BEFORE_NEXT_WORD);
        }
      }
    }

    const handleVisibilityChange = () => {
      if (isCancelled) return;
      if (document.hidden) {
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
      } else {
        scheduleNext(120);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleNext(250);

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cleanPrefix, words, wordsKey, prefersReducedMotion]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="inicio"
      className="relative z-10 flex min-h-[100svh] w-full items-center pt-[110px] pb-[48px] overflow-x-clip"
    >
      <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 items-center gap-[38px] px-[20px] md:grid-cols-[1.1fr_0.9fr]">
        {/* Columna izquierda */}
        <div className="flex flex-col items-start">
          {/* 1. Saludo */}
          <p className="font-sans-ui text-[19px] text-[var(--mut)]">
            {profile.greeting}
          </p>

          {/* 2. Nombre grande en Bricolage Grotesque */}
          <h1 className="font-heading text-[clamp(34px,8.5vw,80px)] break-words font-bold leading-[1.06] tracking-[-0.02em] text-[var(--tx)]">
            {profile.fullName}
          </h1>

          {/* 3. Rol en color de acento */}
          <p className="role my-[10px] min-h-[1.4em] font-heading text-[clamp(22px,3.8vw,30px)] font-medium text-[var(--ac)]">
            {profile.role}
          </p>

          {/* 4. Descripción breve con efecto máquina de escribir */}
          <p
            aria-label={`${cleanPrefix} ${words.join(', ')}.`}
            className="font-sans-ui min-h-[32px] max-w-[540px] text-[17px] leading-[1.6] text-[var(--mut)]"
          >
            <span aria-hidden="true">
              <span>{typedPrefix}</span>
              {typedPrefix.length >= cleanPrefix.length && <span>&nbsp;</span>}
              <b className="font-medium text-[var(--ac)]">{typedWord}</b>
            </span>
            <span aria-hidden="true" className="typing-cursor" />
          </p>

          {/* 5. Botones principales */}
          <div className="my-[26px] mb-[18px] flex flex-wrap items-center gap-[12px]">
            <Button variant="primary" onClick={() => scrollTo('proyectos')}>
              <span>{profile.primaryCtaLabel}</span>
              <IconSlot size={16} name="hero-arrow-right" />
            </Button>

            <Button variant="secondary" onClick={() => scrollTo('contacto')}>
              <span>{profile.secondaryCtaLabel}</span>
            </Button>
          </div>

          {/* 6. Enlaces de redes y descarga de CV */}
          <div className="flex flex-wrap items-center gap-[18px] text-[var(--mut)]">
            {profile.socialLinks?.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                className="inline-flex items-center gap-[6px] font-mono-ui text-[12px] text-[var(--mut)] transition-all duration-200 hover:-translate-y-[3px] hover:text-[var(--ac2)]"
              >
                <IconSlot
                  size={20}
                  name={`hero-${social.id}`}
                  iconUrl={social.iconUrl}
                />
              </a>
            ))}

            <a
              href={profile.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[6px] font-mono-ui text-[12px] text-[var(--mut)] no-underline transition-all duration-200 hover:-translate-y-[3px] hover:text-[var(--ac2)]"
            >
              <IconSlot size={14} name="download-cv" />
              <span>{profile.cvLabel}</span>
            </a>
          </div>
        </div>

        {/* Columna derecha: Foto de perfil (.orb con .av) */}
        <div className="flex flex-col items-center justify-center">
          <div className="orb">
            <div className="orb-disk" aria-hidden="true" />
            <div className="orb-disk d2" aria-hidden="true" />
            <div className="orb-hole" aria-hidden="true" />
            <div className="av">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.fullName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-[8px] px-3 text-[var(--mut)]">
                  <IconSlot size={56} name="profile-photo-placeholder" />
                  <span className="font-mono-ui text-[10px] text-[var(--mut)]">
                    {profile.photoPlaceholderLabel || 'Foto del profesional'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de scroll (.scr) */}
      <div
        aria-hidden="true"
        className="scr pointer-events-none absolute bottom-[20px] left-1/2 -translate-x-1/2"
      />
    </section>
  );
}
