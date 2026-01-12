import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemePreferenceContextType {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  resolvedScheme: 'light' | 'dark';
  loaded: boolean;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme-preference';

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setPreferenceState(value);
      }
      setLoaded(true);
    });
  }, []);

  const setPreference = async (pref: ThemePreference) => {
    setPreferenceState(pref);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
  };

  const resolvedScheme = useMemo(() => {
    if (preference === 'system') {
      return (systemColorScheme ?? 'light') as 'light' | 'dark';
    }
    return preference;
  }, [preference, systemColorScheme]);

  return (
    <ThemePreferenceContext.Provider value={{ preference, setPreference, resolvedScheme, loaded }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  }
  return context;
}
