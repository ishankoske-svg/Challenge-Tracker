import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { THEMES, ThemeKey } from '../theme/themes';

export function ThemeSwitcher() {
  const { themeKey, setTheme, theme } = useThemeStore();

  const options: ThemeKey[] = [
    'midnight',
    'forest',
    'ember',
    'light',
    'dark',
    'lavender',
    'gold',
    'silver',
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 200,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSwatch: {
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  innerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
