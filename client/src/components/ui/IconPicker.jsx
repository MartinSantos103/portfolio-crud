import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import DevIcon, { CURATED_TECH_ICONS } from './DevIcon.jsx';
import IconSlot, { CURATED_SERVICE_ICONS } from './IconSlot.jsx';

/**
 * IconPicker - Selector visual con búsqueda sobre el diccionario predefinido de íconos
 * (evitando entradas de texto libre rotas).
 * - mode="tech": catálogo de tecnologías (Devicon)
 * - mode="service": catálogo de servicios (Lucide)
 */
export default function IconPicker({
  mode = 'tech',
  value,
  onChange,
  label = 'Ícono del catálogo',
}) {
  const [search, setSearch] = useState('');
  const catalog = mode === 'service' ? CURATED_SERVICE_ICONS : CURATED_TECH_ICONS;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.key.toLowerCase().includes(q)
    );
  }, [catalog, search]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-sans-ui text-[13px] font-medium text-[var(--texto)]">
          {label}
        </label>
      )}

      <div className="rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] p-3">
        <div className="relative mb-2.5 flex items-center">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 text-[var(--texto-suave)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ícono en el catálogo..."
            className="font-sans-ui w-full rounded-[9px] border border-[var(--borde)] bg-[var(--superficie)] py-1.5 pr-3 pl-8 text-[13px] text-[var(--texto)] placeholder:text-[var(--texto-suave)] focus:border-[var(--acento)] focus:outline-none"
          />
        </div>

        <div className="grid max-h-[168px] grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4">
          {filtered.map((item) => {
            const isSelected = value === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange?.(item.key, item)}
                className={`flex cursor-pointer items-center gap-2 rounded-[9px] border px-2.5 py-2 text-left text-[12px] transition-colors ${
                  isSelected
                    ? 'border-[var(--acento)] bg-[var(--tile-icono-bg)] font-medium text-[var(--texto)]'
                    : 'border-transparent bg-[var(--superficie)] text-[var(--texto-suave)] hover:border-[var(--borde)] hover:text-[var(--texto)]'
                }`}
              >
                {mode === 'service' ? (
                  <IconSlot
                    size={16}
                    name={`service-${item.key}`}
                    className="text-[var(--acento-texto)]"
                  />
                ) : (
                  <DevIcon name={item.key} size={16} />
                )}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
