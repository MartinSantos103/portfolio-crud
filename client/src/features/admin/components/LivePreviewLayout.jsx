import { useState } from 'react';
import { Eye, FileEdit, User, UserCheck } from 'lucide-react';

/**
 * LivePreviewLayout - Arquitectura de Vista Previa en Vivo (Sección 4.2):
 * - En pantallas >= 1280px (xl:): Pantalla dividida (Split-Screen), 55% formulario a la izquierda
 *   y 45% lienzo de vista previa fijo (sticky) a la derecha.
 * - En pantallas < 1280px: Barra superior de 2 pestañas: [ Editar formulario ] y [ Vista previa ]
 *   al 100% del ancho disponible.
 * - Sin conmutador falso de dispositivo.
 * - Con Selector de Rol de Visualización opcional:
 *   [ Como Visitante (Tarjeta) ] vs. [ Como Usuario Registrado (Detalle) ].
 */
export default function LivePreviewLayout({
  formContent,
  previewContent,
  previewTitle = 'Vista previa en vivo',
  showRoleSelector = false,
  previewRole = 'visitor', // 'visitor' | 'registered'
  onPreviewRoleChange,
}) {
  const [mobileTab, setMobileTab] = useState('form'); // 'form' | 'preview'

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Barra de 2 pestañas para pantallas < 1280px */}
      <div
        role="tablist"
        aria-label="Modo de edición y vista previa"
        className="grid grid-cols-2 gap-2 rounded-[14px] border border-[var(--borde)] bg-[var(--superficie)] p-1.5 xl:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'form'}
          onClick={() => setMobileTab('form')}
          className={`font-sans-ui flex cursor-pointer items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-colors ${
            mobileTab === 'form'
              ? 'bg-[var(--acento)] text-[var(--sobre-acento)]'
              : 'text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]'
          }`}
        >
          <FileEdit size={16} />
          <span>Editar formulario</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'preview'}
          onClick={() => setMobileTab('preview')}
          className={`font-sans-ui flex cursor-pointer items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-colors ${
            mobileTab === 'preview'
              ? 'bg-[var(--acento)] text-[var(--sobre-acento)]'
              : 'text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]'
          }`}
        >
          <Eye size={16} />
          <span>Vista previa</span>
        </button>
      </div>

      {/* Contenedor Split-Screen en >= 1280px (xl:) */}
      <div className="flex flex-col items-start gap-6 xl:flex-row">
        {/* Columna Izquierda (55% en xl:): Formulario */}
        <div
          className={`w-full xl:w-[55%] xl:shrink-0 ${
            mobileTab === 'form' ? 'block' : 'hidden xl:block'
          }`}
        >
          {formContent}
        </div>

        {/* Columna Derecha (45% en xl:): Lienzo de Vista Previa Sticky */}
        <div
          className={`w-full xl:sticky xl:top-[84px] xl:w-[45%] xl:shrink-0 ${
            mobileTab === 'preview' ? 'block' : 'hidden xl:block'
          }`}
        >
          <div className="overflow-hidden rounded-[18px] border border-[var(--borde)] bg-[var(--superficie)] shadow-lg">
            {/* Cabecera del Lienzo de Vista Previa */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--superficie-alta)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                <span className="font-mono-ui text-[11px] font-semibold uppercase tracking-[1.2px] text-[var(--texto)]">
                  {previewTitle}
                </span>
              </div>

              {/* Selector de Rol de Visualización (exclusivo para Proyectos y Demos) */}
              {showRoleSelector && (
                <div
                  role="group"
                  aria-label="Selector de rol de visualización"
                  className="inline-flex rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)] p-1"
                >
                  <button
                    type="button"
                    onClick={() => onPreviewRoleChange?.('visitor')}
                    className={`font-sans-ui inline-flex cursor-pointer items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      previewRole === 'visitor'
                        ? 'bg-[var(--acento)] text-[var(--sobre-acento)]'
                        : 'text-[var(--texto-suave)] hover:text-[var(--texto)]'
                    }`}
                  >
                    <User size={12} />
                    <span>Como Visitante (Tarjeta)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPreviewRoleChange?.('registered')}
                    className={`font-sans-ui inline-flex cursor-pointer items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      previewRole === 'registered'
                        ? 'bg-[var(--acento)] text-[var(--sobre-acento)]'
                        : 'text-[var(--texto-suave)] hover:text-[var(--texto)]'
                    }`}
                  >
                    <UserCheck size={12} />
                    <span>Como Usuario Registrado (Detalle)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cuerpo del Lienzo de Previsualización */}
            <div className="max-h-[calc(100vh-165px)] overflow-y-auto bg-[var(--fondo)] p-4 sm:p-5">
              {previewContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
