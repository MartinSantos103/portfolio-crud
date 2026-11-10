import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  ArrowUp,
  ArrowDown,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiFetch } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import DataState from '../../components/ui/DataState.jsx';
import UserDetailCardModal from './components/UserDetailCardModal.jsx';

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

export default function UsersManagementPage() {
  const toast = useToast();

  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Ordenamiento y prioridad
  const [statusPriority, setStatusPriority] = useState('habilitada'); // 'habilitada' | 'suspendida'
  const [activeDateSort, setActiveDateSort] = useState('registro'); // 'registro' | 'consulta'
  const [registroOrder, setRegistroOrder] = useState('desc'); // 'desc' | 'asc' (descendente por defecto)
  const [consultaOrder, setConsultaOrder] = useState('desc'); // 'desc' | 'asc'

  // Selected user for detail card modal
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Confirm modal state
  const [pendingAction, setPendingAction] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setStatus('cargando');
    setErrorMsg('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status_priority: statusPriority,
        sort_by: activeDateSort,
        order: activeDateSort === 'registro' ? registroOrder : consultaOrder,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await apiFetch(`/users?${params.toString()}`);
      // El Admin nunca aparece en los registros de usuarios
      const items = (res.data || []).filter((u) => u.role !== 'admin');
      setUsers(items);
      setPagination(
        res.pagination || {
          page: 1,
          limit: 20,
          total: items.length,
          totalPages: 1,
        }
      );
      setStatus(items.length === 0 ? 'sin_datos' : 'con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cargar el listado de usuarios.');
      setStatus('error');
    }
  }, [
    page,
    debouncedSearch,
    statusPriority,
    activeDateSort,
    registroOrder,
    consultaOrder,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setSubmittingAction(true);
    try {
      const { targetUser, payload, successMessage } = pendingAction;
      const res = await apiFetch(`/users/${targetUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const updated = res.data;
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
      );
      toast.success(successMessage);
      setPendingAction(null);
    } catch (err) {
      toast.error(
        err.message || 'No se pudo actualizar el estado de la cuenta del usuario.'
      );
      setPendingAction(null);
    } finally {
      setSubmittingAction(false);
    }
  };

  const requestToggleActive = (targetUser) => {
    const nextActive = !targetUser.active;
    setPendingAction({
      targetUser,
      payload: { active: nextActive },
      title: nextActive
        ? 'Reactivar cuenta de usuario'
        : 'Suspender cuenta de usuario',
      description: nextActive
        ? `¿Deseas reactivar la cuenta de "${targetUser.name}" (${targetUser.email})? El usuario volverá a tener permiso para iniciar sesión y enviar correos a través del programa.`
        : `¿Estás seguro de suspender la cuenta de "${targetUser.name}" (${targetUser.email})? Su sesión quedará invalidada, no podrá volver a registrarse y su correo no será válido para enviar consultas.`,
      confirmLabel: nextActive ? 'Reactivar cuenta' : 'Suspender cuenta',
      tone: nextActive ? 'success' : 'danger',
      successMessage: nextActive
        ? `Cuenta de ${targetUser.name} habilitada nuevamente`
        : `Cuenta de ${targetUser.name} suspendida`,
    });
  };

  const handleToggleStatusPriority = () => {
    setStatusPriority((prev) =>
      prev === 'habilitada' ? 'suspendida' : 'habilitada'
    );
    setPage(1);
  };

  const handleToggleRegistroSort = () => {
    if (activeDateSort === 'registro') {
      setRegistroOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setActiveDateSort('registro');
    }
    setPage(1);
  };

  const handleToggleConsultaSort = () => {
    if (activeDateSort === 'consulta') {
      setConsultaOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setActiveDateSort('consulta');
    }
    setPage(1);
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // 1. Prioridad de estado: el seleccionado en el botón tiene prioridad de aparición, el otro va al último
      const aPriority =
        (statusPriority === 'habilitada' ? a.active : !a.active) ? 0 : 1;
      const bPriority =
        (statusPriority === 'habilitada' ? b.active : !b.active) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;

      // 2. Ordenamiento de fechas: mutuamente excluyentes
      if (activeDateSort === 'registro') {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : -Infinity;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : -Infinity;
        return registroOrder === 'asc' ? timeA - timeB : timeB - timeA;
      } else {
        // 'consulta': si la fecha de ult consulta es - (null/undefined) se toma como el menor valor posible (-Infinity)
        const timeA = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : -Infinity;
        const timeB = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : -Infinity;
        return consultaOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
    });
  }, [
    users,
    statusPriority,
    activeDateSort,
    registroOrder,
    consultaOrder,
  ]);

  const selectedUser =
    selectedUserId !== null
      ? sortedUsers.find((u) => Number(u.id) === Number(selectedUserId)) || null
      : null;

  return (
    <div id="v-usuarios" className="adm-view is-on flex flex-col gap-5">
      {/* Header estelar */}
      <div className="adm-pagehead">
        <div className="adm-pagehead-left">
          <span className="adm-planet-orb" aria-hidden="true" />
          <div>
            <h1 className="adm-h1">Gestión de Usuarios</h1>
            <p className="adm-sub">
              Control de cuentas registradas, actividad en el sitio y estado de
              acceso o envío de correos. Haz clic en cualquier fila para ver la
              ficha completa del usuario.
            </p>
          </div>
        </div>

        <div className="adm-actions">
          <span className="adm-pill">
            <span className="dot" />
            Total usuarios:{' '}
            <b className="text-[var(--adm-texto)]">{pagination.total}</b>
          </span>
        </div>
      </div>

      {/* Barra de Búsqueda y Ordenamientos */}
      <section className="adm-card adm-toolbar">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--adm-texto-suave)]"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre de usuario o correo electrónico..."
            className="adm-input !pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón 1: Prioridad de Estado (sin flechas) */}
          <button
            type="button"
            onClick={handleToggleStatusPriority}
            className={`adm-btn sm font-medium transition-all ${
              statusPriority === 'habilitada' ? 'reactivate' : 'danger'
            }`}
            title="Alternar prioridad de estado (se muestran todos los usuarios)"
          >
            <span>
              {statusPriority === 'habilitada' ? 'Habilitada' : 'Suspendida'}
            </span>
          </button>

          {/* Botón 2: Fec. Registro con flecha */}
          <button
            type="button"
            onClick={handleToggleRegistroSort}
            className={`adm-btn sm flex items-center gap-1.5 transition-all ${
              activeDateSort === 'registro' ? 'primary' : 'secondary'
            }`}
            title={`Ordenar por Fecha de Registro (${
              registroOrder === 'asc'
                ? 'Ascendente (más antiguos primero)'
                : 'Descendente (más recientes primero)'
            })`}
          >
            <span>Fec. Registro</span>
            {registroOrder === 'asc' ? (
              <ArrowUp size={13} className="shrink-0" />
            ) : (
              <ArrowDown size={13} className="shrink-0" />
            )}
          </button>

          {/* Botón 3: Fec. Últ. Consulta con flecha */}
          <button
            type="button"
            onClick={handleToggleConsultaSort}
            className={`adm-btn sm flex items-center gap-1.5 transition-all ${
              activeDateSort === 'consulta' ? 'primary' : 'secondary'
            }`}
            title={`Ordenar por Fecha de Última Consulta (${
              consultaOrder === 'asc'
                ? 'Ascendente (sin consulta primero)'
                : 'Descendente (más recientes primero)'
            })`}
          >
            <span>Fec. Últ. Consulta</span>
            {consultaOrder === 'asc' ? (
              <ArrowUp size={13} className="shrink-0" />
            ) : (
              <ArrowDown size={13} className="shrink-0" />
            )}
          </button>
        </div>
      </section>

      {/* Tabla de Usuarios (Usuario, Correo, Estados, Acciones) */}
      <section className="adm-card flush">
        <DataState
          status={status}
          errorMessage={errorMsg}
          onRetry={fetchUsers}
          skeletonRows={5}
          emptyTitle="No se encontraron usuarios"
          emptyDescription="No hay cuentas de usuarios registradas que coincidan con los criterios de búsqueda o filtrado."
          emptyActionLabel={searchInput ? 'Limpiar búsqueda' : undefined}
          onEmptyAction={
            searchInput
              ? () => {
                  setSearchInput('');
                  setDebouncedSearch('');
                  setPage(1);
                }
              : undefined
          }
        >
          <div className="overflow-x-auto">
            <table className="adm-table flush">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Fecha de registro</th>
                  <th>Fecha de última consulta</th>
                  <th className="r">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="adm-empty">
                      No se encontraron usuarios que coincidan con los criterios.
                    </td>
                  </tr>
                )}
                {sortedUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    title="Haz clic para abrir la tarjeta con todos los detalles del usuario"
                    className="cursor-pointer transition-colors hover:bg-white/[0.04]"
                  >
                    <td>
                      <div className="adm-cell">
                        <div className="adm-avatar sm">
                          {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <b className="text-[var(--adm-texto)]">{u.name}</b>
                        </div>
                      </div>
                    </td>

                    <td className="adm-mono text-[13px] text-[var(--adm-texto-suave)]">
                      {u.email}
                    </td>

                    <td className="adm-mono text-[13px] text-[var(--adm-texto-suave)]">
                      {formatDateDDMMYYYY(u.created_at)}
                    </td>

                    <td className="adm-mono text-[13px] text-[var(--adm-texto-suave)]">
                      {formatDateDDMMYYYY(u.last_message_at)}
                    </td>

                    <td
                      className="r"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => requestToggleActive(u)}
                        className={`adm-btn sm ${
                          u.active ? 'danger' : 'reactivate'
                        }`}
                      >
                        {u.active ? (
                          <>
                            <UserX size={13} />
                            <span>Suspender</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={13} />
                            <span>Reactivar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
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
              {pagination.total} usuarios)
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

      {/* Card Modal de Detalle del Usuario */}
      <UserDetailCardModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUserId(null)}
        onToggleStatus={(u) => requestToggleActive(u)}
        updating={submittingAction}
      />

      <ConfirmModal
        isOpen={Boolean(pendingAction)}
        onCancel={() => !submittingAction && setPendingAction(null)}
        onConfirm={handleConfirmAction}
        title={pendingAction?.title || 'Confirmar cambio'}
        description={pendingAction?.description || ''}
        confirmLabel={pendingAction?.confirmLabel || 'Confirmar'}
        tone={pendingAction?.tone || 'danger'}
        loading={submittingAction}
      />
    </div>
  );
}
