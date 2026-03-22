import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Classes que o ThemeProvider aplica no <html> */
const THEME_CLASSES: Theme[] = ['light', 'dark'];

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('altcorp-theme');
      // Migrar valor legado 'dark-c6' para 'dark'
      if (saved === 'dark-c6') return 'dark';
      if (saved === 'light' || saved === 'dark') return saved as Theme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove todas as classes de tema antes de aplicar a nova
    root.classList.remove('light', 'dark', 'dark-c6'); // remove também legado
    root.classList.add(theme);
    localStorage.setItem('altcorp-theme', theme);
  }, [theme]);

  /** Cicla: light → dark → light */
  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
