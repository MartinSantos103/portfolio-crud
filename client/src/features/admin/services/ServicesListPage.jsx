import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUp, ArrowDown, Edit3, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import Badge from '../../../components/ui/Badge.jsx';
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

  // Toggle optimista Visible / Oculto con reversión en caso de error
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
          ? `Servicio «${service.title}» ahora es visible`
          : `Servicio «${service.title}» ahora está oculto`
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
    <div id="v-servicios" className="adm-view is-on flex flex-col gap-5">
      {/* Cabecera estelar */}
      <div className="adm-pagehead">
        <div className="adm-pagehead-left">
          <span className="adm-planet-orb" aria-hidden="true" />
          <div>
            <h1 className="adm-h1">Gestión de Servicios</h1>
            <p className="adm-sub">
              Administrá la oferta de servicios profesionales y el orden en que
              aparecen en la página principal.
            </p>
          </div>
        </div>

        <div className="adm-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/servicios/nuevo')}
            className="adm-btn primary"
          >
            <Plus size={16} />
            <span>Nuevo servicio</span>
          </button>
        </div>
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
        <section className="adm-card flush">
          <div className="overflow-x-auto">
            <table className="adm-table flush">
              <thead>
                <tr>
                  <th className="w-[100px]">Orden</th>
                  <th>Servicio</th>
                  <th className="w-[200px]">Estado</th>
                  <th className="r w-[170px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={service.id}>
                    <td>
                      <div className="adm-order">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleReorder(service.id, 'up')}
                          aria-label={`Subir ${service.title}`}
                          className="adm-iconbtn"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={index === services.length - 1}
                          onClick={() => handleReorder(service.id, 'down')}
                          aria-label={`Bajar ${service.title}`}
                          className="adm-iconbtn"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="adm-cell">
                        <span className="adm-thumb">
                          <IconSlot
                            size={18}
                            name={`service-${service.icon || 'sitios-landing'}`}
                          />
                        </span>
                        <div className="min-w-0">
                          <b className="font-heading text-[15px] font-bold text-[var(--adm-texto)]">
                            {service.title}
                          </b>
                          <small className="mt-0.5 line-clamp-1">
                            {service.description}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="adm-state">
                        <input
                          type="checkbox"
                          role="switch"
                          aria-checked={service.active}
                          checked={Boolean(service.active)}
                          onChange={() => handleOptimisticToggleActive(service)}
                          className="adm-switch"
                        />
                        <Badge
                          variant="status"
                          status={service.active ? 'visible' : 'oculto'}
                        />
                      </div>
                    </td>

                    <td className="r">
                      <div className="adm-row-actions">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/servicios/${service.id}/editar`)
                          }
                          className="adm-btn secondary sm"
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(service)}
                          aria-label={`Eliminar ${service.title}`}
                          className="adm-iconbtn danger"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
