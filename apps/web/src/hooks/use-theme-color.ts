import { useState, useEffect, useCallback } from 'react';

const THEME_COLOR_STORAGE_KEY = 'theme-color';

export type ThemeColor = 
  | 'default'
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan'
  | 'amber'
  | 'emerald'
  | 'indigo'
  | 'violet'
  | 'rose';

export type ThemeColorConfig = {
  name: string;
  light: {
    primary: string;
    primaryForeground: string;
  };
  dark: {
    primary: string;
    primaryForeground: string;
  };
};

// Predefined theme colors in oklch format
export const THEME_COLORS: Record<ThemeColor, ThemeColorConfig> = {
  default: {
    name: 'Default',
    light: {
      primary: 'oklch(0.205 0 0)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.922 0 0)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  blue: {
    name: 'Blue',
    light: {
      primary: 'oklch(0.553 0.194 252.338)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.7 0.15 252.338)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  green: {
    name: 'Green',
    light: {
      primary: 'oklch(0.6 0.18 142.5)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.7 0.15 142.5)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  red: {
    name: 'Red',
    light: {
      primary: 'oklch(0.577 0.245 27.325)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.704 0.191 22.216)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  purple: {
    name: 'Purple',
    light: {
      primary: 'oklch(0.55 0.22 302.71)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.7 0.18 302.71)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  orange: {
    name: 'Orange',
    light: {
      primary: 'oklch(0.7 0.15 70)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
    dark: {
      primary: 'oklch(0.75 0.15 70)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  pink: {
    name: 'Pink',
    light: {
      primary: 'oklch(0.65 0.2 340)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.75 0.18 340)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  cyan: {
    name: 'Cyan',
    light: {
      primary: 'oklch(0.65 0.15 200)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
    dark: {
      primary: 'oklch(0.75 0.15 200)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  amber: {
    name: 'Amber',
    light: {
      primary: 'oklch(0.75 0.15 85)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
    dark: {
      primary: 'oklch(0.8 0.15 85)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  emerald: {
    name: 'Emerald',
    light: {
      primary: 'oklch(0.6 0.15 160)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.7 0.15 160)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  indigo: {
    name: 'Indigo',
    light: {
      primary: 'oklch(0.55 0.2 270)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.7 0.18 270)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  violet: {
    name: 'Violet',
    light: {
      primary: 'oklch(0.6 0.2 280)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.75 0.18 280)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
  rose: {
    name: 'Rose',
    light: {
      primary: 'oklch(0.65 0.18 15)',
      primaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.75 0.18 15)',
      primaryForeground: 'oklch(0.145 0 0)',
    },
  },
};

export function useThemeColor() {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    if (typeof window === 'undefined') return 'default';
    const stored = localStorage.getItem(THEME_COLOR_STORAGE_KEY) as ThemeColor;
    return stored && stored in THEME_COLORS ? stored : 'default';
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Apply theme color to CSS variables
  useEffect(() => {
    const themeConfig = THEME_COLORS[themeColor];
    const colors = isDark ? themeConfig.dark : themeConfig.light;

    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--primary-foreground', colors.primaryForeground);
    // Also update sidebar-primary to match
    document.documentElement.style.setProperty('--sidebar-primary', colors.primary);
    document.documentElement.style.setProperty('--sidebar-primary-foreground', colors.primaryForeground);
  }, [themeColor, isDark]);

  const setThemeColor = useCallback((color: ThemeColor) => {
    if (color in THEME_COLORS) {
      localStorage.setItem(THEME_COLOR_STORAGE_KEY, color);
      setThemeColorState(color);
    }
  }, []);

  const resetThemeColor = useCallback(() => {
    localStorage.removeItem(THEME_COLOR_STORAGE_KEY);
    setThemeColorState('default');
  }, []);

  return {
    themeColor,
    setThemeColor,
    resetThemeColor,
    themeColors: THEME_COLORS,
  };
}

