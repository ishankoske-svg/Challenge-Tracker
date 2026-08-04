import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { PlusCircle, Sparkles } from 'lucide-react-native';

export default function NewChallengeScreen() {
  const { theme } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.titleGroup}>
          <PlusCircle color={theme.accent} size={22} />
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>New Challenge</Text>
        </View>
        <ThemeSwitcher />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Sparkles color={theme.accent} size={40} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Template Picker Ready for Phase 2</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            In Phase 2, this screen will present pre-built templates (Fitness, Coding, Language, Academics, Custom) with pre-filled tasks and custom durations.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justify.content: 'space-between',
    borderBottomWidth: 1,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
