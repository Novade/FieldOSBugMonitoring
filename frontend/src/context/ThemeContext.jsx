import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Chart } from 'chart.js';

const STORAGE_KEY = 'theme';
const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable */
  }
  return 'light';
}

// Chart.js draws on canvas, so CSS variables don't reach it — push the palette into its defaults.
function applyChartTheme(theme) {
  const dark = theme === 'dark';
  Chart.defaults.color = dark ? '#a0acc2' : '#666';
  Chart.defaults.borderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  Object.values(Chart.instances).forEach((chart) => chart.update('none'));
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    applyChartTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
