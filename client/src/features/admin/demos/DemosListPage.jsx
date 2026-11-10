import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
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
  const [selectedProjectId, setSelectedProjectId] =
    useState(initialProjectFilter);
  const [selectedType, setSelectedType] = useState('todos');
  const [search, setSearch] = useState('');
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
      const projectsList = Array.isArray(projectsRes?.data)
        ? projectsRes.data
        : [];
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

  const typeCounts = useMemo(() => {
    const scopedDemos = selectedProjectId
      ? demos.filter((d) => String(d.project_id) === String(selectedProjectId))
      : demos;

    let iframe = 0;
    let video = 0;
    let imagenes = 0;

    for (const d of scopedDemos) {
      const norm = d.type === 'images' ? 'imagenes' : d.type;
      if (norm === 'iframe') iframe++;
      else if (norm === 'video') video++;
      else if (norm === 'imagenes') imagenes++;
    }

    return {
      todos: scopedDemos.length,
      iframe,
      video,
      imagenes,
    };
  }, [demos, selectedProjectId]);

  const filteredDemos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return demos.filter((d) => {
      if (
        selectedProjectId &&
        String(d.project_id) !== String(selectedProjectId)
      ) {
        return false;
      }
      const normType = d.type === 'images' ? 'imagenes' : d.type;
      if (selectedType !== 'todos' && normType !== selectedType) {
        return false;
      }
      if (q) {
        const demoTitle = String(d.title || '').toLowerCase();
        const demoDesc = String(d.description || '').toLowerCase();
        const projectTitle = String(
          d.project_title ||
            projects.find((p) => String(p.id) === String(d.project_id))?.title ||
            ''
        ).toLowerCase();
        if (
          !demoTitle.includes(q) &&
          !demoDesc.includes(q) &&
          !projectTitle.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [demos, projects, selectedProjectId, selectedType, search]);

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
    <div id="v-demos" className="adm-view is-on flex flex-col gap-5">
      {/* Cabecera estelar */}
      <div className="adm-pagehead">
        <div className="adm-pagehead-left">
          <span className="adm-planet-orb" aria-hidden="true" />
          <div>
            <h1 className="adm-h1">Demostraciones Interactivas (Demos)</h1>
            <p className="adm-sub">
              Administrá entornos en vivo (iframe), videos demostrativos y
              galerías interactivas por proyecto.
            </p>
          </div>
        </div>

        <div className="adm-actions">
          <button
            type="button"
            onClick={() =>
              navigate(
                selectedProjectId
                  ? `/admin/demos/nuevo?project_id=${selectedProjectId}`
                  : '/admin/demos/nuevo'
              )
            }
            className="adm-btn primary"
          >
            <Plus size={16} />
            <span>Nueva demo</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <section className="adm-card adm-toolbar">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--adm-texto-suave)]"
          />
          <input
            type="text"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por proyecto, demo o descripción…"
            className="adm-input !pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="adm-mono">Proyecto:</span>
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
            className="adm-select !w-auto"
          >
            <option value="">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="push">
          {[
            { id: 'todos', label: `Todos los tipos (${typeCounts.todos})` },
            { id: 'iframe', label: `Iframe (${typeCounts.iframe})` },
            { id: 'video', label: `Video (${typeCounts.video})` },
            { id: 'imagenes', label: `Imágenes (${typeCounts.imagenes})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`adm-tab ${selectedType === t.id ? 'is-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

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
        <section className="adm-card flush">
          <div className="overflow-x-auto">
            <table className="adm-table flush">
              <thead>
                <tr>
                  <th>Demostración</th>
                  <th>Proyecto asociado</th>
                  <th>Tipo</th>
                  <th>Recurso / URL</th>
                  <th className="r">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="adm-empty">
                      No se encontraron demostraciones que coincidan con los filtros o la búsqueda.
                    </td>
                  </tr>
                )}
                {filteredDemos.map((demo) => {
                  const normType =
                    demo.type === 'images' ? 'imagenes' : demo.type;
                  const TypeIcon =
                    normType === 'iframe'
                      ? Monitor
                      : normType === 'video'
                        ? Play
                        : ImageIcon;

                  return (
                    <tr key={demo.id}>
                      <td>
                        <b className="font-heading text-[15px] font-bold text-[var(--adm-texto)]">
                          {demo.title}
                        </b>
                        {demo.description && (
                          <small className="mt-0.5 line-clamp-1">
                            {demo.description}
                          </small>
                        )}
                      </td>

                      <td>
                        <span className="adm-chip">
                          {demo.project_title || `Proyecto #${demo.project_id}`}
                        </span>
                      </td>

                      <td>
                        <span className="adm-chip">
                          <TypeIcon size={12} className="text-[var(--ac2)]" />
                          <span>{TYPE_LABELS[normType] || normType}</span>
                        </span>
                      </td>

                      <td>
                        {normType === 'imagenes' ? (
                          <span className="adm-mono">
                            {(demo.urls || []).length} imagen(es) cargada(s)
                          </span>
                        ) : demo.url ? (
                          <a
                            href={demo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="adm-link adm-mono inline-flex max-w-[240px] items-center gap-1 truncate"
                          >
                            <span className="truncate">{demo.url}</span>
                            <ExternalLink size={12} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="adm-mono">—</span>
                        )}
                      </td>

                      <td className="r">
                        <div className="adm-row-actions">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/demos/${demo.id}/editar`)
                            }
                            className="adm-btn secondary sm"
                          >
                            <Edit3 size={13} />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(demo)}
                            aria-label={`Eliminar ${demo.title}`}
                            className="adm-iconbtn danger"
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
        </section>
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
