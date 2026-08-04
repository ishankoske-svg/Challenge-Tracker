import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { THEMES, ThemeKey } from '../theme/themes';

export function ThemeSwitcher() {
  const { themeKey, setTheme, theme } = useThemeStore();

  const options: ThemeKey[] = ['midnight', 'forest', 'ember'];

  return (
    <View style={[styles.container, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
      {options.map((key) => {
        const itemTheme = THEMES[key];
        const isActive = themeKey === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => setTheme(key)}
            activeOpacity={0.8}
            style={[
              styles.swatch,
              { backgroundColor: itemTheme.accent },
              isActive && [styles.activeSwatch, { borderColor: theme.textPrimary }],
            ]}
          >
            {isActive && <View style={[styles.innerDot, { backgroundColor: theme.textPrimary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSwatch: {
    borderWidth: 2,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
