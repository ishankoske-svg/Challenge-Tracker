import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { Challenge, isChallengeFailed } from '../lib/challenges';
import { PenaltyIndicator } from './PenaltyIndicator';
import { Dumbbell, Code, BookOpen, Globe, Sparkles, ChevronRight, Calendar, CheckCircle2, Lock, XCircle } from 'lucide-react-native';

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
  const isFailed = isChallengeFailed(challenge);
  const Icon = isFailed ? XCircle : (CATEGORY_ICONS[challenge.category] || Sparkles);

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

  const handlePress = () => {
    if (isFailed) {
      Alert.alert(
        'Challenge Failed 💔',
        'All penalty buffers were exhausted for this challenge. It is permanently locked and cannot be accessed.',
        [{ text: 'OK' }]
      );
      return;
    }
    onPress?.(challenge);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isFailed ? (theme.dangerBg || 'rgba(255, 107, 107, 0.08)') : theme.card,
          borderColor: isFailed ? theme.danger : theme.cardBorder,
          borderWidth: isFailed ? 2 : 1,
        },
      ]}
      activeOpacity={isFailed ? 0.9 : 0.8}
      onPress={handlePress}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: isFailed ? 'rgba(255, 107, 107, 0.2)' : theme.accentBg }]}>
          <Icon color={isFailed ? theme.danger : theme.accent} size={20} />
        </View>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, { color: isFailed ? theme.danger : theme.textPrimary }]} numberOfLines={1}>
            {challenge.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, { backgroundColor: isFailed ? 'rgba(255, 107, 107, 0.2)' : (challenge.is_paused ? '#FFA502' : STATUS_COLORS[challenge.status]) + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: isFailed ? theme.danger : (challenge.is_paused ? '#FFA502' : STATUS_COLORS[challenge.status]) }]} />
              <Text style={[styles.statusText, { color: isFailed ? theme.danger : (challenge.is_paused ? '#FFA502' : STATUS_COLORS[challenge.status]) }]}>
                {isFailed ? 'Challenge Failed' : challenge.is_paused ? '🌴 Paused' : challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
              </Text>
            </View>
            <PenaltyIndicator compact difficultyMode={mode} maxPenalties={maxPenalties} penaltiesUsed={penaltiesUsed} />
          </View>
        </View>
        {isFailed ? (
          <View style={[styles.lockBadge, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
            <Lock color={theme.danger} size={16} />
          </View>
        ) : (
          <ChevronRight color={theme.textMuted} size={18} />
        )}
      </View>

      {/* Failed Lock Notice */}
      {isFailed && (
        <View style={[styles.failedBanner, { backgroundColor: 'rgba(255, 107, 107, 0.15)', borderColor: theme.danger }]}>
          <Lock color={theme.danger} size={14} />
          <Text style={[styles.failedBannerText, { color: theme.danger }]}>
            Penalties exhausted ({penaltiesUsed}/{maxPenalties} used). Access locked.
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: isFailed ? theme.danger : theme.accent },
            ]}
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: isFailed ? theme.danger : theme.textSecondary }]}>
            Day {Math.min(daysPassed, totalDays)} of {totalDays} {isFailed ? '· Terminated' : ''}
          </Text>
          <Text style={[styles.progressPercent, { color: isFailed ? theme.danger : theme.accentText }]}>
            {progressPercent}%
          </Text>
        </View>
      </View>

      {/* Footer Stats */}
      <View style={styles.footer}>
        <View style={styles.footerStat}>
          <Calendar color={theme.textMuted} size={13} />
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            {isFailed ? 'Failed' : daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
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
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  failedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
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
