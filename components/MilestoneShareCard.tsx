import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useThemeStore } from '../stores/themeStore';
import { ShareCardData } from '../lib/analytics';
import { Share2, Target, Flame, Star, Zap } from 'lucide-react-native';

interface MilestoneShareCardProps {
  data: ShareCardData;
}

const { width } = Dimensions.get('window');

export function MilestoneShareCard({ data }: MilestoneShareCardProps) {
  const { theme } = useThemeStore();
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    try {
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            dialogTitle: 'Share your progress',
          });
        }
      }
    } catch (error) {
      console.error('Error sharing image', error);
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={[styles.captureContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                {data.challengeTitle}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {data.durationDays} Days • {data.difficultyMode.toUpperCase()} {data.difficultyEmoji}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Target size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{data.avgCompletionPct}%</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completion</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Flame size={20} color="#f97316" />
              <Text style={[styles.statValue, { color: theme.text }]}>{data.currentStreak}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Zap size={20} color="#eab308" />
              <Text style={[styles.statValue, { color: theme.text }]}>Lv. {data.level}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{data.levelTitle}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Star size={20} color="#8b5cf6" />
              <Text style={[styles.statValue, { color: theme.text }]}>{data.badgesEarned}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Badges</Text>
            </View>
          </View>

          {/* Footer Branding */}
          <View style={styles.footer}>
            <Text style={[styles.brandText, { color: theme.primary }]}>Challengr</Text>
            <Text style={[styles.progressText, { color: theme.textMuted }]}>
              Day {data.daysCompleted} / {data.durationDays}
            </Text>
          </View>
        </View>
      </ViewShot>

      <TouchableOpacity
        style={[styles.shareButton, { backgroundColor: theme.primary }]}
        onPress={handleShare}
      >
        <Share2 size={20} color="#FFFFFF" />
        <Text style={styles.shareButtonText}>Share Milestone</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    alignItems: 'center',
  },
  captureContainer: {
    width: width - 32,
    borderRadius: 20,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
