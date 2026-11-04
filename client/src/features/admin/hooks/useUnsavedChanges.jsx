/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';
import { useAdminFormContext } from '../context/AdminFormContext.jsx';

/**
 * useUnsavedChanges - Protección real contra pérdida de cambios (Sección 2.2):
 * 1. Sincroniza formState.isDirty con el indicador del Topbar en AdminLayout.
 * 2. Bloquea la navegación interna mediante useBlocker(isDirty) de React Router.
 * 3. Registra el evento beforeunload en window para proteger ante recarga o cierre de pestaña.
 */
export function useUnsavedChanges(isDirty) {
  const { setFormDirtyState } = useAdminFormContext();
  const dirtyBoolean = Boolean(isDirty);

  useEffect(() => {
    setFormDirtyState(dirtyBoolean, true);
    return () => {
      setFormDirtyState(false, false);
    };
  }, [dirtyBoolean, setFormDirtyState]);

  useEffect(() => {
    if (!dirtyBoolean) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyBoolean]);

  const blocker = useBlocker(dirtyBoolean);

  return { blocker };
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
