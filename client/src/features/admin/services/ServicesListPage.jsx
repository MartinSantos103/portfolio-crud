import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowUp, ArrowDown, Edit3, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';

const STATUS_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'publicados', label: 'Publicados' },
  { id: 'borradores', label: 'Borradores' },
];

export default function ServicesListPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
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

  const statusCounts = useMemo(() => {
    let publicados = 0;
    let borradores = 0;
    for (const s of services) {
      if (s.active) publicados++;
      else borradores++;
    }
    return {
      todos: services.length,
      publicados,
      borradores,
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (activeFilter === 'publicados' && !s.active) return false;
      if (activeFilter === 'borradores' && s.active) return false;
      if (q) {
        const title = String(s.title || '').toLowerCase();
        const desc = String(s.description || '').toLowerCase();
        if (!title.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [services, search, activeFilter]);

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
          ? `Servicio «${service.title}» publicado correctamente`
          : `Servicio «${service.title}» cambiado a borrador`
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

      {/* Barra de Búsqueda y Filtros de Estado */}
      <section className="adm-card adm-toolbar">
        <div className="relative flex-1 sm:max-w-[360px]">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--adm-texto-suave)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o descripción…"
            className="adm-input !pl-9"
          />
        </div>

        <div className="push">
          {[
            { id: 'todos', label: `Todos (${statusCounts.todos})` },
            { id: 'publicados', label: `Publicados (${statusCounts.publicados})` },
            { id: 'borradores', label: `Borradores (${statusCounts.borradores})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`adm-tab ${activeFilter === f.id ? 'is-active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <DataState
        status={status}
        skeletonType="table"
        errorMessage={errorMsg}
        onRetry={loadServices}
        emptyTitle="Aún no hay servicios cargados"
        emptyDescription="Agregá tu primer servicio profesional para habilitar las solicitudes de cotización."
        emptyActionLabel={
          search.trim() || activeFilter !== 'todos'
            ? 'Limpiar filtros'
            : '+ Crear el primero'
        }
        onEmptyAction={
          search.trim() || activeFilter !== 'todos'
            ? () => {
                setSearch('');
                setActiveFilter('todos');
              }
            : () => navigate('/admin/servicios/nuevo')
        }
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
                {filteredServices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="adm-empty">
                      No se encontraron servicios que coincidan con la búsqueda o filtro.
                    </td>
                  </tr>
                )}
                {filteredServices.map((service, index) => (
                  <tr key={service.id}>
                    <td>
                      <div className="adm-order">
                        <button
                          type="button"
                          disabled={
                            index === 0 ||
                            Boolean(search.trim()) ||
                            activeFilter !== 'todos'
                          }
                          onClick={() => handleReorder(service.id, 'up')}
                          aria-label={`Subir ${service.title}`}
                          title={
                            search.trim() || activeFilter !== 'todos'
                              ? 'El reordenamiento se desactiva al filtrar o buscar'
                              : undefined
                          }
                          className="adm-iconbtn"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={
                            index === filteredServices.length - 1 ||
                            Boolean(search.trim()) ||
                            activeFilter !== 'todos'
                          }
                          onClick={() => handleReorder(service.id, 'down')}
                          aria-label={`Bajar ${service.title}`}
                          title={
                            search.trim() || activeFilter !== 'todos'
                              ? 'El reordenamiento se desactiva al filtrar o buscar'
                              : undefined
                          }
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
                          status={service.active ? 'publicado' : 'borrador'}
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
