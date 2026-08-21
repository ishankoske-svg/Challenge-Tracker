import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { Brain, ArrowDownCircle, ArrowUpCircle, Check } from 'lucide-react-native';

interface CoachingCardProps {
  nudge: { text: string; actionItem?: string } | null;
  difficultySuggestion: 'step_down' | 'step_up' | null;
  onDismiss: () => void;
  onApplyDifficulty?: () => void;
}

export function CoachingCard({ nudge, difficultySuggestion, onDismiss, onApplyDifficulty }: CoachingCardProps) {
  const { theme } = useThemeStore();
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!nudge && !difficultySuggestion) return null;

  return (
    <Animated.View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Brain color={theme.accent} size={20} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>AI Coach</Text>
        </View>
      </View>

      {nudge && (
        <View style={styles.section}>
          <Text style={[styles.nudgeText, { color: theme.textSecondary }]}>{nudge.text}</Text>
          {nudge.actionItem && (
            <View style={[styles.actionBox, { backgroundColor: theme.surface }]}>
              <Check color={theme.primary} size={16} />
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>{nudge.actionItem}</Text>
            </View>
          )}
        </View>
      )}

      {difficultySuggestion && (
        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }]}>
          <View style={styles.suggestionRow}>
            {difficultySuggestion === 'step_down' ? (
              <ArrowDownCircle color={theme.danger} size={20} />
            ) : (
              <ArrowUpCircle color={theme.primary} size={20} />
            )}
            <Text style={[styles.suggestionText, { color: theme.textPrimary }]}>
              {difficultySuggestion === 'step_down' 
                ? "You're burning through penalties quickly. Consider stepping down the difficulty."
                : "You're crushing it! Consider stepping up the difficulty for a better multiplier."}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={onDismiss}>
          <Text style={[styles.btnText, { color: theme.textMuted }]}>Dismiss</Text>
        </TouchableOpacity>
        {difficultySuggestion && onApplyDifficulty && (
          <TouchableOpacity style={[styles.btn, styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={onApplyDifficulty}>
            <Text style={styles.primaryBtnText}>Adjust Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  section: {
    marginBottom: 12,
  },
  nudgeText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    paddingHorizontal: 20,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
