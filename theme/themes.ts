export type ThemeKey = 'midnight' | 'forest' | 'ember';

export interface ThemeColors {
  name: string;
  key: ThemeKey;
  bg: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  success: string;
  warning: string;
  danger: string;
  dangerBg: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  inputBg: string;
  inputBorder: string;
  shadowColor: string;
  // Aliases for convenience & backward compatibility
  primary: string;
  surface: string;
  border: string;
  text: string;
}

export const THEMES: Record<ThemeKey, ThemeColors> = {
  midnight: {
    name: 'Midnight',
    key: 'midnight',
    bg: '#0F0E17',
    card: '#1B192A',
    cardBorder: '#2D2945',
    textPrimary: '#FFFFF5',
    textSecondary: '#A7A3C4',
    textMuted: '#68638C',
    accent: '#7C6FCD',
    accentBg: 'rgba(124, 111, 205, 0.15)',
    accentText: '#AFA9EC',
    accentBorder: '#554A9E',
    success: '#38D9A9',
    warning: '#FFD43B',
    danger: '#FF6B6B',
    dangerBg: 'rgba(255, 107, 107, 0.12)',
    tabBar: '#151322',
    tabBarActive: '#7C6FCD',
    tabBarInactive: '#68638C',
    inputBg: '#151322',
    inputBorder: '#2D2945',
    shadowColor: '#000000',
    primary: '#7C6FCD',
    surface: '#151322',
    border: '#2D2945',
    text: '#FFFFF5',
  },
  forest: {
    name: 'Forest',
    key: 'forest',
    bg: '#0B1512',
    card: '#14241E',
    cardBorder: '#1F382F',
    textPrimary: '#F0F9F5',
    textSecondary: '#94C7B3',
    textMuted: '#528370',
    accent: '#1D9E75',
    accentBg: 'rgba(29, 158, 117, 0.15)',
    accentText: '#5DCAA5',
    accentBorder: '#147053',
    success: '#20C997',
    warning: '#FCC419',
    danger: '#FF6B6B',
    dangerBg: 'rgba(255, 107, 107, 0.12)',
    tabBar: '#0F1E19',
    tabBarActive: '#1D9E75',
    tabBarInactive: '#528370',
    inputBg: '#0F1E19',
    inputBorder: '#1F382F',
    shadowColor: '#000000',
    primary: '#1D9E75',
    surface: '#0F1E19',
    border: '#1F382F',
    text: '#F0F9F5',
  },
  ember: {
    name: 'Ember',
    key: 'ember',
    bg: '#160E0C',
    card: '#271915',
    cardBorder: '#3F2822',
    textPrimary: '#FFF6F4',
    textSecondary: '#DDB6AC',
    textMuted: '#8E675D',
    accent: '#D85A30',
    accentBg: 'rgba(216, 90, 48, 0.15)',
    accentText: '#F0997B',
    accentBorder: '#9E3E1C',
    success: '#38D9A9',
    warning: '#FFC078',
    danger: '#FF6B6B',
    dangerBg: 'rgba(255, 107, 107, 0.12)',
    tabBar: '#1E1310',
    tabBarActive: '#D85A30',
    tabBarInactive: '#8E675D',
    inputBg: '#1E1310',
    inputBorder: '#3F2822',
    shadowColor: '#000000',
    primary: '#D85A30',
    surface: '#1E1310',
    border: '#3F2822',
    text: '#FFF6F4',
  },
};
