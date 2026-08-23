import React, { createContext, useContext, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  cardBg: string;
  cardBgSubtle: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  gridLine: string;
  pillBg: string;
  pillBorder: string;
  positive: string;
  negative: string;
  positiveBg: string;
  negativeBg: string;
  positiveBorder: string;
  negativeBorder: string;
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartPurple: string;
  chartTeal: string;
  tooltipBg: string;
  tooltipText: string;
  shadowColor: string;
}

const darkColors: ThemeColors = {
  bg: '#090D16',
  cardBg: '#0F172A',
  cardBgSubtle: '#1E293B',
  cardBorder: '#1E293B',
  inputBg: '#0F172A',
  inputBorder: '#1E293B',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  gridLine: '#334155',
  pillBg: '#0F172A',
  pillBorder: '#1E293B',
  positive: '#10B981',
  negative: '#F43F5E',
  positiveBg: 'rgba(16, 185, 129, 0.15)',
  negativeBg: 'rgba(244, 63, 94, 0.15)',
  positiveBorder: 'rgba(16, 185, 129, 0.35)',
  negativeBorder: 'rgba(244, 63, 94, 0.35)',
  chartPrimary: '#38BDF8',
  chartSecondary: '#10B981',
  chartTertiary: '#F59E0B',
  chartPurple: '#818CF8',
  chartTeal: '#2DD4BF',
  tooltipBg: '#090D16',
  tooltipText: '#FFFFFF',
  shadowColor: '#000000',
};

const lightColors: ThemeColors = {
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBgSubtle: '#F1F5F9',
  cardBorder: '#E2E8F0',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  gridLine: '#E2E8F0',
  pillBg: '#F1F5F9',
  pillBorder: '#E2E8F0',
  positive: '#16A34A',
  negative: '#DC2626',
  positiveBg: 'rgba(22, 163, 74, 0.10)',
  negativeBg: 'rgba(220, 38, 38, 0.10)',
  positiveBorder: 'rgba(22, 163, 74, 0.25)',
  negativeBorder: 'rgba(220, 38, 38, 0.25)',
  chartPrimary: '#2563EB',
  chartSecondary: '#16A34A',
  chartTertiary: '#D97706',
  chartPurple: '#7C3AED',
  chartTeal: '#0D9488',
  tooltipBg: '#1E293B',
  tooltipText: '#FFFFFF',
  shadowColor: '#64748B',
};

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
