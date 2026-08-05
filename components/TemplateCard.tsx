import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { ChallengeTemplate } from '../constants/templates';
import { Dumbbell, Code, BookOpen, Globe, Sparkles } from 'lucide-react-native';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  fitness: Dumbbell,
  coding: Code,
  academics: BookOpen,
  language: Globe,
  custom: Sparkles,
  mindset: Sparkles,
};

interface TemplateCardProps {
  template: ChallengeTemplate;
  onPress: (template: ChallengeTemplate) => void;
}

export function TemplateCard({ template, onPress }: TemplateCardProps) {
  const { theme } = useThemeStore();
  const Icon = CATEGORY_ICONS[template.category] || Sparkles;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      activeOpacity={0.8}
      onPress={() => onPress(template)}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.accentBg }]}>
        <Icon color={theme.accent} size={22} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{template.title}</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {template.duration_days} days · {template.tasks.length} tasks
        </Text>
        <Text style={[styles.desc, { color: theme.textMuted }]} numberOfLines={2}>
          {template.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
