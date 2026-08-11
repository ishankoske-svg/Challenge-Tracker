import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { Challenge } from '../lib/challenges';
import { PieChart } from 'lucide-react-native';

// Keyword-to-category mapping for failure reason analysis
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Motivation': ['motivation', 'motivated', 'bored', 'boring', 'interest', 'interested', 'lazy', 'laziness', 'willpower', 'discipline', 'gave up', 'quit', 'pointless', 'uninspired'],
  'Time / Schedule': ['time', 'busy', 'schedule', 'work', 'job', 'workload', 'overworked', 'commitments', 'deadline', 'deadlines', 'hectic', 'overwhelmed'],
  'Health / Injury': ['health', 'sick', 'illness', 'injury', 'injured', 'pain', 'hurt', 'hospital', 'doctor', 'medical', 'mental health', 'anxiety', 'depression', 'burnout', 'exhausted', 'tired', 'fatigue'],
  'Too Difficult': ['hard', 'difficult', 'tough', 'impossible', 'unrealistic', 'too much', 'overwhelming', 'struggled', 'struggle', 'challenging', 'intense'],
  'Life Events': ['travel', 'moving', 'moved', 'family', 'emergency', 'vacation', 'holiday', 'personal', 'relationship', 'breakup', 'life', 'unexpected'],
  'Lost Consistency': ['forgot', 'forget', 'missed', 'skipped', 'inconsistent', 'streak', 'routine', 'habit', 'fell off', 'slipped', 'gap'],
};

export interface FailureCategory {
  category: string;
  count: number;
  percentage: number;
}

export function analyzeFailureReasons(challenges: Challenge[]): FailureCategory[] {
  const failedWithReason = challenges.filter(c => c.status === 'failed' && c.failure_reason && c.failure_reason.trim().length > 0);
  
  if (failedWithReason.length === 0) return [];

  const categoryCounts: Record<string, number> = {};
  let totalCategorized = 0;

  for (const challenge of failedWithReason) {
    const reason = challenge.failure_reason!.toLowerCase();
    const matchedCategories = new Set<string>();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        if (reason.includes(kw)) {
          matchedCategories.add(category);
          break;
        }
      }
    }

    // If no category matched, tag as "Other"
    if (matchedCategories.size === 0) {
      matchedCategories.add('Other');
    }

    for (const cat of matchedCategories) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      totalCategorized++;
    }
  }

  // Calculate percentages and sort descending
  const results: FailureCategory[] = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalCategorized) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return results;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Motivation': '#F59E0B',
  'Time / Schedule': '#3B82F6',
  'Health / Injury': '#EF4444',
  'Too Difficult': '#8B5CF6',
  'Life Events': '#EC4899',
  'Lost Consistency': '#F97316',
  'Other': '#6B7280',
};

interface FailureInsightsProps {
  challenges: Challenge[];
}

export function FailureInsights({ challenges }: FailureInsightsProps) {
  const { theme } = useThemeStore();
  const categories = analyzeFailureReasons(challenges);
  const failedCount = challenges.filter(c => c.status === 'failed').length;
  const withReasonCount = challenges.filter(c => c.status === 'failed' && c.failure_reason?.trim()).length;

  if (failedCount === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.headerRow}>
        <PieChart color={theme.accent} size={18} />
        <Text style={[styles.title, { color: theme.textPrimary }]}>Why Challenges Fail</Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Based on {withReasonCount} of {failedCount} failed challenge{failedCount !== 1 ? 's' : ''} with feedback
      </Text>

      {categories.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No failure reasons provided yet. Reasons are collected when you give up a challenge.
        </Text>
      ) : (
        <View style={styles.barList}>
          {categories.map((cat) => {
            const color = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS['Other'];
            return (
              <View key={cat.category} style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <Text style={[styles.barLabel, { color: theme.textPrimary }]}>{cat.category}</Text>
                  <Text style={[styles.barPercent, { color: theme.textSecondary }]}>{cat.percentage}%</Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.inputBg }]}>
                  <View style={[styles.barFill, { width: `${cat.percentage}%`, backgroundColor: color }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  emptyText: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  barList: { gap: 14 },
  barRow: {},
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  barLabel: { fontSize: 13, fontWeight: '700' },
  barPercent: { fontSize: 13, fontWeight: '600' },
  barTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
});
