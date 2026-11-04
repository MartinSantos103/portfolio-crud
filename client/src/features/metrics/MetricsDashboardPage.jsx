import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Activity,
  UserCheck,
  Mail,
  TrendingUp,
  UserPlus,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  FolderKanban,
  Info,
} from 'lucide-react';
import { apiFetch } from '../../services/api.js';
import DataState from '../../components/ui/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';

const PIE_COLORS = ['#7c5cff', '#38bdf8', '#10b981'];

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPresetDates(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return {
    from: toIsoDate(start),
    to: toIsoDate(end),
  };
}

function formatBucketLabel(bucketStr, groupBy) {
  if (!bucketStr) return '';
  const parts = bucketStr.split('-');
  if (parts.length < 3) return bucketStr;
  const [year, month, day] = parts;
  if (groupBy === 'month') {
    return `${month}/${year}`;
  }
  return `${day}/${month}`;
}

function ChartEmptyState({ message = 'Sin actividad registrada en las fechas seleccionadas.' }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--borde)] bg-[var(--superficie-alta)]/35 p-6 text-center">
      <BarChart3 size={28} className="text-[var(--texto-suave)] opacity-60" />
      <p className="font-sans-ui mt-2 max-w-xs text-[13px] text-[var(--texto-suave)]">
        {message}
      </p>
    </div>
  );
}

