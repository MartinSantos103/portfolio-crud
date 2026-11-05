import IconSlot from '../ui/IconSlot.jsx';

/**
 * Pie de página según Portfolio_animado_v4.html:
 * - Borde superior en --bd
 * - Texto en JetBrains Mono 12px, color --mut
 * - Íconos de redes a la derecha
 */
export default function Footer({
  copyright = '© 2026 Lucas Andrade. Hecho con dedicación.',
  socialLinks = [],
}) {
  return (
    <footer className="relative z-10 mt-[50px] w-full border-t border-[var(--bd)]">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center justify-between gap-[16px] px-[20px] py-[28px] sm:flex-row">
        <p className="font-mono-ui text-center text-[12px] font-normal text-[var(--mut)] sm:text-left">
          {copyright}
        </p>

        <div className="flex items-center gap-[14px]">
          {socialLinks.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              aria-label={social.name}
              className="inline-flex text-[var(--mut)] transition-colors duration-150 hover:text-[var(--ac2)]"
            >
              <IconSlot
                size={18}
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
