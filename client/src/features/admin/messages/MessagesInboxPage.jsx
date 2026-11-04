import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
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
import { useAdminFormContext } from '../context/AdminFormContext.jsx';
import { useUnsavedChanges, UnsavedChangesModal } from '../hooks/useUnsavedChanges.jsx';

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshUnreadMessages } = useAdminFormContext();

  // List states
  const [listStatus, setListStatus] = useState('cargando');
  const [listError, setListError] = useState('');
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);

  // Detail states
  const [detailStatus, setDetailStatus] = useState('idle');
  const [detailError, setDetailError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(replySchema),
    defaultValues: { body: '' },
  });

  const { blocker } = useUnsavedChanges(isDirty);

  const fetchMessages = useCallback(async () => {
    setListStatus('cargando');
    setListError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await apiFetch(`/messages?${params.toString()}`);
      const items = res.data || [];
      setMessages(items);
      setPagination(res.pagination || { page: 1, limit: 15, total: items.length, totalPages: 1 });
      if (typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
      setListStatus(items.length === 0 ? 'sin_datos' : 'con_datos');
    } catch (err) {
      setListError(err.message || 'No se pudo cargar la bandeja de mensajes.');
      setListStatus('error');
    }
  }, [page, typeFilter, statusFilter]);

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
        setDetailError(err.message || 'No se pudo cargar el detalle de la consulta.');
        setDetailStatus('error');
      }
    },
    [refreshUnreadMessages]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
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
      setSelectedMessage((prev) => (prev ? { ...prev, status: updated.status } : prev));
      setMessages((prev) =>
        prev.map((m) => (m.id === selectedMessage.id ? { ...m, status: updated.status } : m))
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
      const res = await apiFetch(`/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body: values.body }),
      });
      toast.success('Respuesta enviada por correo y registrada correctamente');
      reset({ body: '' }, { keepValues: false });
      const createdReply = res.data?.reply;
      setSelectedMessage((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'respondido',
          replies: createdReply ? [...(prev.replies || []), createdReply] : prev.replies,
        };
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === selectedMessage.id ? { ...m, status: 'respondido' } : m))
      );
      refreshUnreadMessages();
    } catch (err) {
      // Si el servidor devuelve 502 Bad Gateway o error SMTP, conservamos intacto el texto en el textarea
      toast.error(
        err.message ||
          'Fallo en el servidor de correo (502). Tu respuesta no se perdió, puedes reintentar.'
      );
    }
  };

  const renderExtraMetadata = (msg) => {
    const extra = msg?.extra && typeof msg.extra === 'object' ? msg.extra : {};
    const type = msg?.type || 'consulta';

    if (type === 'cotizacion') {
      const tipoProyecto = extra.tipo_proyecto || extra.servicio_interes || 'No especificado';
      const presupuesto = extra.presupuesto || 'No especificado';
      const plazo = extra.plazo || 'No especificado';

      return (
        <div className="space-y-3 rounded-[14px] border border-[var(--borde)] bg-[var(--superficie-alta)] p-4">
          <div className="font-mono-ui flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--acento-texto)]">
            <Briefcase size={15} />
            <span>Metadatos de Solicitud de Cotización</span>
          </div>
          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
            <div className="rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] p-2.5">
              <span className="font-mono-ui block text-[11px] uppercase text-[var(--texto-suave)]">
                Tipo de proyecto
              </span>
              <span className="font-sans-ui mt-0.5 block text-[13px] font-medium text-[var(--texto)]">
                {tipoProyecto}
              </span>
            </div>
            <div className="rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] p-2.5">
              <span className="font-mono-ui block text-[11px] uppercase text-[var(--texto-suave)]">
                Presupuesto estimado
              </span>
              <span className="font-sans-ui mt-0.5 block text-[13px] font-medium text-[var(--texto)]">
                {presupuesto}
              </span>
            </div>
            <div className="rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] p-2.5">
              <span className="font-mono-ui block text-[11px] uppercase text-[var(--texto-suave)]">
                Plazo deseado
              </span>
              <span className="font-sans-ui mt-0.5 block text-[13px] font-medium text-[var(--texto)]">
                {plazo}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'asesoria') {
      const temaTecnico = extra.tema_tecnico || extra.servicio_interes || 'No especificado';
      const modalidad = extra.modalidad || extra.disponibilidad || 'No especificada';

      return (
        <div className="space-y-3 rounded-[14px] border border-[var(--borde)] bg-[var(--superficie-alta)] p-4">
          <div className="font-mono-ui flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--acento-texto)]">
            <Compass size={15} />
            <span>Metadatos de Solicitud de Asesoría</span>
          </div>
          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
            <div className="rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] p-2.5">
              <span className="font-mono-ui block text-[11px] uppercase text-[var(--texto-suave)]">
                Tema técnico / Servicio
              </span>
              <span className="font-sans-ui mt-0.5 block text-[13px] font-medium text-[var(--texto)]">
                {temaTecnico}
              </span>
            </div>
            <div className="rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] p-2.5">
              <span className="font-mono-ui block text-[11px] uppercase text-[var(--texto-suave)]">
                Modalidad / Disponibilidad
              </span>
              <span className="font-sans-ui mt-0.5 block text-[13px] font-medium text-[var(--texto)]">
                {modalidad}
              </span>
            </div>
          </div>
        </div>
      );
    }

    const extraKeys = Object.entries(extra).filter(([, v]) => v !== null && v !== '');
    if (extraKeys.length === 0) return null;

    return (
      <div className="space-y-2 rounded-[14px] border border-[var(--borde)] bg-[var(--superficie-alta)] p-4">
        <div className="font-mono-ui flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--texto-suave)]">
          <MessageSquare size={15} />
          <span>Datos adicionales</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {extraKeys.map(([k, v]) => (
            <div
              key={k}
              className="rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] p-2.5"
            >
              <span className="font-mono-ui block text-[11px] uppercase text-[var(--texto-suave)]">
                {k.replace(/_/g, ' ')}
              </span>
              <span className="font-sans-ui text-[13px] text-[var(--texto)]">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <UnsavedChangesModal blocker={blocker} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-[26px] font-bold tracking-tight text-[var(--texto)]">
              Mensajes y Consultas
            </h1>
            {unreadCount > 0 && (
              <Badge variant="status" status="nuevo">
                {unreadCount} sin leer
              </Badge>
            )}
          </div>
          <p className="font-sans-ui mt-1 text-[14px] text-[var(--texto-suave)]">
            Bandeja de entrada de contactos, solicitudes de cotización y asesorías técnicas.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filtrar por tipo de consulta"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="font-sans-ui rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="consulta">Consulta general</option>
            <option value="cotizacion">Cotización</option>
            <option value="asesoria">Asesoría</option>
          </select>

          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="font-sans-ui rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="leido">Leído</option>
            <option value="respondido">Respondido</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
      </div>

      {/* Contenedor Maestro-Detalle */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Lista de Mensajes (oculta en móvil si hay :id seleccionado) */}
        <div
          className={`${
            id ? 'hidden lg:col-span-5 lg:block' : 'col-span-1 lg:col-span-12'
          } overflow-hidden rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)]`}
        >
          <DataState
            status={listStatus}
            errorMessage={listError}
            onRetry={fetchMessages}
            skeletonRows={5}
            emptyTitle="No se encontraron consultas"
            emptyDescription={
              typeFilter || statusFilter
                ? 'No hay mensajes que coincidan con los filtros seleccionados.'
                : 'Aún no has recibido mensajes ni solicitudes desde el formulario de contacto.'
            }
            emptyActionLabel={typeFilter || statusFilter ? 'Limpiar filtros' : undefined}
            onEmptyAction={
              typeFilter || statusFilter
                ? () => {
                    setTypeFilter('');
                    setStatusFilter('');
                    setPage(1);
                  }
                : undefined
            }
          >
            <div className="divide-y divide-[var(--borde)]">
              {messages.map((msg) => {
                const isSelected = Number(id) === Number(msg.id);
                const isUnread = msg.status === 'nuevo';

                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => navigate(`/admin/mensajes/${msg.id}`)}
                    className={`flex w-full cursor-pointer flex-col gap-2 p-4 text-left transition-colors hover:bg-[var(--superficie-alta)] ${
                      isSelected
                        ? 'border-l-4 border-l-[var(--acento)] bg-[var(--acento)]/10'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {isUnread ? (
                          <Mail size={16} className="shrink-0 text-amber-400" />
                        ) : (
                          <MailOpen size={16} className="shrink-0 text-[var(--texto-suave)]" />
                        )}
                        <span
                          className={`font-sans-ui truncate text-[14px] ${
                            isUnread
                              ? 'font-bold text-[var(--texto)]'
                              : 'font-medium text-[var(--texto-suave)]'
                          }`}
                        >
                          {msg.name}
                        </span>
                      </div>
                      <span className="font-mono-ui shrink-0 text-[11px] text-[var(--texto-suave)]">
                        {formatDateTime(msg.created_at)}
                      </span>
                    </div>

                    <div className="font-mono-ui truncate text-[12px] text-[var(--texto-suave)]">
                      {msg.email}
                    </div>

                    <p
                      className={`font-sans-ui line-clamp-2 text-[13px] ${
                        isUnread
                          ? 'font-medium text-[var(--texto)]'
                          : 'text-[var(--texto-suave)]'
                      }`}
                    >
                      {msg.subject ? `${msg.subject}: ` : ''}
                      {msg.body}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Badge variant="neutral">{TYPE_LABELS[msg.type] || msg.type}</Badge>
                      <Badge variant="status" status={msg.status} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Controles de paginación */}
            <div className="flex items-center justify-between gap-2 border-t border-[var(--borde)] bg-[var(--superficie-alta)] px-4 py-3">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="font-sans-ui inline-flex cursor-pointer items-center gap-1 rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-1.5 text-[12px] font-medium text-[var(--texto-suave)] hover:text-[var(--texto)] disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>
              <span className="font-mono-ui text-[12px] text-[var(--texto-suave)]">
                Página {pagination.page} de {pagination.totalPages || 1} ({pagination.total} total)
              </span>
              <button
                type="button"
                disabled={pagination.page >= (pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="font-sans-ui inline-flex cursor-pointer items-center gap-1 rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-1.5 text-[12px] font-medium text-[var(--texto-suave)] hover:text-[var(--texto)] disabled:pointer-events-none disabled:opacity-40"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            </div>
          </DataState>
        </div>

        {/* Columna Derecha: Detalle de Consulta y Respuesta */}
        {id && (
          <div className="col-span-1 space-y-6 rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--borde)] pb-4">
              <button
                type="button"
                onClick={() => navigate('/admin/mensajes')}
                className="font-sans-ui inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[var(--texto-suave)] hover:text-[var(--texto)]"
              >
                <ArrowLeft size={16} />
                Volver a la bandeja
              </button>

              {selectedMessage && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={updatingStatus || selectedMessage.status === 'nuevo'}
                    onClick={() => handleStatusChange('nuevo')}
                    className="font-sans-ui inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-3 py-1.5 text-[12px] font-medium text-[var(--texto-suave)] hover:text-[var(--texto)] disabled:opacity-40"
                  >
                    <Mail size={14} />
                    Marcar como no leído
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus || selectedMessage.status === 'cerrado'}
                    onClick={() => handleStatusChange('cerrado')}
                    className="font-sans-ui inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-3 py-1.5 text-[12px] font-medium text-[var(--texto-suave)] hover:text-[var(--texto)] disabled:opacity-40"
                  >
                    <Archive size={14} />
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
                <div className="space-y-6">
                  {/* Encabezado del remitente */}
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--borde)] bg-[var(--superficie-alta)] text-[var(--acento-texto)]">
                        <User size={18} />
                      </div>
                      <div>
                        <h2 className="font-heading text-[18px] font-bold text-[var(--texto)]">
                          {selectedMessage.name}
                        </h2>
                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="font-mono-ui text-[13px] text-[var(--acento-texto)] hover:underline"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">
                        {TYPE_LABELS[selectedMessage.type] || selectedMessage.type}
                      </Badge>
                      <Badge variant="status" status={selectedMessage.status} />
                      <span className="font-mono-ui flex items-center gap-1 text-[11px] text-[var(--texto-suave)]">
                        <Clock size={13} />
                        {formatDateTime(selectedMessage.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta estructurada de metadatos extra JSONB */}
                  {renderExtraMetadata(selectedMessage)}

                  {/* Cuerpo del mensaje original */}
                  <div className="space-y-2 rounded-[14px] border border-[var(--borde)] bg-[var(--superficie-alta)]/60 p-4">
                    {selectedMessage.subject && (
                      <h3 className="font-sans-ui text-[14px] font-semibold text-[var(--texto)]">
                        Asunto: {selectedMessage.subject}
                      </h3>
                    )}
                    <p className="font-sans-ui text-[14px] leading-relaxed whitespace-pre-wrap text-[var(--texto)]">
                      {selectedMessage.body}
                    </p>
                  </div>

                  {/* Historial de respuestas enviadas */}
                  {Array.isArray(selectedMessage.replies) && selectedMessage.replies.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-mono-ui text-[11px] uppercase tracking-wider text-[var(--texto-suave)]">
                        Historial de Respuestas Enviadas ({selectedMessage.replies.length})
                      </h3>
                      <div className="space-y-3">
                        {selectedMessage.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className="space-y-2 rounded-[14px] border border-emerald-500/25 bg-emerald-500/10 p-4"
                          >
                            <div className="flex items-center justify-between text-[12px]">
                              <span className="font-sans-ui flex items-center gap-1.5 font-semibold text-emerald-300">
                                <CheckCircle2 size={14} />
                                {rep.author_name || 'Administrador'}
                              </span>
                              <span className="font-mono-ui text-[var(--texto-suave)]">
                                {formatDateTime(rep.created_at)}
                              </span>
                            </div>
                            <p className="font-sans-ui text-[13px] whitespace-pre-wrap text-[var(--texto)]">
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
                    className="space-y-4 border-t border-[var(--borde)] pt-4"
                  >
                    <div>
                      <label
                        htmlFor="reply-body"
                        className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]"
                      >
                        Responder por correo electrónico a {selectedMessage.name}
                      </label>
                      <textarea
                        id="reply-body"
                        rows={5}
                        placeholder="Escribe aquí tu respuesta profesional. Se enviará por email al remitente y quedará registrada en este hilo..."
                        {...register('body')}
                        className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] placeholder:text-[var(--texto-suave)] focus:border-[var(--acento)] focus:outline-none"
                      />
                      {errors.body && (
                        <p className="font-sans-ui mt-1.5 text-[12px] text-red-400">
                          {errors.body.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
                        Al enviar, el estado pasará automáticamente a <strong>Respondido</strong>.
                      </span>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="font-sans-ui inline-flex cursor-pointer items-center gap-2 rounded-[12px] bg-[var(--acento)] px-4 py-2.5 text-[14px] font-semibold text-[var(--sobre-acento)] transition-opacity hover:opacity-95 disabled:opacity-50"
                      >
                        <Send size={16} />
                        {isSubmitting ? 'Enviando correo...' : 'Enviar respuesta'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </DataState>
          </div>
        )}
      </div>
    </div>
  );
}
