import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  UserCheck,
  Mail,
  FolderKanban,
  Plus,
  UserCircle,
  Briefcase,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import DataState from '../../../components/ui/DataState.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';

const TYPE_LABELS = {
  consulta: 'Consulta general',
  cotizacion: 'Cotización',
  asesoria: 'Asesoría',
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [summary, setSummary] = useState({
    kpis: {
      totalSessions: 0,
      authenticatedSessions: 0,
      pendingMessages: 0,
      publishedProjects: 0,
    },
    recentMessages: [],
  });

  const loadSummary = useCallback(async () => {
    setStatus('cargando');
    setErrorMsg('');
    try {
      const res = await apiFetch('/metrics/summary');
      if (res?.data) {
        setSummary(res.data);
      }
      setStatus('con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cargar el resumen operativo.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSummary();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSummary]);

  const kpiCards = [
    {
      label: 'Sesiones únicas totales',
      sublabel: 'Últimos 30 días',
      value: summary.kpis.totalSessions,
      icon: Activity,
      to: '/admin/metricas',
    },
    {
      label: 'Sesiones autenticadas',
      sublabel: 'Últimos 30 días',
      value: summary.kpis.authenticatedSessions,
      icon: UserCheck,
      to: '/admin/metricas',
    },
    {
      label: 'Mensajes pendientes',
      sublabel: 'En estado «Nuevo»',
      value: summary.kpis.pendingMessages,
      icon: Mail,
      to: '/admin/mensajes?status=nuevo',
    },
    {
      label: 'Proyectos publicados',
      sublabel: 'Visibles en el sitio',
      value: summary.kpis.publishedProjects,
      icon: FolderKanban,
      to: '/admin/proyectos',
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      {/* Cabecera y Accesos Rápidos */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-[26px] font-bold tracking-tight text-[var(--texto)]">
            Resumen Operativo
          </h1>
          <p className="font-sans-ui mt-1 text-[14px] text-[var(--texto-suave)]">
            Panorama general de actividad, consultas pendientes y accesos directos de edición.
          </p>
        </div>

        {/* Accesos Rápidos */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate('/admin/proyectos/nuevo')}
            className="!px-4 !py-2.5 !text-[13px]"
          >
            <Plus size={16} />
            <span>Nuevo proyecto</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/servicios/nuevo')}
            className="!px-4 !py-2.5 !text-[13px]"
          >
            <Briefcase size={15} />
            <span>Nuevo servicio</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/perfil')}
            className="!px-4 !py-2.5 !text-[13px]"
          >
            <UserCircle size={15} />
            <span>Editar perfil</span>
          </Button>
        </div>
      </div>

      <DataState
        status={status}
        skeletonType="cards"
        errorMessage={errorMsg}
        onRetry={loadSummary}
      >
        {/* 4 Tarjetas KPI (Últimos 30 días) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                to={card.to}
                className="group flex flex-col justify-between rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-5 transition-colors hover:border-[var(--acento)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans-ui text-[13px] font-medium text-[var(--texto-suave)]">
                    {card.label}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--tile-icono-bg)] text-[var(--acento-texto)]">
                    <Icon size={18} />
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-heading text-[32px] font-bold leading-none text-[var(--texto)]">
                    {card.value}
                  </span>
                  <span className="font-mono-ui text-[11px] text-[var(--texto-suave)] group-hover:text-[var(--acento-texto)]">
                    {card.sublabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bandeja Rápida de Mensajes Nuevos */}
        <div className="overflow-hidden rounded-[18px] border border-[var(--borde)] bg-[var(--superficie)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--superficie-alta)] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Mail size={18} className="text-[var(--acento-texto)]" />
              <h2 className="font-heading text-[17px] font-bold text-[var(--texto)]">
                Bandeja rápida de mensajes nuevos
              </h2>
              <Badge variant="status" status="nuevo">
                {summary.kpis.pendingMessages} nuevos
              </Badge>
            </div>

            <Link
              to="/admin/mensajes"
              className="font-sans-ui inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--acento-texto)] hover:underline"
            >
              <span>Ver bandeja completa</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {summary.recentMessages.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-sans-ui text-[14px] font-medium text-[var(--texto)]">
                No tienes mensajes pendientes de lectura
              </p>
              <p className="font-sans-ui mt-1 text-[13px] text-[var(--texto-suave)]">
                Todas las consultas recientes fueron revisadas o respondidas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--borde)]">
              {summary.recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  to={`/admin/mensajes/${msg.id}`}
                  className="flex flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--superficie-alta)]/60 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans-ui truncate text-[14px] font-semibold text-[var(--texto)]">
                        {msg.name}
                      </span>
                      <span className="font-mono-ui text-[12px] text-[var(--texto-suave)]">
                        &lt;{msg.email}&gt;
                      </span>
                      <Badge variant="neutral">
                        {TYPE_LABELS[msg.type] || msg.type}
                      </Badge>
                    </div>
                    <p className="font-sans-ui mt-1 truncate text-[13px] text-[var(--texto-suave)]">
                      {msg.subject}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="status" status={msg.status} />
                    <span className="font-mono-ui inline-flex items-center gap-1 text-[11px] text-[var(--texto-suave)]">
                      <Clock size={12} />
                      {new Date(msg.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    <ArrowRight size={15} className="text-[var(--texto-suave)]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}
