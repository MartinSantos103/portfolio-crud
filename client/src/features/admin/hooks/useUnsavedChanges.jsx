/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';
import { useAdminFormContext } from '../context/AdminFormContext.jsx';

/**
 * useUnsavedChanges - Protección real contra pérdida de cambios:
 * 1. Sincroniza formState.isDirty con el indicador del Topbar en AdminLayout.
 * 2. Bloquea la navegación interna mediante useBlocker de React Router.
 * 3. Proporciona bypassBlocker() para deshabilitar el guardafrenos en navegaciones intencionales post-guardado.
 * 4. Registra el evento beforeunload en window para proteger ante recarga o cierre de pestaña.
 */
export function useUnsavedChanges(isDirty) {
  const { setFormDirtyState } = useAdminFormContext();
  const dirtyBoolean = Boolean(isDirty);
  const bypassRef = useRef(false);

  const bypassBlocker = useCallback(() => {
    bypassRef.current = true;
    setFormDirtyState(false, false);
  }, [setFormDirtyState]);

  useEffect(() => {
    if (dirtyBoolean && !bypassRef.current) {
      setFormDirtyState(true, true);
    } else {
      setFormDirtyState(false, false);
    }
    return () => {
      setFormDirtyState(false, false);
    };
  }, [dirtyBoolean, setFormDirtyState]);

  useEffect(() => {
    if (!dirtyBoolean || bypassRef.current) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyBoolean]);

  const blocker = useBlocker(
    useCallback(() => dirtyBoolean && !bypassRef.current, [dirtyBoolean])
  );

  return { blocker, bypassBlocker };
}

export function UnsavedChangesModal({ blocker }) {
  if (!blocker || blocker.state !== 'blocked') return null;

  return (
    <ConfirmModal
      isOpen={true}
      title="Tienes cambios sin guardar"
      description="Tienes cambios sin guardar en este formulario. ¿Deseas salir y descartarlos?"
      confirmLabel="Salir y descartar"
      cancelLabel="Seguir editando"
      tone="danger"
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    />
  );
}
