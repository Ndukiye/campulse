import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

type ThemeColors = {
  background: string;
  card: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  accent: string;
  inputBackground: string;
  inputBorder: string;
  icon: string;
  success: string;
  successMuted: string;
  danger: string;
  dangerMuted: string;
  warning: string;
  warningMuted: string;
  info: string;
  infoMuted: string;
  overlay: string;
  disabled: string;
  chipActiveBg: string;
  chipInactiveBg: string;
  chipActiveText: string;
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
  surface: '#F1F5F9',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  primary: '#6366F1',
  accent: '#22D3EE',
  inputBackground: '#F1F5F9',
  inputBorder: '#CBD5E1',
  icon: '#475569',
  success: '#10B981',
  successMuted: '#D1FAE5',
  danger: '#EF4444',
  dangerMuted: '#FEE2E2',
  warning: '#F59E0B',
  warningMuted: '#FEF3C7',
  info: '#3B82F6',
  infoMuted: '#DBEAFE',
  overlay: 'rgba(0,0,0,0.4)',
  disabled: '#94A3B8',
  chipActiveBg: '#6366F1',
  chipInactiveBg: '#E5E7EB',
  chipActiveText: '#FFFFFF',
};

const DARK_COLORS: ThemeColors = {
  background: '#0B1020',
  card: '#111827',
  surface: '#1F2937',
  text: '#E5E7EB',
  muted: '#94A3B8',
  border: '#243047',
  primary: '#8B5CF6',
  accent: '#22D3EE',
  inputBackground: '#1F2937',
  inputBorder: '#374151',
  icon: '#9CA3AF',
  success: '#34D399',
  successMuted: '#064E3B',
  danger: '#F87171',
  dangerMuted: '#7F1D1D',
  warning: '#FBBF24',
  warningMuted: '#78350F',
  info: '#60A5FA',
  infoMuted: '#1E3A8A',
  overlay: 'rgba(0,0,0,0.6)',
  disabled: '#6B7280',
  chipActiveBg: '#4C51BF',
  chipInactiveBg: '#1F2937',
  chipActiveText: '#FFFFFF',
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
