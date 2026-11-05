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
import Button from '../../../components/ui/Button.jsx';
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

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (activeFilter === 'publicados' && !p.published) return false;
      if (activeFilter === 'borradores' && p.published) return false;
      if (q) {
        const hayTitle = String(p.title || '').toLowerCase().includes(q);
        const hayDesc = String(p.description || p.summary || '').toLowerCase().includes(q);
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
        err.message || 'Error al actualizar estado. Se revirtió el cambio automáticamente.'
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
    <div className="flex flex-col gap-6">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-[26px] font-bold tracking-tight text-[var(--texto)]">
            Gestión de Proyectos
          </h1>
          <p className="font-sans-ui mt-1 text-[14px] text-[var(--texto-suave)]">
            Ordená, publicá o editá los proyectos del portfolio y sus demostraciones.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/admin/proyectos/nuevo')}
          className="!px-4 !py-2.5 !text-[14px]"
        >
          <Plus size={17} />
          <span>Nuevo proyecto</span>
        </Button>
      </div>

      {/* Barra de filtros superiores */}
      <div className="flex flex-col justify-between gap-3 rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-[340px]">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--texto-suave)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o descripción..."
            className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)] py-2 pr-3 pl-9 text-[13px] text-[var(--texto)] placeholder:text-[var(--texto-suave)] focus:border-[var(--acento)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`font-sans-ui cursor-pointer rounded-[9px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                activeFilter === f.id
                  ? 'bg-[var(--acento)] text-[var(--sobre-acento)]'
                  : 'bg-[var(--fondo)] text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

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
        <div className="overflow-visible rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--borde)] bg-[var(--superficie-alta)] text-[11px] font-semibold uppercase tracking-[1px] text-[var(--texto-suave)]">
                  <th className="font-mono-ui w-[92px] px-4 py-3.5">Orden</th>
                  <th className="font-mono-ui px-4 py-3.5">Proyecto</th>
                  <th className="font-mono-ui w-[190px] px-4 py-3.5">Estado</th>
                  <th className="font-mono-ui w-[170px] px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--borde)]">
                {filteredProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    className="transition-colors hover:bg-[var(--superficie-alta)]/40"
                  >
                    {/* 1. Orden */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleReorder(project.id, 'up')}
                          aria-label={`Subir ${project.title}`}
                          className="cursor-pointer rounded-md border border-[var(--borde)] bg-[var(--fondo)] p-1.5 text-[var(--texto-suave)] hover:border-[var(--acento)] hover:text-[var(--texto)] disabled:opacity-30"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={index === filteredProjects.length - 1}
                          onClick={() => handleReorder(project.id, 'down')}
                          aria-label={`Bajar ${project.title}`}
                          className="cursor-pointer rounded-md border border-[var(--borde)] bg-[var(--fondo)] p-1.5 text-[var(--texto-suave)] hover:border-[var(--acento)] hover:text-[var(--texto)] disabled:opacity-30"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>

                    {/* 2. Proyecto */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-18 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[var(--borde)] bg-[var(--fondo)]">
                          {project.cover_image_url ? (
                            <img
                              src={project.cover_image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={18} className="text-[var(--texto-suave)]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-heading text-[15px] font-bold text-[var(--texto)]">
                              {project.title}
                            </span>
                          </div>
                          <p className="font-sans-ui mt-0.5 line-clamp-1 text-[12px] text-[var(--texto-suave)]">
                            {project.description || project.summary}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 3. Estado: único interruptor interactivo con actualización optimista */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={project.published}
                          onClick={() => handleOptimisticTogglePublished(project)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                            project.published
                              ? 'bg-emerald-500'
                              : 'bg-[var(--borde)]'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              project.published ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <Badge
                          variant="status"
                          status={project.published ? 'publicado' : 'borrador'}
                        />
                      </div>
                    </td>

                    {/* 4. Acciones: Editar directo + menú desplegable (⋮) */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="relative inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/proyectos/${project.id}/editar`)}
                          className="font-sans-ui inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border border-[var(--borde)] bg-[var(--fondo)] px-3 py-1.5 text-[12px] font-semibold text-[var(--texto)] transition-colors hover:border-[var(--acento)]"
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
                          className="cursor-pointer rounded-[9px] border border-[var(--borde)] bg-[var(--fondo)] p-1.5 text-[var(--texto-suave)] hover:border-[var(--acento)] hover:text-[var(--texto)]"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {openMenuId === project.id && (
                          <div
                            role="menu"
                            className="absolute top-10 right-0 z-30 w-48 rounded-[12px] border border-[var(--borde)] bg-[var(--superficie)] p-1.5 text-left shadow-xl"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/admin/demos?project_id=${project.id}`);
                              }}
                              className="font-sans-ui flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-[12px] text-[var(--texto)] hover:bg-[var(--superficie-alta)]"
                            >
                              <PlaySquare size={14} className="text-[var(--acento-texto)]" />
                              <span>Gestionar demos</span>
                            </button>


                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleteTarget(project);
                              }}
                              className="font-sans-ui flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-[12px] text-red-400 hover:bg-red-500/10"
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
        </div>
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
