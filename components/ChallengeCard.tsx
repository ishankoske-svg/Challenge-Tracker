import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { Challenge } from '../lib/challenges';
import { PenaltyIndicator } from './PenaltyIndicator';
import { Dumbbell, Code, BookOpen, Globe, Sparkles, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react-native';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  fitness: Dumbbell,
  coding: Code,
  academics: BookOpen,
  language: Globe,
  custom: Sparkles,
  mindset: Sparkles,
};

const STATUS_COLORS: Record<string, string> = {
  active: '#38D9A9',
  completed: '#7C6FCD',
  failed: '#FF6B6B',
  paused: '#FCC419',
};

interface ChallengeCardProps {
  challenge: Challenge;
  onPress?: (challenge: Challenge) => void;
}

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const { theme } = useThemeStore();
  const Icon = CATEGORY_ICONS[challenge.category] || Sparkles;

  // Calculate progress
  const start = new Date(challenge.start_date);
  const today = new Date();
  const totalDays = challenge.duration_days;
  const daysPassed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const progress = Math.min(daysPassed / totalDays, 1);
  const progressPercent = Math.round(progress * 100);
  const daysLeft = Math.max(0, totalDays - daysPassed);

  const mode = challenge.difficulty_mode || 'medium';
  const maxPenalties = challenge.max_penalties ?? 7;
  const penaltiesUsed = challenge.penalties_used ?? 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      activeOpacity={0.8}
      onPress={() => onPress?.(challenge)}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: theme.accentBg }]}>
          <Icon color={theme.accent} size={20} />
        </View>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
            {challenge.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[challenge.status] + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[challenge.status] }]} />
              <Text style={[styles.statusText, { color: STATUS_COLORS[challenge.status] }]}>
                {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
              </Text>
            </View>
            <PenaltyIndicator compact difficultyMode={mode} maxPenalties={maxPenalties} penaltiesUsed={penaltiesUsed} />
          </View>
        </View>
        <ChevronRight color={theme.textMuted} size={18} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: theme.accent },
            ]}
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            Day {Math.min(daysPassed, totalDays)} of {totalDays}
          </Text>
          <Text style={[styles.progressPercent, { color: theme.accentText }]}>
            {progressPercent}%
          </Text>
        </View>
      </View>

      {/* Footer Stats */}
      <View style={styles.footer}>
        <View style={styles.footerStat}>
          <Calendar color={theme.textMuted} size={13} />
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
          </Text>
        </View>
        <View style={styles.footerStat}>
          <CheckCircle2 color={theme.textMuted} size={13} />
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            {challenge.tasks?.length || 0} tasks / day
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
