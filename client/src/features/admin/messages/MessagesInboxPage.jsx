import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  X,
  Mail,
  MailOpen,
  Send,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Archive,
  Briefcase,
  Compass,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import FilterTabs from '../../../components/ui/FilterTabs.jsx';
import { VALIDATION_MESSAGES } from '../../../utils/validationConstants.js';
import { useAdminFormContext } from '../context/AdminFormContext.jsx';
import {
  useUnsavedChanges,
  UnsavedChangesModal,
} from '../hooks/useUnsavedChanges.jsx';

const replySchema = z.object({
  body: z
    .string()
    .trim()
    .min(5, 'Escribe al menos 5 caracteres para enviar la respuesta')
    .max(5000, 'La respuesta no puede superar 5000 caracteres'),
});

const TYPE_LABELS = {
  consulta: 'Consulta general',
  cotizacion: 'Cotización',
  asesoria: 'Asesoría',
};

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function MessagesInboxPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshUnreadMessages } = useAdminFormContext();

  // List states
  const [listStatus, setListStatus] = useState('cargando');
  const [listError, setListError] = useState('');
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [typeCounts, setTypeCounts] = useState({
    todos: 0,
    consulta: 0,
    cotizacion: 0,
    asesoria: 0,
  });

  // Filters (including search by user name or email)
  const urlSearchParam = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(urlSearchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearchParam.trim());
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearchParam);
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const urlStatusParam = searchParams.get('status') || '';
  const [statusFilter, setStatusFilter] = useState(urlStatusParam);
  const [prevUrlStatus, setPrevUrlStatus] = useState(urlStatusParam);
  const [page, setPage] = useState(1);

  if (urlSearchParam !== prevUrlSearch) {
    setPrevUrlSearch(urlSearchParam);
    setSearchInput(urlSearchParam);
    setDebouncedSearch(urlSearchParam.trim());
    setPage(1);
  }

  if (urlStatusParam !== prevUrlStatus) {
    setPrevUrlStatus(urlStatusParam);
    setStatusFilter(urlStatusParam);
    setPage(1);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Detail states
  const [detailStatus, setDetailStatus] = useState('idle');
  const [detailError, setDetailError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [replyFileError, setReplyFileError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(replySchema),
    defaultValues: { body: '' },
  });

  const { blocker, bypassBlocker } = useUnsavedChanges(isDirty);

  const fetchMessages = useCallback(async () => {
    setListStatus('cargando');
    setListError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await apiFetch(`/messages?${params.toString()}`);
      const items = res.data || [];
      setMessages(items);
      setPagination(
        res.pagination || {
          page: 1,
          limit: 15,
          total: items.length,
          totalPages: 1,
        }
      );
      if (typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
      if (res.typeCounts) {
        setTypeCounts(res.typeCounts);
      }
      setListStatus(items.length === 0 ? 'sin_datos' : 'con_datos');
    } catch (err) {
      setListError(err.message || 'No se pudo cargar la bandeja de mensajes.');
      setListStatus('error');
    }
  }, [page, debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMessages();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMessages]);

  const fetchMessageDetail = useCallback(
    async (messageId) => {
      if (!messageId) {
        setSelectedMessage(null);
        setDetailStatus('idle');
        return;
      }
      setDetailStatus('cargando');
      setDetailError('');
      try {
        const res = await apiFetch(`/messages/${messageId}`);
        let msg = res.data;

        // Transición automática de nuevo -> leido al abrir el detalle
        if (msg && msg.status === 'nuevo') {
          try {
            const patchRes = await apiFetch(`/messages/${messageId}/status`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'leido' }),
            });
            msg = { ...msg, status: patchRes.data?.status || 'leido' };
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, status: 'leido' } : m))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            refreshUnreadMessages();
          } catch {
            // Ignorar fallo silencioso en auto-leído y mostrar igual el mensaje
          }
        }

        setSelectedMessage(msg);
        setDetailStatus('con_datos');
      } catch (err) {
        setDetailError(
          err.message || 'No se pudo cargar el detalle de la consulta.'
        );
        setDetailStatus('error');
      }
    },
    [refreshUnreadMessages]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setReplyFileError('');
      if (id) {
        fetchMessageDetail(id);
      } else {
        setSelectedMessage(null);
        setDetailStatus('idle');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [id, fetchMessageDetail]);

  const handleStatusChange = async (newStatus) => {
    if (!selectedMessage || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await apiFetch(`/messages/${selectedMessage.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = res.data;
      setSelectedMessage((prev) =>
        prev ? { ...prev, status: updated.status } : prev
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessage.id ? { ...m, status: updated.status } : m
        )
      );
      refreshUnreadMessages();
      fetchMessages();
      toast.success(
        newStatus === 'nuevo'
          ? 'Consulta marcada como no leída'
          : newStatus === 'cerrado'
            ? 'Consulta archivada como cerrada'
            : `Estado actualizado a ${newStatus}`
      );
    } catch (err) {
      toast.error(err.message || 'No se pudo cambiar el estado de la consulta');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const onSubmitReply = async (values) => {
    if (!selectedMessage) return;
    try {
      await apiFetch(`/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body: values.body }),
      });
      toast.success('Respuesta enviada por correo y registrada correctamente');
      bypassBlocker();
      reset({ body: '' });
      setReplyFileError('');
      setSelectedMessage(null);
      await refreshUnreadMessages();
      fetchMessages();
      navigate('/admin/mensajes');
    } catch (err) {
      // Si el servidor devuelve 502 Bad Gateway o error SMTP, conservamos intacto el texto en el textarea
      toast.error(
        err.message ||
          'Fallo en el servidor de correo (502). Tu respuesta no se perdió, puedes reintentar.'
      );
    }
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
    if (searchParams.has('search')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('search');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const renderExtraMetadata = (msg) => {
    const extra = msg?.extra && typeof msg.extra === 'object' ? msg.extra : {};
    const type = msg?.type || 'consulta';

    if (type === 'cotizacion') {
      const tipoProyecto =
        extra.tipo_proyecto || extra.servicio_interes || 'No especificado';
      const rawPresupuesto = extra.presupuesto || 'No especificado';
      const presupuesto =
        rawPresupuesto !== 'No especificado' &&
        !rawPresupuesto.includes('$') &&
        /^[0-9.]+$/.test(rawPresupuesto)
          ? `$ ${rawPresupuesto}`
          : rawPresupuesto;
      const plazo = extra.plazo || 'No especificado';

      return (
        <div className="space-y-3 rounded-[14px] border border-[var(--adm-borde)] bg-[var(--adm-superficie-alta)] p-4">
          <div className="adm-mono flex items-center gap-2 text-[11px] tracking-wider uppercase !text-[var(--ac2)]">
            <Briefcase size={15} />
            <span>Metadatos de Solicitud de Cotización</span>
          </div>
          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
            <div className="rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)] p-2.5">
              <span className="adm-mono block text-[11px] uppercase">
                Tipo de proyecto
              </span>
              <span className="mt-0.5 block text-[13px] font-medium text-[var(--adm-texto)]">
                {tipoProyecto}
              </span>
            </div>
            <div className="rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)] p-2.5">
              <span className="adm-mono block text-[11px] uppercase">
                Presupuesto estimado
              </span>
              <span className="mt-0.5 block text-[13px] font-medium text-[var(--adm-texto)]">
                {presupuesto}
              </span>
            </div>
            <div className="rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)] p-2.5">
              <span className="adm-mono block text-[11px] uppercase">
                Plazo deseado
              </span>
              <span className="mt-0.5 block text-[13px] font-medium text-[var(--adm-texto)]">
                {plazo}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'asesoria') {
      const temaTecnico =
        extra.tema_tecnico || extra.servicio_interes || 'No especificado';
      const modalidad =
        extra.modalidad || extra.disponibilidad || null;

      return (
        <div className="space-y-3 rounded-[14px] border border-[var(--adm-borde)] bg-[var(--adm-superficie-alta)] p-4">
          <div className="adm-mono flex items-center gap-2 text-[11px] tracking-wider uppercase !text-[var(--ac2)]">
            <Compass size={15} />
            <span>Metadatos de Solicitud de Asesoría</span>
          </div>
          <div
            className={`grid grid-cols-1 gap-3 pt-1 ${
              modalidad ? 'sm:grid-cols-2' : ''
            }`}
          >
            <div className="rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)] p-2.5">
              <span className="adm-mono block text-[11px] uppercase">
                Tema técnico / Servicio
              </span>
              <span className="mt-0.5 block text-[13px] font-medium text-[var(--adm-texto)]">
                {temaTecnico}
              </span>
            </div>
            {modalidad && (
              <div className="rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)] p-2.5">
                <span className="adm-mono block text-[11px] uppercase">
                  Modalidad / Disponibilidad
                </span>
                <span className="mt-0.5 block text-[13px] font-medium text-[var(--adm-texto)]">
                  {modalidad}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    const extraKeys = Object.entries(extra).filter(
      ([, v]) => v !== null && v !== ''
    );
    if (extraKeys.length === 0) return null;

    return (
      <div className="space-y-2 rounded-[14px] border border-[var(--adm-borde)] bg-[var(--adm-superficie-alta)] p-4">
        <div className="adm-mono flex items-center gap-2 text-[11px] tracking-wider uppercase">
          <MessageSquare size={15} />
          <span>Datos adicionales</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {extraKeys.map(([k, v]) => (
            <div
              key={k}
              className="rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)] p-2.5"
            >
              <span className="adm-mono block text-[11px] uppercase">
                {k.replace(/_/g, ' ')}
              </span>
              <span className="text-[13px] text-[var(--adm-texto)]">
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hasActiveFilters = Boolean(
    debouncedSearch || typeFilter || statusFilter
  );

  return (
    <div id="v-mensajes" className="adm-view is-on flex flex-col gap-5">
      <UnsavedChangesModal blocker={blocker} />

      {/* Header estelar */}
      <div className="adm-pagehead">
        <div className="adm-pagehead-left">
          <span className="adm-planet-orb" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="adm-h1">Mensajes y Consultas</h1>
              {unreadCount > 0 && (
                <Badge variant="status" status="nuevo">
                  {unreadCount} sin leer
                </Badge>
              )}
            </div>
            <p className="adm-sub">
              Bandeja de entrada de contactos, solicitudes de cotización y
              asesorías técnicas.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda por nombre de usuario o correo + Filtros */}
      <section className="adm-card adm-toolbar">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--adm-texto-suave)]"
          />
          <input
            type="text"
            maxLength={100}
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              if (!val && searchParams.has('search')) {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete('search');
                setSearchParams(nextParams, { replace: true });
              }
            }}
            placeholder="Buscar consultas por nombre de usuario o correo electrónico..."
            className="adm-input !pr-9 !pl-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
                if (searchParams.has('search')) {
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete('search');
                  setSearchParams(nextParams, { replace: true });
                }
              }}
              aria-label="Limpiar búsqueda"
              className="absolute top-1/2 right-2.5 grid h-6 w-6 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-[var(--adm-texto-suave)] hover:text-[var(--adm-texto)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="adm-select !w-auto"
          >
            <option value="">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="leido">Leído</option>
            <option value="respondido">Respondido</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>

        <FilterTabs
          activeId={typeFilter}
          onChange={(val) => {
            setTypeFilter(val);
            setPage(1);
          }}
          tabs={[
            { id: '', label: `Todos (${typeCounts.todos})` },
            {
              id: 'consulta',
              label: `Consulta general (${typeCounts.consulta})`,
            },
            {
              id: 'cotizacion',
              label: `Cotización (${typeCounts.cotizacion})`,
            },
            {
              id: 'asesoria',
              label: `Asesoría (${typeCounts.asesoria})`,
            },
          ]}
        />
      </section>

      {/* Contenedor Maestro-Detalle */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Columna Izquierda: Lista de Mensajes (oculta en móvil si hay :id seleccionado) */}
        <section
          className={`${
            id ? 'hidden lg:col-span-5 lg:block' : 'col-span-1 lg:col-span-12'
          } adm-card flush`}
        >
          <DataState
            status={listStatus}
            errorMessage={listError}
            onRetry={fetchMessages}
            skeletonRows={5}
            emptyTitle="No se encontraron consultas"
            emptyDescription={
              hasActiveFilters
                ? 'No hay mensajes que coincidan con el usuario, correo o filtros seleccionados.'
                : 'Aún no has recibido mensajes ni solicitudes desde el formulario de contacto.'
            }
            emptyActionLabel={hasActiveFilters ? 'Limpiar filtros' : undefined}
            onEmptyAction={hasActiveFilters ? clearAllFilters : undefined}
          >
            <div>
              {messages.map((msg) => {
                const isSelected = Number(id) === Number(msg.id);
                const isUnread = msg.status === 'nuevo';

                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => {
                      const querySuffix = debouncedSearch
                        ? `?search=${encodeURIComponent(debouncedSearch)}`
                        : '';
                      navigate(`/admin/mensajes/${msg.id}${querySuffix}`);
                    }}
                    className={`adm-msg-row w-full text-left ${
                      isSelected ? 'is-selected' : ''
                    }`}
                  >
                    <div className="adm-msg-top">
                      <div className="adm-msg-who">
                        {isUnread ? (
                          <Mail
                            size={15}
                            className="shrink-0 text-[var(--warn)]"
                          />
                        ) : (
                          <MailOpen
                            size={15}
                            className="shrink-0 text-[var(--adm-texto-suave)]"
                          />
                        )}
                        <span
                          className={
                            isUnread
                              ? 'font-bold text-[var(--adm-texto)]'
                              : 'font-medium text-[var(--adm-texto-suave)]'
                          }
                        >
                          {msg.name}
                        </span>
                      </div>
                      <span className="adm-msg-time">
                        {formatDateTime(msg.created_at)}
                      </span>
                    </div>

                    <div className="adm-msg-mail">{msg.email}</div>

                    <p
                      className={`adm-msg-excerpt ${
                        isUnread ? 'font-medium !text-[var(--adm-texto)]' : ''
                      }`}
                    >
                      {msg.subject ? `${msg.subject}: ` : ''}
                      {msg.body}
                    </p>

                    <div className="adm-msg-meta">
                      <Badge variant="neutral">
                        {TYPE_LABELS[msg.type] || msg.type}
                      </Badge>
                      <Badge variant="status" status={msg.status} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Controles de paginación */}
            <div className="adm-foot">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="adm-btn secondary sm"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>
              <span className="adm-mono text-[12px]">
                Página {pagination.page} de {pagination.totalPages || 1} (
                {pagination.total} total)
              </span>
              <button
                type="button"
                disabled={pagination.page >= (pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="adm-btn secondary sm"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            </div>
          </DataState>
        </section>

        {/* Columna Derecha: Detalle de Consulta y Respuesta */}
        {id && (
          <section className="adm-card col-span-1 space-y-5 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--adm-borde)] pb-4">
              <button
                type="button"
                onClick={() => {
                  const querySuffix = debouncedSearch
                    ? `?search=${encodeURIComponent(debouncedSearch)}`
                    : '';
                  navigate(`/admin/mensajes${querySuffix}`);
                }}
                className="adm-link inline-flex items-center gap-1.5 text-[13px] font-medium"
              >
                <ArrowLeft size={15} />
                Volver a la bandeja
              </button>

              {selectedMessage && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      updatingStatus || selectedMessage.status === 'nuevo'
                    }
                    onClick={() => handleStatusChange('nuevo')}
                    className="adm-btn secondary sm"
                  >
                    <Mail size={13} />
                    Marcar como no leído
                  </button>
                  <button
                    type="button"
                    disabled={
                      updatingStatus || selectedMessage.status === 'cerrado'
                    }
                    onClick={() => handleStatusChange('cerrado')}
                    className="adm-btn secondary sm"
                  >
                    <Archive size={13} />
                    Cerrar consulta
                  </button>
                </div>
              )}
            </div>

            <DataState
              status={detailStatus === 'idle' ? 'cargando' : detailStatus}
              errorMessage={detailError}
              onRetry={() => fetchMessageDetail(id)}
              skeletonRows={3}
            >
              {selectedMessage && (
                <div className="space-y-5">
                  {/* Encabezado del remitente */}
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="adm-avatar">
                        <User size={17} />
                      </div>
                      <div>
                        <h2 className="font-heading text-[18px] font-bold text-[var(--adm-texto)]">
                          {selectedMessage.name}
                        </h2>
                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="adm-link adm-mono text-[13px]"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">
                        {TYPE_LABELS[selectedMessage.type] ||
                          selectedMessage.type}
                      </Badge>
                      <Badge variant="status" status={selectedMessage.status} />
                      <span className="adm-mono flex items-center gap-1 text-[11px]">
                        <Clock size={13} />
                        {formatDateTime(selectedMessage.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta estructurada de metadatos extra JSONB */}
                  {renderExtraMetadata(selectedMessage)}

                  {/* Cuerpo del mensaje original */}
                  <div className="adm-quote space-y-2">
                    {selectedMessage.subject && (
                      <h3 className="text-[14px] font-semibold text-[var(--adm-texto)]">
                        Asunto: {selectedMessage.subject}
                      </h3>
                    )}
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-[var(--adm-texto)]">
                      {selectedMessage.body}
                    </p>
                  </div>

                  {/* Historial de respuestas enviadas */}
                  {Array.isArray(selectedMessage.replies) &&
                    selectedMessage.replies.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="adm-mono text-[11px] tracking-wider uppercase">
                          Historial de Respuestas Enviadas (
                          {selectedMessage.replies.length})
                        </h3>
                        <div className="space-y-3">
                          {selectedMessage.replies.map((rep) => (
                            <div
                              key={rep.id}
                              className="space-y-2 rounded-[14px] border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] p-4"
                            >
                              <div className="flex items-center justify-between text-[12px]">
                                <span className="flex items-center gap-1.5 font-semibold text-[var(--ok)]">
                                  <CheckCircle2 size={14} />
                                  {rep.author_name || 'Administrador'}
                                </span>
                                <span className="adm-mono">
                                  {formatDateTime(rep.created_at)}
                                </span>
                              </div>
                              <p className="text-[13px] whitespace-pre-wrap text-[var(--adm-texto)]">
                                {rep.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Formulario de respuesta transaccional */}
                  <form
                    onSubmit={handleSubmit(onSubmitReply)}
                    className="space-y-4 border-t border-[var(--adm-borde)] pt-4"
                  >
                    <div>
                      <label htmlFor="reply-body" className="adm-label">
                        Responder por correo electrónico a{' '}
                        {selectedMessage.name}
                      </label>
                      <textarea
                        id="reply-body"
                        rows={5}
                        maxLength={5000}
                        placeholder="Escribe aquí tu respuesta profesional. Se enviará por email al remitente y quedará registrada en este hilo..."
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                            e.preventDefault();
                            setReplyFileError(VALIDATION_MESSAGES.NO_ATTACHMENTS);
                          }
                        }}
                        onPaste={(e) => {
                          if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
                            e.preventDefault();
                            setReplyFileError(VALIDATION_MESSAGES.NO_ATTACHMENTS);
                          }
                        }}
                        {...register('body', {
                          onChange: () => {
                            if (replyFileError) setReplyFileError('');
                          },
                        })}
                        className="adm-textarea"
                      />
                      {(errors.body || replyFileError) && (
                        <p className="mt-1 text-[12px] text-[var(--bad)]">
                          {errors.body?.message || replyFileError}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <span className="text-[12px] text-[var(--adm-texto-suave)]">
                        Al enviar, el estado pasará automáticamente a{' '}
                        <strong>Respondido</strong>.
                      </span>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="adm-btn primary"
                      >
                        <Send size={15} />
                        <span>
                          {isSubmitting
                            ? 'Enviando correo...'
                            : 'Enviar respuesta'}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </DataState>
          </section>
        )}
      </div>
    </div>
  );
}
