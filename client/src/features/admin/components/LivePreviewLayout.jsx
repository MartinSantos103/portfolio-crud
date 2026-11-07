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
        className="adm-tabs xl:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'form'}
          onClick={() => setMobileTab('form')}
          className={`adm-tab flex-1 justify-center ${
            mobileTab === 'form' ? 'is-on' : ''
          }`}
        >
          <FileEdit size={15} />
          <span>Editar formulario</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'preview'}
          onClick={() => setMobileTab('preview')}
          className={`adm-tab flex-1 justify-center ${
            mobileTab === 'preview' ? 'is-on' : ''
          }`}
        >
          <Eye size={15} />
          <span>Vista previa</span>
        </button>
      </div>

      {/* Contenedor Split-Screen en >= 1280px (xl:) */}
      <div className="flex flex-col items-start gap-5 xl:flex-row">
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
          <div className="adm-card flush">
            {/* Cabecera del Lienzo de Vista Previa */}
            <div className="adm-preview-head">
              <div className="adm-preview-title">
                <span className="dot" aria-hidden="true" />
                <span>{previewTitle}</span>
              </div>

              {/* Selector de Rol de Visualización (exclusivo para Proyectos y Demos) */}
              {showRoleSelector && (
                <div
                  role="group"
                  aria-label="Selector de rol de visualización"
                  className="adm-seg"
                >
                  <button
                    type="button"
                    onClick={() => onPreviewRoleChange?.('visitor')}
                    className={`inline-flex items-center gap-1.5 ${
                      previewRole === 'visitor' ? 'is-on' : ''
                    }`}
                  >
                    <User size={12} />
                    <span>Como Visitante (Tarjeta)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPreviewRoleChange?.('registered')}
                    className={`inline-flex items-center gap-1.5 ${
                      previewRole === 'registered' ? 'is-on' : ''
                    }`}
                  >
                    <UserCheck size={12} />
                    <span>Como Usuario Registrado (Detalle)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cuerpo del Lienzo de Previsualización */}
            <div className="adm-preview-body max-h-[calc(100vh-165px)] overflow-y-auto">
              {previewContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
