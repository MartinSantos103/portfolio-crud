import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  Edit3,
  MoreVertical,
  PlaySquare,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';

const STATUS_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'publicados', label: 'Publicados' },
  { id: 'borradores', label: 'Borradores' },
];

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = useCallback(async () => {
    setStatus('cargando');
    setErrorMsg('');
    try {
      const res = await apiFetch('/projects?admin=true');
      const list = Array.isArray(res?.data) ? res.data : [];
      setProjects(list);
      setStatus(list.length === 0 ? 'sin_datos' : 'con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudieron cargar los proyectos.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProjects]);

  const statusCounts = useMemo(() => {
    let publicados = 0;
    let borradores = 0;
    for (const p of projects) {
      if (p.published) publicados++;
      else borradores++;
    }
    return {
      todos: projects.length,
      publicados,
      borradores,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (activeFilter === 'publicados' && !p.published) return false;
      if (activeFilter === 'borradores' && p.published) return false;
      if (q) {
        const hayTitle = String(p.title || '')
          .toLowerCase()
          .includes(q);
        const hayDesc = String(p.description || p.summary || '')
          .toLowerCase()
          .includes(q);
        if (!hayTitle && !hayDesc) return false;
      }
      return true;
    });
  }, [projects, search, activeFilter]);

  // Reordenamiento con PATCH /api/projects/reorder
  const handleReorder = async (projectId, direction) => {
    try {
      const res = await apiFetch('/projects/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ projectId, direction }),
      });
      if (Array.isArray(res?.data)) {
        setProjects(res.data);
      } else {
        await loadProjects();
      }
      toast.success('Orden de proyectos actualizado');
    } catch (err) {
      toast.error(err.message || 'No se pudo reordenar el proyecto');
    }
  };

  // Interruptor Publicado / Borrador con actualización optimista y reversión automática
  const handleOptimisticTogglePublished = async (project) => {
    const nextPublished = !project.published;
    const prevSnapshot = [...projects];

    setProjects((prev) =>
      prev.map((item) =>
        item.id === project.id ? { ...item, published: nextPublished } : item
      )
    );

    try {
      await apiFetch(`/projects/${project.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ published: nextPublished }),
      });
      toast.success(
        nextPublished
          ? `«${project.title}» ahora está publicado`
          : `«${project.title}» pasó a borrador`
      );
    } catch (err) {
      setProjects(prevSnapshot);
      toast.error(
        err.message ||
          'Error al actualizar estado. Se revirtió el cambio automáticamente.'
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/projects/${deleteTarget.id}`, { method: 'DELETE' });
      const remaining = projects.filter((p) => p.id !== deleteTarget.id);
      setProjects(remaining);
      if (remaining.length === 0) setStatus('sin_datos');
      toast.success(`Proyecto «${deleteTarget.title}» eliminado correctamente`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar el proyecto');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div id="v-proyectos" className="adm-view is-on flex flex-col gap-5">
      {/* Cabecera estelar */}
      <div className="adm-pagehead">
        <div className="adm-pagehead-left">
          <span className="adm-planet-orb" aria-hidden="true" />
          <div>
            <h1 className="adm-h1">Gestión de Proyectos</h1>
            <p className="adm-sub">
              Ordená, publicá o editá los proyectos del portfolio y sus
              demostraciones.
            </p>
          </div>
        </div>

        <div className="adm-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/proyectos/nuevo')}
            className="adm-btn primary"
          >
            <Plus size={16} />
            <span>Nuevo proyecto</span>
          </button>
        </div>
      </div>

      {/* Barra de filtros superiores */}
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

      {/* Tabla simplificada de alta legibilidad */}
      <DataState
        status={status}
        skeletonType="table"
        errorMessage={errorMsg}
        onRetry={loadProjects}
        emptyTitle="Aún no hay proyectos cargados"
        emptyDescription="Creá el primer proyecto para mostrar tu trabajo en el portfolio público."
        emptyActionLabel="+ Crear el primero"
        onEmptyAction={() => navigate('/admin/proyectos/nuevo')}
      >
        <section className="adm-card flush !overflow-visible">
          <div className="overflow-x-auto">
            <table className="adm-table flush">
              <thead>
                <tr>
                  <th className="w-[92px]">Orden</th>
                  <th>Proyecto</th>
                  <th className="w-[200px]">Estado</th>
                  <th className="r w-[170px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => (
                  <tr key={project.id}>
                    {/* 1. Orden */}
                    <td>
                      <div className="adm-order">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleReorder(project.id, 'up')}
                          aria-label={`Subir ${project.title}`}
                          className="adm-iconbtn"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={index === filteredProjects.length - 1}
                          onClick={() => handleReorder(project.id, 'down')}
                          aria-label={`Bajar ${project.title}`}
                          className="adm-iconbtn"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </td>

                    {/* 2. Proyecto */}
                    <td>
                      <div className="adm-cell">
                        <span className="adm-thumb">
                          {project.cover_image_url ? (
                            <img
                              src={project.cover_image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={16} />
                          )}
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <b className="font-heading text-[15px] font-bold text-[var(--adm-texto)]">
                              {project.title}
                            </b>
                          </div>
                          <small className="mt-0.5 line-clamp-1">
                            {project.description || project.summary}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* 3. Estado: único interruptor interactivo con actualización optimista */}
                    <td>
                      <div className="adm-state">
                        <input
                          type="checkbox"
                          role="switch"
                          aria-checked={project.published}
                          checked={Boolean(project.published)}
                          onChange={() =>
                            handleOptimisticTogglePublished(project)
                          }
                          className="adm-switch"
                        />
                        <Badge
                          variant="status"
                          status={project.published ? 'publicado' : 'borrador'}
                        />
                      </div>
                    </td>

                    {/* 4. Acciones: Editar directo + menú desplegable (⋮) */}
                    <td className="r">
                      <div className="adm-row-actions relative">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/proyectos/${project.id}/editar`)
                          }
                          className="adm-btn secondary sm"
                        >
                          <Edit3 size={13} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((prev) =>
                              prev === project.id ? null : project.id
                            )
                          }
                          aria-label="Más acciones"
                          className="adm-iconbtn"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {openMenuId === project.id && (
                          <div
                            role="menu"
                            className="adm-card absolute top-10 right-0 z-30 w-48 !p-1.5 text-left"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/admin/demos?project_id=${project.id}`);
                              }}
                              className="font-sans-ui flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-[12px] text-[var(--adm-texto)] hover:bg-[var(--adm-superficie-alta)]"
                            >
                              <PlaySquare
                                size={14}
                                className="text-[var(--ac2)]"
                              />
                              <span>Gestionar demos</span>
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleteTarget(project);
                              }}
                              className="font-sans-ui flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-[12px] text-[var(--bad)] hover:bg-[rgba(251,113,133,0.1)]"
                            >
                              <Trash2 size={14} />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        )}
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
        title="Eliminar proyecto"
        description={`¿Confirmas eliminar el proyecto «${deleteTarget?.title}»? También se eliminarán sus imágenes secundarias y demos asociadas.`}
        confirmLabel="Sí, eliminar proyecto"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
