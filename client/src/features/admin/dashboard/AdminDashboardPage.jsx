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
      isAccent: true,
    },
    {
      label: 'Sesiones autenticadas',
      sublabel: 'Últimos 30 días',
      value: summary.kpis.authenticatedSessions,
      icon: UserCheck,
      to: '/admin/metricas',
      isAccent: false,
    },
    {
      label: 'Mensajes pendientes',
      sublabel: 'En estado «Nuevo»',
      value: summary.kpis.pendingMessages,
      icon: Mail,
      to: '/admin/mensajes?status=nuevo',
      isAccent: false,
    },
    {
      label: 'Proyectos publicados',
      sublabel: 'Visibles en el sitio',
      value: summary.kpis.publishedProjects,
      icon: FolderKanban,
      to: '/admin/proyectos',
      isAccent: false,
    },
  ];

  return (
    <div id="v-resumen" className="adm-view is-on flex flex-col gap-5">
      {/* Cabecera estelar y Accesos Rápidos */}
      <div className="adm-pagehead">
        <div className="adm-pagehead-left">
          <span className="adm-planet-orb" aria-hidden="true" />
          <div>
            <h1 className="adm-h1">Resumen Operativo</h1>
            <p className="adm-sub">
              Panorama general de actividad, consultas pendientes y accesos directos de edición.
            </p>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="adm-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/proyectos/nuevo')}
            className="adm-btn primary"
          >
            <Plus size={16} />
            <span>Nuevo proyecto</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/servicios/nuevo')}
            className="adm-btn secondary"
          >
            <Briefcase size={15} />
            <span>Nuevo servicio</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/perfil')}
            className="adm-btn secondary"
          >
            <UserCircle size={15} />
            <span>Editar perfil</span>
          </button>
        </div>
      </div>

      <DataState
        status={status}
        skeletonType="cards"
        errorMessage={errorMsg}
        onRetry={loadSummary}
      >
        {/* 4 Tarjetas KPI (Últimos 30 días) */}
        <section className="adm-grid-kpi">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                to={card.to}
                className={`adm-kpi group ${card.isAccent ? 'is-accent' : ''}`}
              >
                <div className="adm-kpi-top">
                  <span>{card.label}</span>
                  <span className="adm-ico">
                    <Icon size={17} />
                  </span>
                </div>

                <div className="adm-kpi-bot">
                  <span className="adm-kpi-value">{card.value}</span>
                  <span className="adm-kpi-note group-hover:text-[var(--ac2)]">
                    {card.sublabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        {/* Bandeja Rápida de Mensajes Nuevos */}
        <section className="adm-card flush mt-1">
          <div className="adm-card-bar">
            <Mail size={18} className="text-[var(--ac2)]" />
            <h2 className="adm-h2">Bandeja rápida de mensajes nuevos</h2>
            <Badge variant="status" status="nuevo">
              {summary.kpis.pendingMessages} nuevos
            </Badge>

            <Link
              to="/admin/mensajes"
              className="adm-link inline-flex items-center gap-1.5"
            >
              <span>Ver bandeja completa</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {summary.recentMessages.length === 0 ? (
            <div className="adm-empty">
              <strong>No tienes mensajes pendientes de lectura</strong>
              Todas las consultas recientes fueron revisadas o respondidas.
            </div>
          ) : (
            <div>
              {summary.recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  to={`/admin/mensajes/${msg.id}`}
                  className="adm-msg-row"
                >
                  <div className="top">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--adm-texto)]">
                        {msg.name}
                      </span>
                      <span className="adm-mono">&lt;{msg.email}&gt;</span>
                    </div>
                    <span className="adm-mono inline-flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(msg.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <p className="truncate text-[13.5px] text-[var(--adm-texto-suave)]">
                    {msg.subject}
                  </p>

                  <div className="bot">
                    <span className="adm-chip">
                      {TYPE_LABELS[msg.type] || msg.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="status" status={msg.status} />
                      <ArrowRight size={14} className="text-[var(--adm-texto-suave)]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </DataState>
    </div>
  );
}
