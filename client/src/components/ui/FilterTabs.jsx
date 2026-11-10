/**
 * FilterTabs - Pestañas de filtrado con conteo integradas para barras de herramientas administrativas.
 * Unifica el comportamiento y estética de filtros en Proyectos, Servicios, Demos y Mensajes.
 */
export default function FilterTabs({
  tabs = [],
  activeId,
  onChange,
  className = '',
}) {
  return (
    <div className={`push flex flex-wrap items-center gap-1.5 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`adm-tab ${activeId === tab.id ? 'is-active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
