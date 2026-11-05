import { AlertCircle, FolderOpen, Plus, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

/**
 * DataState - Implementa los 4 estados visuales obligatorios (Sección 4.3):
 * 1. 'cargando': Esqueletos (skeletons) con proporciones de tabla, formulario o tarjetas.
 * 2. 'error': Alerta descriptiva con botón «Reintentar consulta» y token semántico --bad.
 * 3. 'sin_datos': Estado vacío ilustrado (.adm-empty) con acción directa.
 * 4. 'con_datos': Renderizado normal (children).
 */
export default function DataState({
  status = 'con_datos', // 'cargando' | 'error' | 'sin_datos' | 'con_datos'
  skeletonType = 'table', // 'table' | 'form' | 'cards'
  skeletonRows = 5,
  errorMessage = 'No se pudieron cargar los datos.',
  onRetry,
  emptyTitle = 'Aún no hay registros cargados',
  emptyDescription = 'Creá el primer elemento para comenzar a poblar esta sección.',
  emptyActionLabel,
  onEmptyAction,
  children,
}) {
  if (status === 'cargando') {
    if (skeletonType === 'cards') {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="card h-[118px] animate-pulse p-5"
            >
              <div className="h-3 w-24 rounded bg-[var(--bg2)]" />
              <div className="mt-4 h-7 w-16 rounded bg-[var(--bg2)]" />
              <div className="mt-3 h-2.5 w-32 rounded bg-[var(--bg2)]" />
            </div>
          ))}
        </div>
      );
    }

    if (skeletonType === 'form') {
      return (
        <div
          aria-busy="true"
          className="card flex flex-col gap-5 p-6"
        >
          <div className="h-5 w-48 animate-pulse rounded bg-[var(--bg2)]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-12 animate-pulse rounded-[12px] bg-[var(--bg2)]" />
            <div className="h-12 animate-pulse rounded-[12px] bg-[var(--bg2)]" />
          </div>
          <div className="h-28 animate-pulse rounded-[12px] bg-[var(--bg2)]" />
          <div className="h-28 animate-pulse rounded-[12px] bg-[var(--bg2)]" />
        </div>
      );
    }

    return (
      <div
        aria-busy="true"
        className="card overflow-hidden"
      >
        <div className="border-b border-[var(--bd)] bg-[var(--bg2)] px-5 py-3.5">
          <div className="h-3.5 w-44 animate-pulse rounded bg-[var(--bd)]" />
        </div>
        <div className="divide-y divide-[var(--bd)]">
          {Array.from({ length: skeletonRows }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-[10px] bg-[var(--bg2)]" />
                <div className="flex flex-col gap-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-[var(--bg2)]" />
                  <div className="h-2.5 w-24 animate-pulse rounded bg-[var(--bg2)]" />
                </div>
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--bg2)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        className="card flex flex-col items-center justify-center gap-4 p-8 text-center"
        style={{ borderColor: 'color-mix(in srgb, var(--bad) 40%, transparent)' }}
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bad) 15%, transparent)',
            color: 'var(--bad)',
          }}
        >
          <AlertCircle size={24} />
        </span>
        <div className="max-w-md">
          <h3 className="font-heading text-[18px] font-bold text-[var(--tx)]">
            Ocurrió un problema al consultar los datos
          </h3>
          <p className="font-sans-ui mt-1 text-[14px] text-[var(--mut)]">
            {errorMessage}
          </p>
        </div>
        {onRetry && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRetry}
          >
            <RefreshCw size={16} />
            <span>Reintentar consulta</span>
          </Button>
        )}
      </div>
    );
  }

  if (status === 'sin_datos') {
    return (
      <div className="adm-empty card flex flex-col items-center justify-center gap-4 border-dashed px-6 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-[var(--bd)] bg-[var(--bg2)] text-[var(--ac2)]">
          <FolderOpen size={26} />
        </span>
        <div className="max-w-md">
          <h3 className="font-heading text-[18px] font-bold text-[var(--tx)]">
            {emptyTitle}
          </h3>
          <p className="font-sans-ui mt-1 text-[14px] text-[var(--mut)]">
            {emptyDescription}
          </p>
        </div>
        {emptyActionLabel && onEmptyAction && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onEmptyAction}
          >
            <Plus size={16} />
            <span>{emptyActionLabel}</span>
          </Button>
        )}
      </div>
    );
  }

  return children;
}
