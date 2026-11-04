import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Trash2,
  Monitor,
  Play,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';

const TYPE_LABELS = {
  iframe: 'Iframe interactivo',
  video: 'Video (YouTube / Loom)',
  imagenes: 'Galería de imágenes',
  images: 'Galería de imágenes',
};

export default function DemosListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const initialProjectFilter = searchParams.get('project_id') || '';

  const [demos, setDemos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectFilter);
  const [selectedType, setSelectedType] = useState('todos');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setStatus('cargando');
    setErrorMsg('');
    try {
      const [demosRes, projectsRes] = await Promise.all([
        apiFetch('/demos'),
        apiFetch('/projects?admin=true'),
      ]);
      const demosList = Array.isArray(demosRes?.data) ? demosRes.data : [];
      const projectsList = Array.isArray(projectsRes?.data) ? projectsRes.data : [];
      setDemos(demosList);
      setProjects(projectsList);
      setStatus(demosList.length === 0 ? 'sin_datos' : 'con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudieron cargar las demostraciones.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const filteredDemos = useMemo(() => {
    return demos.filter((d) => {
      if (selectedProjectId && String(d.project_id) !== String(selectedProjectId)) {
        return false;
      }
      const normType = d.type === 'images' ? 'imagenes' : d.type;
      if (selectedType !== 'todos' && normType !== selectedType) {
        return false;
      }
      return true;
    });
  }, [demos, selectedProjectId, selectedType]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/demos/${deleteTarget.id}`, { method: 'DELETE' });
      const remaining = demos.filter((d) => d.id !== deleteTarget.id);
      setDemos(remaining);
      if (remaining.length === 0) setStatus('sin_datos');
      toast.success(`Demo «${deleteTarget.title}» eliminada correctamente`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar la demo');
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
            Demostraciones Interactivas (Demos)
          </h1>
          <p className="font-sans-ui mt-1 text-[14px] text-[var(--texto-suave)]">
            Administrá entornos en vivo (iframe), videos demostrativos y galerías interactivas por proyecto.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() =>
            navigate(
              selectedProjectId
                ? `/admin/demos/nuevo?project_id=${selectedProjectId}`
                : '/admin/demos/nuevo'
            )
          }
          className="!px-4 !py-2.5 !text-[14px]"
        >
          <Plus size={17} />
          <span>Nueva demo</span>
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col justify-between gap-3 rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <label className="font-sans-ui text-[13px] font-medium text-[var(--texto-suave)]">
            Proyecto:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProjectId(val);
              if (val) {
                setSearchParams({ project_id: val });
              } else {
                setSearchParams({});
              }
            }}
            className="font-sans-ui rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2 text-[13px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          >
            <option value="">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'todos', label: 'Todos los tipos' },
            { id: 'iframe', label: 'Iframe' },
            { id: 'video', label: 'Video' },
            { id: 'imagenes', label: 'Imágenes' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`font-sans-ui cursor-pointer rounded-[9px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                selectedType === t.id
                  ? 'bg-[var(--acento)] text-[var(--sobre-acento)]'
                  : 'bg-[var(--fondo)] text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado */}
      <DataState
        status={status}
        skeletonType="table"
        errorMessage={errorMsg}
        onRetry={loadData}
        emptyTitle="Aún no hay demostraciones cargadas"
        emptyDescription="Asociá una demo interactiva (iframe, video o galería) a cualquiera de tus proyectos."
        emptyActionLabel="+ Crear la primera demo"
        onEmptyAction={() => navigate('/admin/demos/nuevo')}
      >
        <div className="overflow-hidden rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--borde)] bg-[var(--superficie-alta)] text-[11px] font-semibold uppercase tracking-[1px] text-[var(--texto-suave)]">
                  <th className="font-mono-ui px-5 py-3.5">Demostración</th>
                  <th className="font-mono-ui px-4 py-3.5">Proyecto asociado</th>
                  <th className="font-mono-ui px-4 py-3.5">Tipo</th>
                  <th className="font-mono-ui px-4 py-3.5">Recurso / URL</th>
                  <th className="font-mono-ui px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--borde)]">
                {filteredDemos.map((demo) => {
                  const normType = demo.type === 'images' ? 'imagenes' : demo.type;
                  const TypeIcon =
                    normType === 'iframe'
                      ? Monitor
                      : normType === 'video'
                        ? Play
                        : ImageIcon;

                  return (
                    <tr
                      key={demo.id}
                      className="transition-colors hover:bg-[var(--superficie-alta)]/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-heading text-[15px] font-bold text-[var(--texto)]">
                          {demo.title}
                        </p>
                        {demo.description && (
                          <p className="font-sans-ui mt-0.5 line-clamp-1 text-[12px] text-[var(--texto-suave)]">
                            {demo.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <Badge variant="neutral">
                          {demo.project_title || `Proyecto #${demo.project_id}`}
                        </Badge>
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          variant="neutral"
                          icon={<TypeIcon size={12} className="text-[var(--acento-texto)]" />}
                        >
                          {TYPE_LABELS[normType] || normType}
                        </Badge>
                      </td>

                      <td className="px-4 py-4">
                        {normType === 'imagenes' ? (
                          <span className="font-mono-ui text-[12px] text-[var(--texto-suave)]">
                            {(demo.urls || []).length} imagen(es) cargada(s)
                          </span>
                        ) : demo.url ? (
                          <a
                            href={demo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono-ui inline-flex max-w-[240px] items-center gap-1 truncate text-[12px] text-[var(--acento-texto)] hover:underline"
                          >
                            <span className="truncate">{demo.url}</span>
                            <ExternalLink size={12} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[12px] text-[var(--texto-suave)]">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/demos/${demo.id}/editar`)}
                            className="font-sans-ui inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border border-[var(--borde)] bg-[var(--fondo)] px-3 py-1.5 text-[12px] font-semibold text-[var(--texto)] hover:border-[var(--acento)]"
                          >
                            <Edit3 size={13} />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(demo)}
                            aria-label={`Eliminar ${demo.title}`}
                            className="cursor-pointer rounded-[9px] border border-[var(--borde)] bg-[var(--fondo)] p-1.5 text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </DataState>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar demostración"
        description={`¿Confirmas eliminar la demo «${deleteTarget?.title}»?`}
        confirmLabel="Eliminar demo"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