export default function MetricsDashboardPage() {
  const initialRange = useMemo(() => getPresetDates(30), []);

  const [preset, setPreset] = useState('30d');
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);
  const [groupBy, setGroupBy] = useState('day');
  const [projectSegment, setProjectSegment] = useState('all');

  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [metrics, setMetrics] = useState({
    filters: {
      from: initialRange.from,
      to: initialRange.to,
      groupBy: 'day',
      diffDays: 30,
      projectSegment: 'all',
      timezone: 'America/Argentina/Salta',
    },
    kpis: {
      totalSessions: 0,
      authenticatedSessions: 0,
      totalMessages: 0,
      conversionRate: 0,
      newUsers: 0,
    },
    sessionsSeries: [],
    usersSeries: [],
    messagesDistribution: [],
    topProjects: [],
  });

  // Cálculo de días del rango para regla automática de legibilidad (> 90 días deshabilita 'day')
  const diffDays = useMemo(() => {
    const startMs = new Date(`${fromDate}T00:00:00Z`).getTime();
    const endMs = new Date(`${toDate}T23:59:59Z`).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 30;
    return Math.max(Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)), 1);
  }, [fromDate, toDate]);

  const isDayDisabled = diffDays > 90;
  const effectiveGroupBy = isDayDisabled && groupBy === 'day' ? 'week' : groupBy;

  const applyPreset = (key, days, suggestedGroup) => {
    const range = getPresetDates(days);
    setPreset(key);
    setFromDate(range.from);
    setToDate(range.to);
    setGroupBy(suggestedGroup);
  };

  const fetchMetrics = useCallback(async () => {
    setStatus('cargando');
    setErrorMsg('');
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        groupBy: effectiveGroupBy,
        projectSegment,
      });

      const res = await apiFetch(`/metrics?${params.toString()}`);
      if (res?.data) {
        setMetrics(res.data);
      }
      setStatus('con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudieron consultar las métricas analíticas.');
      setStatus('error');
    }
  }, [fromDate, toDate, effectiveGroupBy, projectSegment]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMetrics();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMetrics]);

  const hasSessionsActivity = useMemo(
    () =>
      metrics.sessionsSeries.some(
        (r) => (r.visitas_generales || 0) > 0 || (r.visitas_autenticadas || 0) > 0
      ),
    [metrics.sessionsSeries]
  );

  const hasUsersActivity = useMemo(
    () => metrics.usersSeries.some((r) => (r.nuevos_usuarios || 0) > 0),
    [metrics.usersSeries]
  );

  const hasMessagesActivity = useMemo(
    () => metrics.messagesDistribution.some((r) => (r.count || 0) > 0),
    [metrics.messagesDistribution]
  );

  const hasProjectsActivity = useMemo(
    () => metrics.topProjects.some((r) => (r.views || 0) > 0),
    [metrics.topProjects]
  );

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-[26px] font-bold tracking-tight text-[var(--texto)]">
              Métricas y Analíticas Interactivas
            </h1>
            <Badge variant="neutral">TZ: America/Argentina/Salta</Badge>
          </div>
          <p className="font-sans-ui mt-1 text-[14px] text-[var(--texto-suave)]">
            Exploración temporal de sesiones únicas, conversión a contacto y proyectos más visitados.
          </p>
        </div>
      </div>

      {/* Barra Superior de Controles de Exploración */}
      <div className="space-y-4 rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Presets rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-ui mr-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--texto-suave)]">
              <Calendar size={14} className="text-[var(--acento-texto)]" />
              Período:
            </span>
            {[
              { key: '7d', label: 'Últimos 7 días', days: 7, group: 'day' },
              { key: '30d', label: 'Últimos 30 días', days: 30, group: 'day' },
              { key: '90d', label: 'Últimos 90 días', days: 90, group: 'week' },
              { key: '12m', label: 'Últimos 12 meses', days: 365, group: 'month' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => applyPreset(item.key, item.days, item.group)}
                className={`font-sans-ui cursor-pointer rounded-[10px] border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  preset === item.key
                    ? 'border-[var(--acento)] bg-[var(--acento)] text-[var(--sobre-acento)]'
                    : 'border-[var(--borde)] bg-[var(--superficie-alta)] text-[var(--texto-suave)] hover:text-[var(--texto)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Selector de Agrupación Temporal */}
          <div className="flex items-center gap-2">
            <span className="font-mono-ui text-[11px] uppercase tracking-wider text-[var(--texto-suave)]">
              Agrupar por:
            </span>
            <div className="inline-flex rounded-[10px] border border-[var(--borde)] bg-[var(--superficie-alta)] p-1">
              {[
                { key: 'day', label: 'Por Día', disabled: isDayDisabled },
                { key: 'week', label: 'Por Semana', disabled: false },
                { key: 'month', label: 'Por Mes', disabled: false },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => setGroupBy(opt.key)}
                  title={
                    opt.disabled
                      ? 'Deshabilitado para rangos mayores a 90 días para preservar legibilidad'
                      : undefined
                  }
                  className={`font-sans-ui cursor-pointer rounded-[8px] px-3 py-1 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    effectiveGroupBy === opt.key
                      ? 'bg-[var(--acento)] text-[var(--sobre-acento)]'
                      : 'text-[var(--texto-suave)] hover:text-[var(--texto)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rango personalizado Desde / Hasta */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--borde)] pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="font-sans-ui flex items-center gap-2 text-[12px] text-[var(--texto-suave)]">
              <span>Desde:</span>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => {
                  setPreset('custom');
                  setFromDate(e.target.value);
                }}
                className="font-mono-ui rounded-[8px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-2.5 py-1 text-[12px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
              />
            </label>

            <label className="font-sans-ui flex items-center gap-2 text-[12px] text-[var(--texto-suave)]">
              <span>Hasta:</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => {
                  setPreset('custom');
                  setToDate(e.target.value);
                }}
                className="font-mono-ui rounded-[8px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-2.5 py-1 text-[12px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
              />
            </label>
          </div>

          {isDayDisabled && (
            <span className="font-sans-ui inline-flex items-center gap-1.5 text-[12px] text-amber-300">
              <Info size={14} />
              Rango de {diffDays} días (&gt; 90 días): agrupación diaria cambiada automáticamente a semanal/mensual.
            </span>
          )}
        </div>
      </div>

      <DataState
        status={status}
        skeletonType="cards"
        errorMessage={errorMsg}
        onRetry={fetchMetrics}
      >
        {/* Resumen de KPIs del Período */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans-ui text-[12px] font-medium text-[var(--texto-suave)]">
                Sesiones Totales
              </span>
              <Activity size={16} className="text-[var(--acento-texto)]" />
            </div>
            <div className="font-heading mt-3 text-[28px] font-bold text-[var(--texto)]">
              {metrics.kpis.totalSessions}
            </div>
            <span className="font-mono-ui text-[11px] text-[var(--texto-suave)]">
              COUNT(DISTINCT session_id)
            </span>
          </div>

          <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans-ui text-[12px] font-medium text-[var(--texto-suave)]">
                Sesiones Autenticadas
              </span>
              <UserCheck size={16} className="text-[var(--acento-texto)]" />
            </div>
            <div className="font-heading mt-3 text-[28px] font-bold text-[var(--texto)]">
              {metrics.kpis.authenticatedSessions}
            </div>
            <span className="font-mono-ui text-[11px] text-[var(--texto-suave)]">
              Usuarios con sesión activa
            </span>
          </div>

          <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans-ui text-[12px] font-medium text-[var(--texto-suave)]">
                Consultas Recibidas
              </span>
              <Mail size={16} className="text-[var(--acento-texto)]" />
            </div>
            <div className="font-heading mt-3 text-[28px] font-bold text-[var(--texto)]">
              {metrics.kpis.totalMessages}
            </div>
            <span className="font-mono-ui text-[11px] text-[var(--texto-suave)]">
              En el período filtrado
            </span>
          </div>

          <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans-ui text-[12px] font-medium text-[var(--texto-suave)]">
                Tasa de Conversión
              </span>
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div className="font-heading mt-3 text-[28px] font-bold text-emerald-400">
              {metrics.kpis.conversionRate}%
            </div>
            <span className="font-mono-ui text-[11px] text-[var(--texto-suave)]">
              (Mensajes / Sesiones) × 100
            </span>
          </div>

          <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans-ui text-[12px] font-medium text-[var(--texto-suave)]">
                Nuevos Usuarios
              </span>
              <UserPlus size={16} className="text-[var(--acento-texto)]" />
            </div>
            <div className="font-heading mt-3 text-[28px] font-bold text-[var(--texto)]">
              {metrics.kpis.newUsers}
            </div>
            <span className="font-mono-ui text-[11px] text-[var(--texto-suave)]">
              Registros con rol «user»
            </span>
          </div>
        </div>

        {/* Grilla de 4 Gráficos Interactivos Recharts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 1. Evolución de Sesiones en el Tiempo (AreaChart de 2 series) */}
          <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-heading text-[16px] font-bold text-[var(--texto)]">
                  1. Evolución de Sesiones en el Tiempo
                </h2>
                <p className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
                  Comparativa de sesiones únicas totales frente a sesiones autenticadas.
                </p>
              </div>
              <Activity size={18} className="text-[var(--acento-texto)]" />
            </div>

            {!hasSessionsActivity ? (
              <ChartEmptyState message="Sin sesiones registradas en el rango de fechas seleccionado." />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={metrics.sessionsSeries}
                    margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradTotalSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#7c5cff" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradAuthSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.14)" />
                    <XAxis
                      dataKey="bucket"
                      tickFormatter={(val) => formatBucketLabel(val, metrics.filters.groupBy)}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--superficie)',
                        borderColor: 'var(--borde)',
                        borderRadius: '12px',
                        color: 'var(--texto)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="visitas_generales"
                      name="Sesiones Totales"
                      stroke="#7c5cff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradTotalSessions)"
                    />
                    <Area
                      type="monotone"
                      dataKey="visitas_autenticadas"
                      name="Sesiones Autenticadas"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradAuthSessions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 2. Nuevos Usuarios Registrados por Período (BarChart) */}
          <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-heading text-[16px] font-bold text-[var(--texto)]">
                  2. Nuevos Usuarios Registrados por Período
                </h2>
                <p className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
                  Crecimiento de cuentas registradas con rol «user» en el tiempo.
                </p>
              </div>
              <UserPlus size={18} className="text-[var(--acento-texto)]" />
            </div>

            {!hasUsersActivity ? (
              <ChartEmptyState message="No hubo nuevos registros de usuarios en las fechas seleccionadas." />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={metrics.usersSeries}
                    margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.14)" />
                    <XAxis
                      dataKey="bucket"
                      tickFormatter={(val) => formatBucketLabel(val, metrics.filters.groupBy)}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--superficie)',
                        borderColor: 'var(--borde)',
                        borderRadius: '12px',
                        color: 'var(--texto)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="nuevos_usuarios"
                      name="Nuevos Usuarios"
                      fill="#38bdf8"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 3. Distribución por Tipo de Consulta (PieChart Donut con leyenda) */}
          <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-heading text-[16px] font-bold text-[var(--texto)]">
                  3. Distribución por Tipo de Consulta
                </h2>
                <p className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
                  Proporción de solicitudes de Cotización, Consulta General y Asesoría.
                </p>
              </div>
              <PieChartIcon size={18} className="text-[var(--acento-texto)]" />
            </div>

            {!hasMessagesActivity ? (
              <ChartEmptyState message="Sin consultas ni mensajes recibidos en el rango seleccionado." />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.messagesDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={95}
                      paddingAngle={4}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                    >
                      {metrics.messagesDistribution.map((entry, idx) => (
                        <Cell
                          key={`cell-${entry.type}`}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} (${props.payload.percentage}%)`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: 'var(--superficie)',
                        borderColor: 'var(--borde)',
                        borderRadius: '12px',
                        color: 'var(--texto)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 4. Ranking de Proyectos Más Vistos (BarChart horizontal con filtro local) */}
          <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-5">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-heading text-[16px] font-bold text-[var(--texto)]">
                  4. Ranking de Proyectos Más Vistos
                </h2>
                <p className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
                  Eventos <code>project_view</code> agrupados por proyecto.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <FolderKanban size={16} className="text-[var(--acento-texto)]" />
                <select
                  aria-label="Filtrar ranking de proyectos por audiencia"
                  value={projectSegment}
                  onChange={(e) => setProjectSegment(e.target.value)}
                  className="font-sans-ui rounded-[8px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-2.5 py-1.5 text-[12px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
                >
                  <option value="all">Todos los visitantes</option>
                  <option value="authenticated">Solo usuarios registrados</option>
                </select>
              </div>
            </div>

            {!hasProjectsActivity ? (
              <ChartEmptyState message="Sin visualizaciones de detalle de proyectos en el período y segmento elegidos." />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={metrics.topProjects}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.14)" />
                    <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="title"
                      width={130}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(val) =>
                        val && val.length > 18 ? `${val.slice(0, 18)}…` : val
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--superficie)',
                        borderColor: 'var(--borde)',
                        borderRadius: '12px',
                        color: 'var(--texto)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="views"
                      name="Vistas al proyecto"
                      fill="#7c5cff"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </DataState>
    </div>
  );
}
