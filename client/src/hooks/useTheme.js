import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'portfolio_theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') {
    return attr;
  }
  return 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const handleCustomChange = (e) => {
      if (e.detail && (e.detail === 'light' || e.detail === 'dark')) {
        setThemeState(e.detail);
      }
    };
    window.addEventListener('portfolio:theme-change', handleCustomChange);
    return () => window.removeEventListener('portfolio:theme-change', handleCustomChange);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    const resolved = nextTheme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem(STORAGE_KEY, resolved);
    setThemeState(resolved);
    window.dispatchEvent(new CustomEvent('portfolio:theme-change', { detail: resolved }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    setTheme,
    toggleTheme,
  };
}
