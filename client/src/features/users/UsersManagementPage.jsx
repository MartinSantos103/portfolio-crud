import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { apiFetch } from '../../services/api.js';
import { useAuth } from '../auth/index.js';
import { useToast } from '../../components/ui/Toast.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import DataState from '../../components/ui/DataState.jsx';

function formatDate(dateStr) {
  if (!dateStr) return 'Nunca';
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

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

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
      if (roleFilter) params.set('role', roleFilter);
      if (activeFilter !== '') params.set('active', activeFilter);

      const res = await apiFetch(`/users?${params.toString()}`);
      const items = res.data || [];
      setUsers(items);
      setPagination(res.pagination || { page: 1, limit: 20, total: items.length, totalPages: 1 });
      setStatus(items.length === 0 ? 'sin_datos' : 'con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cargar el listado de usuarios.');
      setStatus('error');
    }
  }, [page, debouncedSearch, roleFilter, activeFilter]);

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
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      toast.success(successMessage);
      setPendingAction(null);
    } catch (err) {
      toast.error(
        err.message || 'No se pudo actualizar los permisos o estado del usuario.'
      );
      setPendingAction(null);
    } finally {
      setSubmittingAction(false);
    }
  };

  const requestRoleChange = (targetUser, newRole) => {
    if (targetUser.role === newRole) return;
    setPendingAction({
      targetUser,
      payload: { role: newRole },
      title: newRole === 'admin' ? 'Promover a Administrador' : 'Revocar rol de Administrador',
      description:
        newRole === 'admin'
          ? `¿Confirmas otorgar permisos completos de Administrador a "${targetUser.name}" (${targetUser.email})? Podrá editar todo el contenido del portafolio.`
          : `¿Confirmas cambiar el rol de "${targetUser.name}" (${targetUser.email}) a Usuario Registrado estándar? Perderá el acceso al panel de administración.`,
      confirmLabel: newRole === 'admin' ? 'Sí, promover a Admin' : 'Sí, cambiar a Usuario',
      tone: newRole === 'admin' ? 'warning' : 'danger',
      successMessage: `Rol de ${targetUser.name} actualizado a ${
        newRole === 'admin' ? 'Administrador' : 'Usuario'
      }`,
    });
  };

  const requestToggleActive = (targetUser) => {
    const nextActive = !targetUser.active;
    setPendingAction({
      targetUser,
      payload: { active: nextActive },
      title: nextActive ? 'Reactivar cuenta de usuario' : 'Suspender cuenta de usuario',
      description: nextActive
        ? `¿Deseas reactivar el acceso para "${targetUser.name}" (${targetUser.email})?`
        : `¿Estás seguro de desactivar la cuenta de "${targetUser.name}" (${targetUser.email})? Su sesión actual quedará invalidada y no podrá iniciar sesión.`,
      confirmLabel: nextActive ? 'Reactivar cuenta' : 'Suspender cuenta',
      tone: nextActive ? 'warning' : 'danger',
      successMessage: nextActive
        ? `Cuenta de ${targetUser.name} reactivada`
        : `Cuenta de ${targetUser.name} suspendida`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-[26px] font-bold tracking-tight text-[var(--texto)]">
            Gestión de Usuarios y Roles
          </h1>
          <p className="font-sans-ui mt-1 text-[14px] text-[var(--texto-suave)]">
            Control de cuentas registradas, niveles de acceso y prevención de autobloqueo.
          </p>
        </div>

        <div className="font-sans-ui inline-flex items-center gap-2 rounded-[12px] border border-[var(--borde)] bg-[var(--superficie)] px-3.5 py-2 text-[13px] text-[var(--texto-suave)]">
          <Users size={16} className="text-[var(--acento-texto)]" />
          <span>
            Total registrados: <strong className="text-[var(--texto)]">{pagination.total}</strong>
          </span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col items-stretch gap-3 rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className=" absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--texto-suave)]"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o correo electrónico..."
            className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--superficie-alta)] py-2 pr-4 pl-10 text-[13px] text-[var(--texto)] placeholder:text-[var(--texto-suave)] focus:border-[var(--acento)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filtrar por rol"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="font-sans-ui rounded-[10px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-3 py-2 text-[13px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador (admin)</option>
            <option value="user">Usuario (user)</option>
          </select>

          <select
            aria-label="Filtrar por estado de cuenta"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="font-sans-ui rounded-[10px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-3 py-2 text-[13px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="overflow-hidden rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)]">
        <DataState
          status={status}
          errorMessage={errorMsg}
          onRetry={fetchUsers}
          skeletonRows={5}
          emptyTitle="No se encontraron usuarios"
          emptyDescription="No hay cuentas registradas que coincidan con los criterios de búsqueda o filtrado."
          emptyActionLabel={
            searchInput || roleFilter || activeFilter !== '' ? 'Limpiar filtros' : undefined
          }
          onEmptyAction={
            searchInput || roleFilter || activeFilter !== ''
              ? () => {
                  setSearchInput('');
                  setDebouncedSearch('');
                  setRoleFilter('');
                  setActiveFilter('');
                  setPage(1);
                }
              : undefined
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="font-mono-ui border-b border-[var(--borde)] bg-[var(--superficie-alta)] text-[11px] uppercase tracking-wider text-[var(--texto-suave)]">
                  <th className="px-4 py-3.5">Usuario / Correo</th>
                  <th className="px-4 py-3.5">Origen</th>
                  <th className="px-4 py-3.5">Registro</th>
                  <th className="px-4 py-3.5">Último acceso</th>
                  <th className="px-4 py-3.5">Rol</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--borde)] text-[13px]">
                {users.map((u) => {
                  const isSelf = Number(currentUser?.id) === Number(u.id);

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-[var(--superficie-alta)]/50"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="font-sans-ui flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--borde)] bg-[var(--superficie-alta)] text-[12px] font-semibold text-[var(--acento-texto)]">
                            {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-sans-ui truncate font-semibold text-[var(--texto)]">
                                {u.name}
                              </span>
                              {isSelf && <Badge variant="neutral">Tú (Sesión actual)</Badge>}
                            </div>
                            <div className="font-mono-ui truncate text-[12px] text-[var(--texto-suave)]">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant="neutral">{u.origin || 'Local'}</Badge>
                      </td>

                      <td className="font-mono-ui px-4 py-3.5 text-[12px] text-[var(--texto-suave)]">
                        {formatDate(u.created_at)}
                      </td>

                      <td className="font-mono-ui px-4 py-3.5 text-[12px] text-[var(--texto-suave)]">
                        {formatDate(u.last_login_at)}
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          aria-label={`Cambiar rol de ${u.name}`}
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => requestRoleChange(u, e.target.value)}
                          title={
                            isSelf
                              ? 'Por seguridad no puedes degradar tu propio rol de administrador'
                              : 'Cambiar nivel de acceso'
                          }
                          className="font-sans-ui rounded-[8px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="user">Usuario (user)</option>
                          <option value="admin">Administrador (admin)</option>
                        </select>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant="status" status={u.active ? 'activo' : 'inactivo'}>{u.active ? 'Activo' : 'Inactivo'}</Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {isSelf ? (
                          <span
                            className="font-sans-ui inline-flex items-center gap-1 text-[12px] text-[var(--texto-suave)]"
                            title="Protección anti-autobloqueo activa"
                          >
                            <Lock size={14} />
                            Protegido
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => requestToggleActive(u)}
                            className={`font-sans-ui inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                              u.active
                                ? 'border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                                : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            }`}
                          >
                            {u.active ? (
                              <>
                                <UserX size={14} />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} />
                                Activar
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
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
              Página {pagination.page} de {pagination.totalPages || 1} ({pagination.total} usuarios)
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

      {/* Nota informativa de seguridad */}
      <div className="font-sans-ui flex items-start gap-3 rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4 text-[12px] text-[var(--texto-suave)]">
        <Shield size={16} className="mt-0.5 shrink-0 text-[var(--acento-texto)]" />
        <div>
          <strong className="text-[var(--texto)]">
            Reglas de Seguridad e Integridad Activas:
          </strong>{' '}
          El servidor impide automáticamente que desactives tu propia cuenta o revoques tu propio rol de administrador (<code>400 Bad Request</code>), así como eliminar o degradar al último administrador activo del sistema (<code>409 Conflict</code>).
        </div>
      </div>

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
