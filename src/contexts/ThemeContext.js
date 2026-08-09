import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const themes = {
  dark: {
    mode: 'dark',
    colors: {
      background: '#060D1A',
      backgroundAlt: '#080B14',
      surface: '#0A1222',
      surfaceElevated: 'rgba(255,255,255,0.04)',
      surfaceAlt: '#0D1E3C',
      border: 'rgba(255,255,255,0.08)',
      textPrimary: '#FFFFFF',
      textSecondary: '#8E9EBA',
      textMuted: 'rgba(255,255,255,0.35)',
      primary: '#2D6FF0',
      success: '#10B981',
      error: '#EF4444',
      errorSoft: 'rgba(239,68,68,0.16)',
      warning: '#F59E0B',
      overlay: 'rgba(0,0,0,0.5)',
      cardShadow: 'rgba(0,0,0,0.2)',
    },
  },
  light: {
    mode: 'light',
    colors: {
      background: '#FFFFFF',
      backgroundAlt: '#F5F6FA',
      surface: '#FFFFFF',
      surfaceElevated: '#F5F6FA',
      surfaceAlt: '#FFFFFF',
      border: 'rgba(0,0,0,0.08)',
      textPrimary: '#000000',
      textSecondary: '#444444',
      textMuted: '#8A94A6',
      primary: '#2D6FF0',
      success: '#10B981',
      error: '#EF4444',
      errorSoft: 'rgba(239,68,68,0.08)',
      warning: '#F59E0B',
      overlay: 'rgba(0,0,0,0.35)',
      cardShadow: 'rgba(0,0,0,0.06)',
    },
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restoreTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('chainpay:theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.warn('Theme restore failed', error);
      } finally {
        setReady(true);
      }
    };

    restoreTheme();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem('chainpay:theme', themeMode).catch(() => {});
  }, [ready, themeMode]);

  const value = useMemo(() => ({
    mode: themeMode,
    theme: themes[themeMode] || themes.dark,
    toggleTheme: () => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
    setThemeMode,
  }), [themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
