/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, Play, Image as ImageIcon, Monitor } from 'lucide-react';

/**
 * Convierte enlaces estándar de YouTube o Loom a su URL de inserción (embed).
 */
export function toVideoEmbedUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const url = rawUrl.trim();

  // YouTube: https://www.youtube.com/watch?v=XXXX o https://youtu.be/XXXX
  const ytMatch =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/.exec(
      url
    );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Loom: https://www.loom.com/share/XXXX
  const loomMatch = /loom\.com\/(?:share|embed)\/([a-f0-9]{16,})/i.exec(url);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }

  return url;
}

/**
 * DemoViewer - Renderizador presentacional de demostraciones interactivas
 * Soporta tipos: 'iframe', 'video' e 'imagenes' (o 'images').
 */
export default function DemoViewer({ demo }) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!demo) return null;

  const normalizedType = demo.type === 'images' ? 'imagenes' : demo.type || 'iframe';
  const imageUrls =
    Array.isArray(demo.urls) && demo.urls.length > 0
      ? demo.urls
      : demo.url
        ? [demo.url]
        : [];

  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--borde)] bg-[var(--superficie)]">
      {/* Cabecera de la demo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--superficie-alta)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--borde)] bg-[var(--superficie)] text-[var(--acento-texto)]">
            {normalizedType === 'iframe' ? (
              <Monitor size={15} />
            ) : normalizedType === 'video' ? (
              <Play size={15} />
            ) : (
              <ImageIcon size={15} />
            )}
          </span>
          <div>
            <h4 className="font-heading text-[15px] font-bold text-[var(--texto)]">
              {demo.title || 'Demostración interactiva'}
            </h4>
            {demo.description && (
              <p className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
                {demo.description}
              </p>
            )}
          </div>
        </div>

        {(normalizedType === 'iframe' || normalizedType === 'video') && demo.url && (
          <a
            href={demo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-ui inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-1.5 text-[11px] font-medium text-[var(--texto)] transition-colors hover:border-[var(--acento)]"
          >
            <span>Abrir en pestaña nueva</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Cuerpo según el tipo */}
      {normalizedType === 'iframe' && (
        <div className="relative h-[420px] w-full bg-[var(--fondo)]">
          {demo.url ? (
            <iframe
              src={demo.url}
              title={demo.title || 'Demo interactiva'}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-[var(--texto-suave)]">
              Ingresá una URL de aplicación desplegada (Vercel / GitHub Pages) para visualizar el iframe.
            </div>
          )}
        </div>
      )}

      {normalizedType === 'video' && (
        <div className="relative aspect-video w-full bg-black">
          {demo.url ? (
            <iframe
              src={toVideoEmbedUrl(demo.url)}
              title={demo.title || 'Video demostrativo'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-[var(--texto-suave)]">
              Ingresá un enlace de YouTube o Loom para previsualizar el video.
            </div>
          )}
        </div>
      )}

      {normalizedType === 'imagenes' && (
        <div className="flex flex-col gap-3 bg-[var(--fondo)] p-4">
          {imageUrls.length > 0 ? (
            <>
              <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-[12px] border border-[var(--borde)] bg-[var(--superficie)]">
                <img
                  src={imageUrls[activeImageIdx] || imageUrls[0]}
                  alt={`${demo.title || 'Demo'} - imagen ${activeImageIdx + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
                {imageUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((prev) =>
                          prev === 0 ? imageUrls.length - 1 : prev - 1
                        )
                      }
                      aria-label="Imagen anterior"
                      className="absolute left-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--borde)] bg-[var(--superficie)]/90 text-[var(--texto)] hover:border-[var(--acento)]"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((prev) =>
                          prev === imageUrls.length - 1 ? 0 : prev + 1
                        )
                      }
                      aria-label="Imagen siguiente"
                      className="absolute right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--borde)] bg-[var(--superficie)]/90 text-[var(--texto)] hover:border-[var(--acento)]"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {imageUrls.length > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                  {imageUrls.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`h-12 w-20 shrink-0 cursor-pointer overflow-hidden rounded-[8px] border-2 transition-all ${
                        idx === activeImageIdx
                          ? 'border-[var(--acento)] opacity-100'
                          : 'border-transparent opacity-60 hover:opacity-90'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-[13px] text-[var(--texto-suave)]">
              Aún no se cargaron imágenes en esta galería interactiva.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
