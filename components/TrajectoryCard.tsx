import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { Challenge } from '../lib/challenges';
import { DailyLog } from '../lib/logs';
import { calculateTrajectory, TrajectoryProjection } from '../lib/trajectory';
import { TrendingUp, TrendingDown, Minus, ShieldAlert, Sparkles, Sliders, CheckCircle2, Heart } from 'lucide-react-native';

interface TrajectoryCardProps {
  challenge: Challenge;
  logs: DailyLog[];
}

export function TrajectoryCard({ challenge, logs }: TrajectoryCardProps) {
  const { theme } = useThemeStore();
  const [simulatedPct, setSimulatedPct] = useState<number | undefined>(undefined);

  const projection = calculateTrajectory(challenge, logs, simulatedPct);

  const getStatusColor = (status: TrajectoryProjection['survivalStatus']) => {
    switch (status) {
      case 'thriving':
        return '#2ED573';
      case 'on_track':
        return theme.primary;
      case 'at_risk':
        return '#FFA502';
      case 'critical':
        return '#FF4757';
    }
  };

  const getStatusLabel = (status: TrajectoryProjection['survivalStatus']) => {
    switch (status) {
      case 'thriving':
        return 'Thriving & Crushing It';
      case 'on_track':
        return 'On Track for Success';
      case 'at_risk':
        return 'Buffer Hearts at Risk';
      case 'critical':
        return 'Critical Danger of Auto-Fail';
    }
  };

  const statusColor = getStatusColor(projection.survivalStatus);

  const presets = [60, 80, 95, 100];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles color={theme.accent} size={18} />
          <Text style={[styles.title, { color: theme.text }]}>Trajectory Engine</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20`, borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(projection.survivalStatus)}
          </Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Predicts your outcome based on habit momentum curve & historical consistency.
      </Text>

      {/* Main Metric Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current Avg</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {projection.currentAvgCompletionPct}%
          </Text>
          <View style={styles.trendRow}>
            {projection.milestoneForecasts.consistencyTrend === 'improving' && (
              <>
                <TrendingUp color="#2ED573" size={13} />
                <Text style={[styles.trendText, { color: '#2ED573' }]}>Upward momentum</Text>
              </>
            )}
            {projection.milestoneForecasts.consistencyTrend === 'declining' && (
              <>
                <TrendingDown color="#FF4757" size={13} />
                <Text style={[styles.trendText, { color: '#FF4757' }]}>Slowing down</Text>
              </>
            )}
            {projection.milestoneForecasts.consistencyTrend === 'stable' && (
              <>
                <Minus color={theme.textMuted} size={13} />
                <Text style={[styles.trendText, { color: theme.textMuted }]}>Steady pace</Text>
              </>
            )}
          </View>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Projected Final</Text>
          <Text style={[styles.statValue, { color: statusColor }]}>
            {projection.projectedFinalCompletionPct}%
          </Text>
          <Text style={[styles.trendText, { color: theme.textSecondary }]}>
            Target: Day {projection.totalDays}
          </Text>
        </View>
      </View>

      {/* Hearts / Penalties Forecast */}
      {challenge.difficulty_mode !== 'relaxed' && (
        <View style={[styles.heartForecastRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.heartForecastLeft}>
            <Heart color={theme.danger} size={16} fill={theme.danger} />
            <Text style={[styles.heartForecastLabel, { color: theme.text }]}>
              Projected Hearts:
            </Text>
          </View>
          <Text style={[styles.heartForecastValue, { color: projection.projectedHeartsRemaining > 0 ? theme.text : theme.danger }]}>
            {projection.projectedHeartsRemaining} / {projection.maxPenalties} Remaining
          </Text>
        </View>
      )}

      {/* Interactive Consistency Simulator */}
      <View style={[styles.simulatorContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.simulatorHeader}>
          <View style={styles.simulatorTitleRow}>
            <Sliders color={theme.primary} size={15} />
            <Text style={[styles.simulatorTitle, { color: theme.text }]}>
              Consistency Simulator
            </Text>
          </View>
          {simulatedPct !== undefined && (
            <TouchableOpacity onPress={() => setSimulatedPct(undefined)}>
              <Text style={[styles.resetText, { color: theme.primary }]}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.simulatorDesc, { color: theme.textSecondary }]}>
          What if your future adherence is{' '}
          <Text style={{ fontWeight: '700', color: theme.text }}>
            {simulatedPct !== undefined ? `${simulatedPct}%` : `${projection.currentAvgCompletionPct}% (current)`}
          </Text>?
        </Text>

        <View style={styles.presetButtonsRow}>
          {presets.map((pct) => {
            const isSelected = simulatedPct === pct;
            return (
              <TouchableOpacity
                key={pct}
                onPress={() => setSimulatedPct(pct)}
                style={[
                  styles.presetButton,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {pct}% Pace
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  heartForecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  heartForecastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heartForecastLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  heartForecastValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  simulatorContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  simulatorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  simulatorTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  resetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  simulatorDesc: {
    fontSize: 11,
    marginBottom: 10,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
