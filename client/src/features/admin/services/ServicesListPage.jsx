import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
} from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';

export default function ServicesListPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadServices = useCallback(async () => {
    setStatus('cargando');
    setErrorMsg('');
    try {
      const res = await apiFetch('/services?admin=true');
      const list = Array.isArray(res?.data) ? res.data : [];
      setServices(list);
      setStatus(list.length === 0 ? 'sin_datos' : 'con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudieron cargar los servicios.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadServices();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadServices]);

  const handleReorder = async (serviceId, direction) => {
    try {
      const res = await apiFetch('/services/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ serviceId, direction }),
      });
      if (Array.isArray(res?.data)) {
        setServices(res.data);
      } else {
        await loadServices();
      }
      toast.success('Orden de servicios actualizado');
    } catch (err) {
      toast.error(err.message || 'No se pudo reordenar el servicio');
    }
  };

  // Toggle optimista Activo / Inactivo con reversión en caso de error
  const handleOptimisticToggleActive = async (service) => {
    const nextActive = !service.active;
    const prevSnapshot = [...services];

    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, active: nextActive } : s))
    );

    try {
      await apiFetch(`/services/${service.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: nextActive }),
      });
      toast.success(
        nextActive
          ? `Servicio «${service.title}» activado`
          : `Servicio «${service.title}» desactivado`
      );
    } catch (err) {
      setServices(prevSnapshot);
      toast.error(err.message || 'No se pudo cambiar el estado del servicio');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/services/${deleteTarget.id}`, { method: 'DELETE' });
      const remaining = services.filter((s) => s.id !== deleteTarget.id);
      setServices(remaining);
      if (remaining.length === 0) setStatus('sin_datos');
      toast.success(`Servicio «${deleteTarget.title}» eliminado correctamente`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar el servicio');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-[26px] font-bold tracking-tight text-[var(--texto)]">
            Gestión de Servicios
          </h1>
          <p className="font-sans-ui mt-1 text-[14px] text-[var(--texto-suave)]">
            Administrá la oferta de servicios profesionales y el orden en que aparecen en la página principal.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/admin/servicios/nuevo')}
          className="!px-4 !py-2.5 !text-[14px]"
        >
          <Plus size={17} />
          <span>Nuevo servicio</span>
        </Button>
      </div>

      <DataState
        status={status}
        skeletonType="table"
        errorMessage={errorMsg}
        onRetry={loadServices}
        emptyTitle="Aún no hay servicios cargados"
        emptyDescription="Agregá tu primer servicio profesional para habilitar las solicitudes de cotización."
        emptyActionLabel="+ Crear el primero"
        onEmptyAction={() => navigate('/admin/servicios/nuevo')}
      >
        <div className="overflow-hidden rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--borde)] bg-[var(--superficie-alta)] text-[11px] font-semibold uppercase tracking-[1px] text-[var(--texto-suave)]">
                  <th className="font-mono-ui w-[92px] px-4 py-3.5">Orden</th>
                  <th className="font-mono-ui px-4 py-3.5">Servicio</th>
                  <th className="font-mono-ui w-[190px] px-4 py-3.5">Estado</th>
                  <th className="font-mono-ui w-[160px] px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--borde)]">
                {services.map((service, index) => (
                  <tr
                    key={service.id}
                    className="transition-colors hover:bg-[var(--superficie-alta)]/40"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleReorder(service.id, 'up')}
                          aria-label={`Subir ${service.title}`}
                          className="cursor-pointer rounded-md border border-[var(--borde)] bg-[var(--fondo)] p-1.5 text-[var(--texto-suave)] hover:border-[var(--acento)] hover:text-[var(--texto)] disabled:opacity-30"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={index === services.length - 1}
                          onClick={() => handleReorder(service.id, 'down')}
                          aria-label={`Bajar ${service.title}`}
                          className="cursor-pointer rounded-md border border-[var(--borde)] bg-[var(--fondo)] p-1.5 text-[var(--texto-suave)] hover:border-[var(--acento)] hover:text-[var(--texto)] disabled:opacity-30"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--tile-icono-bg)] text-[var(--acento-texto)]">
                          <IconSlot
                            size={22}
                            name={`service-${service.icon || 'sitios-landing'}`}
                          />
                        </span>
                        <div>
                          <p className="font-heading text-[15px] font-bold text-[var(--texto)]">
                            {service.title}
                          </p>
                          <p className="font-sans-ui mt-0.5 line-clamp-1 text-[12px] text-[var(--texto-suave)]">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={service.active}
                          onClick={() => handleOptimisticToggleActive(service)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                            service.active ? 'bg-emerald-500' : 'bg-[var(--borde)]'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              service.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <Badge
                          variant="status"
                          status={service.active ? 'activo' : 'inactivo'}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/servicios/${service.id}/editar`)}
                          className="font-sans-ui inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border border-[var(--borde)] bg-[var(--fondo)] px-3 py-1.5 text-[12px] font-semibold text-[var(--texto)] hover:border-[var(--acento)]"
                        >
                          <Edit3 size={13} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(service)}
                          aria-label={`Eliminar ${service.title}`}
                          className="cursor-pointer rounded-[9px] border border-[var(--borde)] bg-[var(--fondo)] p-1.5 text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DataState>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar servicio"
        description={`¿Confirmas eliminar el servicio «${deleteTarget?.title}»?`}
        confirmLabel="Eliminar servicio"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
