import IconSlot from '../ui/IconSlot.jsx';

/**
 * Pie de página.
 * - Fila de padding 32 px vertical y 160 px horizontal (en escritorio), con borde superior de 1 px en --borde
 * - Separada a los extremos
 * - Izquierda: texto de copyright en JetBrains Mono 400, 13 px, --texto-suave
 * - Derecha: dos espacios de icono de 20 px con 20 px de separación
 */
export default function Footer({
  copyright = '© 2026 Lucas Andrade. Hecho con dedicación.',
  socialLinks = [],
}) {
  return (
    <footer className="relative z-10 w-full border-t border-[var(--borde)]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-[16px] px-[24px] py-[32px] sm:flex-row sm:px-[64px] xl:px-[160px]">
        <p className="font-mono-ui text-center text-[13px] font-normal text-[var(--texto-suave)] sm:text-left">
          {copyright}
        </p>

        <div className="flex items-center gap-[20px]">
          {socialLinks.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              aria-label={social.name}
              className="inline-flex text-[var(--texto-suave)] transition-colors duration-150 hover:text-[var(--texto)]"
            >
              <IconSlot
                size={20}
                name={`footer-${social.id}`}
                iconUrl={social.iconUrl}
              />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
