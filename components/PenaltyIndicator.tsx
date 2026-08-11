import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heart, Coffee } from 'lucide-react-native';
import { DifficultyMode, DIFFICULTY_CONFIG } from '../lib/challenges';
import { useThemeStore } from '../stores/themeStore';

interface PenaltyIndicatorProps {
  difficultyMode: DifficultyMode;
  maxPenalties: number;
  penaltiesUsed: number;
  compact?: boolean;
}

export function PenaltyIndicator({
  difficultyMode,
  maxPenalties,
  penaltiesUsed,
  compact = false,
}: PenaltyIndicatorProps) {
  const { theme } = useThemeStore();
  const config = DIFFICULTY_CONFIG[difficultyMode] || DIFFICULTY_CONFIG.medium;
  const remaining = Math.max(0, maxPenalties - penaltiesUsed);

  if (difficultyMode === 'relaxed') {
    if (compact) {
      return (
        <View style={styles.compactRow}>
          <Coffee color={theme.textMuted} size={14} />
          <Text style={[styles.compactText, { color: theme.textMuted }]}>Track Only</Text>
        </View>
      );
    }
    return (
      <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.headerRow}>
          <View style={[styles.modeChip, { backgroundColor: `${config.color}20`, borderColor: config.color }]}>
            <Text style={styles.emoji}>{config.emoji}</Text>
            <Text style={[styles.modeText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={[styles.counterText, { color: theme.textSecondary }]}>No Penalties (Habit Tracking)</Text>
        </View>
      </View>
    );
  }

  if (difficultyMode === 'hardcore') {
    return (
      <View style={[styles.badge, { backgroundColor: 'rgba(255, 71, 87, 0.15)', borderColor: '#FF4757' }]}>
        <Text style={styles.emoji}>🔥</Text>
        <Text style={[styles.badgeText, { color: '#FF4757' }]}>Hardcore (0 Buffers)</Text>
      </View>
    );
  }

  // Compact layout (for cards)
  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Heart color={remaining > 0 ? theme.danger : theme.textMuted} size={14} fill={remaining > 0 ? theme.danger : 'transparent'} />
        <Text style={[styles.compactText, { color: remaining === 1 ? theme.warning : remaining === 0 ? theme.danger : theme.textSecondary }]}>
          {remaining}/{maxPenalties} Left
        </Text>
      </View>
    );
  }

  // Full layout (for detail headers & stats)
  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.headerRow}>
        <View style={[styles.modeChip, { backgroundColor: `${config.color}20`, borderColor: config.color }]}>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text style={[styles.modeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={[styles.counterText, { color: remaining <= 1 ? theme.danger : theme.textPrimary }]}>
          {remaining} of {maxPenalties} Penalties Remaining
        </Text>
      </View>

      <View style={styles.heartsRow}>
        {Array.from({ length: Math.min(maxPenalties, 20) }).map((_, i) => {
          const isAlive = i < remaining;
          return (
            <View key={i} style={styles.heartWrapper}>
              <Heart
                color={isAlive ? config.color : theme.textMuted}
                fill={isAlive ? config.color : 'transparent'}
                size={18}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  emoji: { fontSize: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactText: { fontSize: 12, fontWeight: '700' },
  container: { borderRadius: 14, padding: 12, borderWidth: 1, marginBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  modeText: { fontSize: 11, fontWeight: '800' },
  counterText: { fontSize: 12, fontWeight: '700' },
  heartsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heartWrapper: { padding: 2 },
});
