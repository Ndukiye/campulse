import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  border: string;
  primary: string;
  muted: string;
};

type ThemeContextType = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const LIGHT_COLORS: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  border: '#E2E8F0',
  primary: '#6366F1',
  muted: '#64748B',
};

const DARK_COLORS: ThemeColors = {
  background: '#0F172A',
  card: '#111827',
  text: '#E5E7EB',
  border: '#334155',
  primary: '#8B5CF6',
  muted: '#94A3B8',
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

const STORAGE_KEY = 'theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const isDark = mode === 'dark';

  useEffect(() => {
    const init = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
        return;
      }
      const system = Appearance.getColorScheme();
      setMode(system === 'dark' ? 'dark' : 'light');
    };
    init();
  }, []);

  const setTheme = async (m: ThemeMode) => {
    setMode(m);
    await AsyncStorage.setItem(STORAGE_KEY, m);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const colors = useMemo(() => (isDark ? DARK_COLORS : LIGHT_COLORS), [isDark]);

  const value: ThemeContextType = {
    mode,
    isDark,
    colors,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};