import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeColors, ThemeKey } from '../theme/themes';

const THEME_STORAGE_KEY = '@challengr_user_theme';

interface ThemeState {
  themeKey: ThemeKey;
  theme: ThemeColors;
  setTheme: (key: ThemeKey) => Promise<void>;
  loadPersistedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeKey: 'midnight',
  theme: THEMES.midnight,
  setTheme: async (key: ThemeKey) => {
    const selectedTheme = THEMES[key] || THEMES.midnight;
    set({ themeKey: key, theme: selectedTheme });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, key);
    } catch (e) {
      console.warn('Failed to save theme to AsyncStorage:', e);
    }
  },
  loadPersistedTheme: async () => {
    try {
      const savedKey = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedKey && (savedKey in THEMES)) {
        const key = savedKey as ThemeKey;
        set({ themeKey: key, theme: THEMES[key] });
      }
    } catch (e) {
      console.warn('Failed to load theme from AsyncStorage:', e);
    }
  },
}));
