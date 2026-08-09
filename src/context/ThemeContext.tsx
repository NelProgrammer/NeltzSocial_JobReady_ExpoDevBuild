import React, { createContext, useContext, useEffect, useState } from 'react';
import { Storage } from '../utils/storage';

export interface ColorTheme {
  id: string;
  name: string;
  bgDark: string;       // Primary background (e.g. #0f172a)
  bgSurface: string;    // Card/Surface background (e.g. #1e293b)
  border: string;       // Border color (e.g. #334155)
  accent: string;       // Accent / highlight color (e.g. #6366f1)
  headerGrad: [string, string]; // LinearGradient header colors
  textPrimary: string;  // Primary text color (#ffffff)
  textSecondary: string; // Secondary text color (#94a3b8)
}

export const PRESET_THEMES: Record<string, ColorTheme> = {
  slate_dark: {
    id: 'slate_dark',
    name: 'Slate Dark (Default)',
    bgDark: '#0f172a',
    bgSurface: '#1e293b',
    border: '#334155',
    accent: '#6366f1',
    headerGrad: ['#0f172a', '#1e293b'],
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
  },
  midnight_ocean: {
    id: 'midnight_ocean',
    name: 'Midnight Ocean',
    bgDark: '#07162c',
    bgSurface: '#0f2942',
    border: '#1b4965',
    accent: '#0284c7',
    headerGrad: ['#07162c', '#0f2942'],
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
  },
  emerald_executive: {
    id: 'emerald_executive',
    name: 'Emerald Executive',
    bgDark: '#041f1a',
    bgSurface: '#0b3930',
    border: '#135c4e',
    accent: '#10b981',
    headerGrad: ['#041f1a', '#0b3930'],
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
  },
  royal_violet: {
    id: 'royal_violet',
    name: 'Royal Violet',
    bgDark: '#17092b',
    bgSurface: '#291444',
    border: '#43236b',
    accent: '#a855f7',
    headerGrad: ['#17092b', '#291444'],
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
  },
  sunset_amber: {
    id: 'sunset_amber',
    name: 'Sunset Amber',
    bgDark: '#1c0d08',
    bgSurface: '#301810',
    border: '#522b1c',
    accent: '#f59e0b',
    headerGrad: ['#1c0d08', '#301810'],
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
  },
  charcoal_titanium: {
    id: 'charcoal_titanium',
    name: 'Charcoal Titanium',
    bgDark: '#121212',
    bgSurface: '#1e1e1e',
    border: '#333333',
    accent: '#ec4899',
    headerGrad: ['#121212', '#1e1e1e'],
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
  },
};

interface ThemeContextType {
  theme: ColorTheme;
  themeId: string;
  setThemeId: (id: string) => Promise<void>;
  themes: ColorTheme[];
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: PRESET_THEMES.slate_dark,
  themeId: 'slate_dark',
  setThemeId: async () => {},
  themes: Object.values(PRESET_THEMES),
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<string>('slate_dark');

  useEffect(() => {
    const loadTheme = async () => {
      const savedThemeId = await Storage.get(Storage.KEYS.APP_COLOR_THEME);
      if (savedThemeId && PRESET_THEMES[savedThemeId]) {
        setThemeIdState(savedThemeId);
      }
    };
    loadTheme();
  }, []);

  const setThemeId = async (id: string) => {
    if (PRESET_THEMES[id]) {
      setThemeIdState(id);
      await Storage.set(Storage.KEYS.APP_COLOR_THEME, id);
    }
  };

  const currentTheme = PRESET_THEMES[themeId] || PRESET_THEMES.slate_dark;

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeId,
        setThemeId,
        themes: Object.values(PRESET_THEMES),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
