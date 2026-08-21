import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { WeeklyRecap } from '../lib/analytics';
import { TrendingUp, TrendingDown, Minus, Zap, Target, Flame } from 'lucide-react-native';

interface WeeklyRecapCardProps {
  recap: WeeklyRecap;
}

export function WeeklyRecapCard({ recap }: WeeklyRecapCardProps) {
  const { theme } = useThemeStore();

  const renderDelta = (delta: number) => {
    if (delta > 0) {
      return (
        <View style={styles.deltaContainer}>
          <TrendingUp size={14} color="#4ade80" />
          <Text style={[styles.deltaText, { color: '#4ade80' }]}>+{delta}</Text>
        </View>
      );
    }
    if (delta < 0) {
      return (
        <View style={styles.deltaContainer}>
          <TrendingDown size={14} color="#f87171" />
          <Text style={[styles.deltaText, { color: '#f87171' }]}>{delta}</Text>
        </View>
      );
    }
    return (
      <View style={styles.deltaContainer}>
        <Minus size={14} color={theme.textMuted} />
        <Text style={[styles.deltaText, { color: theme.textMuted }]}>0</Text>
      </View>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.weekTitle, { color: theme.text }]}>Week {recap.weekNumber}</Text>
          <Text style={[styles.weekLabel, { color: theme.textSecondary }]}>{recap.weekLabel}</Text>
        </View>
        <View style={[styles.xpBadge, { backgroundColor: theme.surface }]}>
          <Zap size={14} color={theme.accent} />
          <Text style={[styles.xpText, { color: theme.text }]}>+{recap.totalXPEstimate} XP</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {/* Completion Stat */}
        <View style={styles.statColumn}>
          <View style={styles.statIconContainer}>
            <Target size={16} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completion</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{recap.avgCompletionPct}%</Text>
          {recap.comparedToPrevWeek && (
            <View style={styles.comparisonRow}>
              {renderDelta(recap.comparedToPrevWeek.completionDelta)}
              <Text style={[styles.vsText, { color: theme.textMuted }]}>vs prev</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Streak Stat */}
        <View style={styles.statColumn}>
          <View style={styles.statIconContainer}>
            <Flame size={16} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Best Streak</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{recap.streakDays}d</Text>
          {recap.comparedToPrevWeek && (
            <View style={styles.comparisonRow}>
              {renderDelta(recap.comparedToPrevWeek.streakDelta)}
              <Text style={[styles.vsText, { color: theme.textMuted }]}>vs prev</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  weekLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statColumn: {
    flex: 1,
  },
  statIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deltaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  vsText: {
    fontSize: 11,
  },
  divider: {
    width: 1,
    height: '80%',
    marginHorizontal: 16,
  },
});
