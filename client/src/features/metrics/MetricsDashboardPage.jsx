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
import { useTheme } from '../../hooks/useTheme.js';
import DataState from '../../components/ui/DataState.jsx';

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
    <div className="adm-empty flex h-[280px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[var(--adm-borde)]">
      <BarChart3 size={26} className="mb-2 text-[var(--adm-texto-suave)] opacity-70" />
      <p className="max-w-xs text-[13px] text-[var(--adm-texto-suave)]">{message}</p>
    </div>
  );
}

export default function MetricsDashboardPage() {
  const { currentPalette } = useTheme();
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

  // Colores de gráficos sincronizados con la paleta de acento activa y semánticos fijos
  const accentColor = `rgb(${currentPalette.ar})`;
  const okColor = '#34d399';
  const infoColor = '#22d3ee';
  const gridColor = `rgba(${currentPalette.ar}, 0.2)`;
  const axisColor = '#9ea3c7';
  const pieColors = useMemo(
    () => [accentColor, infoColor, okColor],
    [accentColor]
  );

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

  const tooltipStyle = {
    backgroundColor: 'var(--card)',
    borderColor: 'var(--bd)',
    borderRadius: '12px',
    color: 'var(--tx)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
  };

  return (
    <div id="v-metricas" className="adm-view is-on flex flex-col gap-5">
      {/* Cabecera estelar */}
      <div className="adm-pagehead">
        <div className="adm-pagehead-left">
          <span className="adm-planet-orb" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="adm-h1">Métricas y Analíticas Interactivas</h1>
              <span className="adm-chip">TZ: America/Argentina/Salta</span>
            </div>
            <p className="adm-sub">
              Exploración temporal de sesiones únicas, conversión a contacto y proyectos más visitados.
            </p>
          </div>
        </div>
      </div>

      {/* Barra Superior de Controles de Exploración */}
      <section className="adm-card adm-toolbar !block space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Presets rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="adm-eyebrow mr-1 inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-[var(--ac2)]" />
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
                className={`adm-tab ${preset === item.key ? 'is-active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Selector de Agrupación Temporal */}
          <div className="flex items-center gap-2">
            <span className="adm-eyebrow">Agrupar por:</span>
            <div className="adm-seg">
              {[
                { key: 'day', label: 'Por Día', disabled: isDayDisabled },
                { key: 'week', label: 'Por Semana', disabled: false },
                { key: 'month', label: 'Por Mes', disabled: false },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  disabled={opt.disabled}
                  aria-pressed={effectiveGroupBy === opt.key}
                  onClick={() => setGroupBy(opt.key)}
                  title={
                    opt.disabled
                      ? 'Deshabilitado para rangos mayores a 90 días para preservar legibilidad'
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rango personalizado Desde / Hasta */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--adm-borde)] pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <span className="adm-eyebrow">Desde:</span>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => {
                  setPreset('custom');
                  setFromDate(e.target.value);
                }}
                className="adm-input adm-mono !w-[160px] !py-1.5"
              />
            </label>

            <label className="inline-flex items-center gap-2">
              <span className="adm-eyebrow">Hasta:</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => {
                  setPreset('custom');
                  setToDate(e.target.value);
                }}
                className="adm-input adm-mono !w-[160px] !py-1.5"
              />
            </label>
          </div>

          {isDayDisabled && (
            <span className="font-sans-ui inline-flex items-center gap-1.5 text-[12px] text-[var(--warn)]">
              <Info size={14} />
              Rango de {diffDays} días (&gt; 90 días): agrupación diaria cambiada automáticamente a semanal/mensual.
            </span>
          )}
        </div>
      </section>

      <DataState
        status={status}
        skeletonType="cards"
        errorMessage={errorMsg}
        onRetry={fetchMetrics}
      >
        {/* Resumen de 5 KPIs del Período */}
        <section className="adm-grid-5">
          <article className="adm-kpi">
            <div className="adm-kpi-top !text-[12px]">
              <span>Sesiones Totales</span>
              <Activity size={15} className="text-[var(--ac2)]" />
            </div>
            <div className="adm-kpi-value mt-2 !text-[28px]">
              {metrics.kpis.totalSessions}
            </div>
            <span className="adm-kpi-note !text-[11px]">
              COUNT(DISTINCT session_id)
            </span>
          </article>

          <article className="adm-kpi">
            <div className="adm-kpi-top !text-[12px]">
              <span>Sesiones Autenticadas</span>
              <UserCheck size={15} className="text-[var(--ac2)]" />
            </div>
            <div className="adm-kpi-value mt-2 !text-[28px]">
              {metrics.kpis.authenticatedSessions}
            </div>
            <span className="adm-kpi-note !text-[11px]">
              Usuarios con sesión activa
            </span>
          </article>

          <article className="adm-kpi">
            <div className="adm-kpi-top !text-[12px]">
              <span>Consultas Recibidas</span>
              <Mail size={15} className="text-[var(--ac2)]" />
            </div>
            <div className="adm-kpi-value mt-2 !text-[28px]">
              {metrics.kpis.totalMessages}
            </div>
            <span className="adm-kpi-note !text-[11px]">
              En el período filtrado
            </span>
          </article>

          <article className="adm-kpi">
            <div className="adm-kpi-top !text-[12px]">
              <span>Tasa de Conversión</span>
              <TrendingUp size={15} className="text-[var(--ok)]" />
            </div>
            <div className="adm-kpi-value is-good mt-2 !text-[28px]">
              {metrics.kpis.conversionRate}%
            </div>
            <span className="adm-kpi-note !text-[11px]">
              (Mensajes / Sesiones) × 100
            </span>
          </article>

          <article className="adm-kpi">
            <div className="adm-kpi-top !text-[12px]">
              <span>Nuevos Usuarios</span>
              <UserPlus size={15} className="text-[var(--ac2)]" />
            </div>
            <div className="adm-kpi-value mt-2 !text-[28px]">
              {metrics.kpis.newUsers}
            </div>
            <span className="adm-kpi-note !text-[11px]">
              Registros con rol «user»
            </span>
          </article>
        </section>

        {/* Grilla de 4 Gráficos Interactivos Recharts */}
        <section className="adm-grid-eq">
          {/* 1. Evolución de Sesiones en el Tiempo (AreaChart de 2 series) */}
          <article className="adm-card">
            <div className="adm-card-head">
              <div>
                <h2 className="adm-h3">1. Evolución de Sesiones en el Tiempo</h2>
                <p className="adm-sub">
                  Comparativa de sesiones únicas totales frente a sesiones autenticadas.
                </p>
              </div>
              <Activity size={17} className="text-[var(--ac2)]" />
            </div>

            {!hasSessionsActivity ? (
              <ChartEmptyState message="Sin sesiones registradas en el rango de fechas seleccionado." />
            ) : (
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height={290}>
                  <AreaChart
                    data={metrics.sessionsSeries}
                    margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradTotalSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.45} />
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradAuthSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={okColor} stopOpacity={0.45} />
                        <stop offset="95%" stopColor={okColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      dataKey="bucket"
                      tickFormatter={(val) => formatBucketLabel(val, metrics.filters.groupBy)}
                      stroke={axisColor}
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke={axisColor}
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visitas_generales"
                      name="Sesiones Totales"
                      stroke={accentColor}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradTotalSessions)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="visitas_autenticadas"
                      name="Sesiones Autenticadas"
                      stroke={okColor}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradAuthSessions)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          {/* 2. Nuevos Usuarios Registrados por Período (BarChart) */}
          <article className="adm-card">
            <div className="adm-card-head">
              <div>
                <h2 className="adm-h3">2. Nuevos Usuarios Registrados por Período</h2>
                <p className="adm-sub">
                  Crecimiento de cuentas registradas con rol «user» en el tiempo.
                </p>
              </div>
              <UserPlus size={17} className="text-[var(--ac2)]" />
            </div>

            {!hasUsersActivity ? (
              <ChartEmptyState message="No hubo nuevos registros de usuarios en las fechas seleccionadas." />
            ) : (
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height={290}>
                  <BarChart
                    data={metrics.usersSeries}
                    margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      dataKey="bucket"
                      tickFormatter={(val) => formatBucketLabel(val, metrics.filters.groupBy)}
                      stroke={axisColor}
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke={axisColor}
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                    <Bar
                      dataKey="nuevos_usuarios"
                      name="Nuevos Usuarios"
                      fill={infoColor}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          {/* 3. Distribución por Tipo de Consulta (PieChart Donut con leyenda) */}
          <article className="adm-card">
            <div className="adm-card-head">
              <div>
                <h2 className="adm-h3">3. Distribución por Tipo de Consulta</h2>
                <p className="adm-sub">
                  Proporción de solicitudes de Cotización, Consulta General y Asesoría.
                </p>
              </div>
              <PieChartIcon size={17} className="text-[var(--ac2)]" />
            </div>

            {!hasMessagesActivity ? (
              <ChartEmptyState message="Sin consultas ni mensajes recibidos en el rango seleccionado." />
            ) : (
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height={290}>
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
                      isAnimationActive={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                    >
                      {metrics.messagesDistribution.map((entry, idx) => (
                        <Cell
                          key={`cell-${entry.type}`}
                          fill={pieColors[idx % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} (${props.payload.percentage}%)`,
                        name,
                      ]}
                      contentStyle={tooltipStyle}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          {/* 4. Ranking de Proyectos Más Vistos (BarChart horizontal con filtro local) */}
          <article className="adm-card">
            <div className="adm-card-head">
              <div>
                <h2 className="adm-h3">4. Ranking de Proyectos Más Vistos</h2>
                <p className="adm-sub">
                  Eventos <code className="adm-mono">project_view</code> agrupados por proyecto.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <FolderKanban size={15} className="text-[var(--ac2)]" />
                <select
                  aria-label="Filtrar ranking de proyectos por audiencia"
                  value={projectSegment}
                  onChange={(e) => setProjectSegment(e.target.value)}
                  className="adm-select !w-auto !py-1.5 !text-[12px]"
                >
                  <option value="all">Todos los visitantes</option>
                  <option value="authenticated">Solo usuarios registrados</option>
                </select>
              </div>
            </div>

            {!hasProjectsActivity ? (
              <ChartEmptyState message="Sin visualizaciones de detalle de proyectos en el período y segmento elegidos." />
            ) : (
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height={290}>
                  <BarChart
                    layout="vertical"
                    data={metrics.topProjects}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      stroke={axisColor}
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      type="category"
                      dataKey="title"
                      width={130}
                      stroke={axisColor}
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                      tickFormatter={(val) =>
                        val && val.length > 18 ? `${val.slice(0, 18)}…` : val
                      }
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                    <Bar
                      dataKey="views"
                      name="Vistas al proyecto"
                      fill={accentColor}
                      radius={[0, 6, 6, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>
        </section>
      </DataState>
    </div>
  );
}
