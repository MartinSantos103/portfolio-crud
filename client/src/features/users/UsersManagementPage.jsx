import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Shield,
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
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

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
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (activeFilter !== '') params.set('active', activeFilter);

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
  }, [page, debouncedSearch, activeFilter]);

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

  const selectedUser =
    selectedUserId !== null
      ? users.find((u) => Number(u.id) === Number(selectedUserId)) || null
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

      {/* Barra de Búsqueda y Filtro de Estado */}
      <section className="adm-card adm-toolbar">
        <div className="relative flex-1">
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

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filtrar por estado de cuenta"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="adm-select !w-auto"
          >
            <option value="">Todos los estados</option>
            <option value="true">Habilitada (Con acceso)</option>
            <option value="false">Suspendida (Bloqueada)</option>
          </select>
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
          emptyActionLabel={
            searchInput || activeFilter !== '' ? 'Limpiar filtros' : undefined
          }
          onEmptyAction={
            searchInput || activeFilter !== ''
              ? () => {
                  setSearchInput('');
                  setDebouncedSearch('');
                  setActiveFilter('');
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
                {users.map((u) => (
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

      {/* Nota informativa de seguridad */}
      <section className="adm-card adm-note">
        <Shield size={16} className="mt-0.5 shrink-0 text-[var(--ac2)]" />
        <div>
          <b>Regla de Administrador Único y Suspensión de Cuentas:</b> El
          sistema admite únicamente un Administrador (el dueño del repositorio),
          quien está excluido de esta lista. Al <b>Suspender</b> a un usuario,
          su cuenta queda bloqueada para iniciar sesión, volver a registrarse o
          enviar correos mediante el formulario de contacto.
        </div>
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
