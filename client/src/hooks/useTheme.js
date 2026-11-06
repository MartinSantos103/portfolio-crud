import { useState, useEffect, useCallback } from 'react';

export const PALETTES = [
  { name: 'Violeta', ar: '130,119,242', br: '167,156,255', lt: '216,204,255', hue: 262 },
  { name: 'Azul',    ar: '79,140,255',  br: '125,177,255', lt: '197,219,255', hue: 218 },
  { name: 'Cian',    ar: '34,211,238',  br: '103,232,249', lt: '186,244,252', hue: 187 },
  { name: 'Menta',   ar: '52,211,153',  br: '110,231,183', lt: '187,247,222', hue: 158 },
  { name: 'Rosa',    ar: '244,114,182', br: '249,168,212', lt: '252,215,236', hue: 330 },
  { name: 'Coral',   ar: '251,113,133', br: '253,164,175', lt: '254,215,220', hue: 350 },
  { name: 'Ámbar',   ar: '251,191,36',  br: '252,211,77',  lt: '254,240,180', hue: 42 },
];

const ACCENT_STORAGE_KEY = 'ac';
const LEGACY_THEME_KEY = 'portfolio_theme';

function getInitialPaletteIndex() {
  if (typeof window === 'undefined') return 0;
  try {
    // Limpiar preferencia antigua de modo claro/oscuro y forzar oscuro
    localStorage.removeItem(LEGACY_THEME_KEY);
    document.documentElement.removeAttribute('data-theme');

    const raw = localStorage.getItem(ACCENT_STORAGE_KEY);
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < PALETTES.length) {
      return parsed;
    }
  } catch {
    // Ignorar errores de almacenamiento restringido
  }
  return 0;
}

function applyPaletteVariables(index) {
  if (typeof document === 'undefined') return;
  const palette = PALETTES[index] || PALETTES[0];
  const root = document.documentElement;
  root.style.setProperty('--ar', palette.ar);
  root.style.setProperty('--br', palette.br);
  root.style.setProperty('--lt', palette.lt);
  root.style.setProperty('--hue', String(palette.hue));
}

export function useTheme() {
  const [paletteIndex, setPaletteIndex] = useState(getInitialPaletteIndex);

  useEffect(() => {
    applyPaletteVariables(paletteIndex);
  }, [paletteIndex]);

  useEffect(() => {
    const handleAccentSync = (e) => {
      const nextIdx =
        typeof e.detail === 'number'
          ? e.detail
          : getInitialPaletteIndex();
      if (nextIdx >= 0 && nextIdx < PALETTES.length) {
        setPaletteIndex(nextIdx);
      }
    };

    const handleStorage = (e) => {
      if (e.key === ACCENT_STORAGE_KEY) {
        const parsed = Number(e.newValue);
        if (Number.isInteger(parsed) && parsed >= 0 && parsed < PALETTES.length) {
          applyPaletteVariables(parsed);
          setPaletteIndex(parsed);
        }
      }
    };

    window.addEventListener('acento', handleAccentSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('acento', handleAccentSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setPalette = useCallback((nextIndex) => {
    const idx = Number(nextIndex);
    const validIndex =
      Number.isInteger(idx) && idx >= 0 && idx < PALETTES.length ? idx : 0;

    applyPaletteVariables(validIndex);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, String(validIndex));
    } catch {
      // Ignorar errores de escritura en localStorage
    }
    setPaletteIndex(validIndex);
    window.dispatchEvent(new CustomEvent('acento', { detail: validIndex }));
  }, []);

  return {
    palettes: PALETTES,
    paletteIndex,
    currentPalette: PALETTES[paletteIndex] || PALETTES[0],
    setPalette,
  };
}
