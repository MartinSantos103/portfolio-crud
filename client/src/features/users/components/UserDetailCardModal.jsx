import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Mail,
  Calendar,
  Clock,
  KeyRound,
  MessageSquare,
  ExternalLink,
  FolderKanban,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Badge from '../../../components/ui/Badge.jsx';

function formatDateDDMMYYYY(dateStr, fallback = '-') {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fallback;
  }
}

function formatDateTime(dateStr, fallback = 'Nunca') {
  if (!dateStr) return fallback;
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

export default function UserDetailCardModal({
  user,
  isOpen = false,
  onClose,
  onToggleStatus,
  updating = false,
}) {
  const navigate = useNavigate();
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !updating) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, updating, onClose]);

  if (!isOpen || !user) return null;

  const isGoogle =
    user.origin === 'Google' ||
    String(user.registration_type || '').toLowerCase().includes('google');
  const registrationTypeLabel =
    user.registration_type ||
    (isGoogle ? 'Cuenta de Google' : 'Contraseña (Local)');

  const messagesCount = Number(user.messages_count ?? 0);
  const viewedProjects = Array.isArray(user.viewed_projects) ? user.viewed_projects : [];
  const activityCount =
    user.unique_projects_viewed_count !== undefined
      ? Number(user.unique_projects_viewed_count)
      : viewedProjects.length || Number(user.projects_viewed_count ?? 0);
  const totalViews =
    user.total_views_count !== undefined
      ? Number(user.total_views_count)
      : Number(user.projects_viewed_count ?? 0) + Number(user.demos_viewed_count ?? 0);

  const handleGoToUserMessages = () => {
    onClose?.();
    navigate(`/admin/mensajes?search=${encodeURIComponent(user.email)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-card-modal-title"
      onClick={() => !updating && onClose?.()}
      className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/80 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-[580px] max-h-[90vh] rounded-[22px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)] shadow-[0_24px_64px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden"
      >
        {/* Cabecera fija de la Card */}
        <div className="shrink-0 flex items-start justify-between gap-4 p-5 sm:p-6 pb-4 border-b border-[var(--adm-borde)] bg-[var(--adm-superficie)]">
          <div className="flex items-center gap-3.5">
            <div className="adm-avatar flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[16px] font-bold">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  id="user-card-modal-title"
                  className="font-heading text-[20px] font-bold text-[var(--adm-texto)]"
                >
                  {user.name}
                </h2>
                <Badge
                  variant="status"
                  status={user.active ? 'habilitada' : 'suspendida'}
                >
                  {user.active ? 'Habilitada' : 'Suspendida'}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--adm-texto-suave)]">
                <Mail size={13} className="shrink-0 text-[var(--ac2)]" />
                <span className="adm-mono">{user.email}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            aria-label="Cerrar tarjeta de usuario"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie-alta)] text-[var(--adm-texto-suave)] transition-colors hover:border-[var(--ac)] hover:text-[var(--adm-texto)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo deslizable de la Card (con scroll suave) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Grilla de Información Principal: Tipo de registro, Fecha de registro, Último acceso */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[12px] border border-[var(--adm-borde)] bg-[var(--adm-superficie-alta)] p-3">
              <span className="adm-mono flex items-center gap-1.5 text-[11px] uppercase text-[var(--adm-texto-suave)]">
                <KeyRound size={12} className="text-[var(--ac2)]" />
                Tipo de registro
              </span>
              <span className="mt-1.5 block text-[13.5px] font-semibold text-[var(--adm-texto)]">
                {registrationTypeLabel}
              </span>
            </div>

            <div className="rounded-[12px] border border-[var(--adm-borde)] bg-[var(--adm-superficie-alta)] p-3">
              <span className="adm-mono flex items-center gap-1.5 text-[11px] uppercase text-[var(--adm-texto-suave)]">
                <Calendar size={12} className="text-[var(--ac2)]" />
                Fecha de registro
              </span>
              <span className="adm-mono mt-1.5 block text-[12.5px] font-medium text-[var(--adm-texto)]">
                {formatDateDDMMYYYY(user.created_at)}
              </span>
            </div>

            <div className="rounded-[12px] border border-[var(--adm-borde)] bg-[var(--adm-superficie-alta)] p-3">
              <span className="adm-mono flex items-center gap-1.5 text-[11px] uppercase text-[var(--adm-texto-suave)]">
                <Clock size={12} className="text-[var(--ac2)]" />
                Último acceso
              </span>
              <span className="adm-mono mt-1.5 block text-[12.5px] font-medium text-[var(--adm-texto)]">
                {formatDateTime(user.last_login_at, 'Sin ingresos registrados')}
              </span>
            </div>
          </div>

          {/* Bloque de Consultas Enviadas con redirección filtrada a Mensajes */}
          <div className="rounded-[14px] border border-[var(--adm-borde)] bg-[var(--adm-superficie-alta)] p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <span className="adm-mono flex items-center gap-1.5 text-[11px] tracking-wider uppercase text-[var(--ac2)]">
                  <MessageSquare size={13} />
                  Consultas enviadas
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-heading text-[20px] font-bold text-[var(--adm-texto)]">
                    {messagesCount}{' '}
                    {messagesCount === 1
                      ? 'consulta enviada'
                      : 'consultas enviadas'}
                  </span>
                </div>
                <p className="adm-mono text-[11.5px] text-[var(--adm-texto-suave)]">
                  {user.last_message_at
                    ? `Último mensaje: ${formatDateTime(user.last_message_at)}`
                    : 'Este usuario aún no ha enviado consultas desde el formulario.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToUserMessages}
                className="adm-btn secondary sm shrink-0"
              >
                <ExternalLink size={13} />
                <span>Ver en Mensajes</span>
              </button>
            </div>
          </div>

          {/* Bloque Unificado de Actividad en el Sitio (Clickeable con desglose interactivo) */}
          <div className="rounded-[14px] border border-[var(--adm-borde)] bg-[var(--adm-superficie-alta)] p-4 transition-colors">
            <button
              type="button"
              onClick={() => setIsActivityOpen((prev) => !prev)}
              className="w-full text-left flex items-center justify-between gap-3 cursor-pointer group"
              aria-expanded={isActivityOpen}
              title="Haz clic para ver la lista de proyectos y demos visualizados"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)] text-[var(--ac2)] group-hover:border-[var(--ac)] transition-colors">
                  <FolderKanban size={18} />
                </div>
                <div>
                  <span className="adm-mono block text-[11px] tracking-wider uppercase text-[var(--ac2)]">
                    Historial de actividad en el sitio
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                    <span className="font-heading text-[18px] font-bold text-[var(--adm-texto)]">
                      {activityCount}{' '}
                      {activityCount === 1
                        ? 'proyecto y demo explorado'
                        : 'proyectos y demos explorados'}
                    </span>
                    {totalViews > activityCount && (
                      <span className="text-[12px] text-[var(--adm-texto-suave)]">
                        ({totalViews} visualizaciones en total)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--adm-texto-suave)] group-hover:text-[var(--adm-texto)] transition-colors shrink-0">
                <span>{isActivityOpen ? 'Ocultar' : 'Ver detalle'}</span>
                {isActivityOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {/* Lista desplegable de proyectos explorados */}
            {isActivityOpen && (
              <div className="mt-3.5 pt-3.5 border-t border-[var(--adm-borde)] space-y-2">
                {viewedProjects.length > 0 ? (
                  viewedProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)] p-3 text-[13px]"
                    >
                      <div className="min-w-0">
                        <span className="block font-medium text-[var(--adm-texto)] truncate">
                          {p.title}
                        </span>
                        <span className="adm-mono block text-[11.5px] text-[var(--adm-texto-suave)]">
                          {p.last_viewed_at
                            ? `Última vista: ${formatDateTime(p.last_viewed_at)}`
                            : 'Visualizado'}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="adm-pill !text-[11px]">
                          {p.views_count}{' '}
                          {p.views_count === 1 ? 'vista' : 'vistas'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[12.5px] text-[var(--adm-texto-suave)] py-1">
                    Este usuario aún no ha visualizado proyectos ni demos en el sitio.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pie fijo de tarjeta con Acción Rápida directa */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-t border-[var(--adm-borde)] bg-[var(--adm-superficie)]">
          {user.active ? (
            <button
              type="button"
              onClick={() => onToggleStatus?.(user)}
              disabled={updating}
              className="adm-btn danger"
            >
              <UserX size={15} />
              <span>{updating ? 'Procesando...' : 'Suspender'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleStatus?.(user)}
              disabled={updating}
              className="adm-btn reactivate"
            >
              <UserCheck size={15} />
              <span>{updating ? 'Procesando...' : 'Reactivar'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="adm-btn secondary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
