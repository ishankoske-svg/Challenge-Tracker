import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { Challenge, ChallengeTask, pauseChallenge, resumeChallenge, updateChallengeTaskTarget } from '../lib/challenges';
import {
  X,
  Palmtree,
  Play,
  Sliders,
  CheckCircle2,
  Plus,
  Minus,
  AlertCircle,
  Calendar,
} from 'lucide-react-native';

interface ChallengeSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  challenge: Challenge;
  onUpdated: () => void;
}

export function ChallengeSettingsModal({
  visible,
  onClose,
  challenge,
  onUpdated,
}: ChallengeSettingsModalProps) {
  const { theme } = useThemeStore();

  const [pauseDays, setPauseDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [taskTargets, setTaskTargets] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    challenge.tasks?.forEach((t) => {
      if (t.task_type === 'definite') {
        map[t.id] = t.target_quantity || 1;
      }
    });
    return map;
  });

  const remainingPauseDays = challenge.pause_days_remaining !== undefined ? challenge.pause_days_remaining : 3;
  const isPaused = !!challenge.is_paused;

  const handlePause = async () => {
    setLoading(true);
    const { success, error } = await pauseChallenge(challenge.id, pauseDays);
    setLoading(false);
    if (success) {
      Alert.alert('Vacation Mode Activated', `Challenge is paused for ${pauseDays} day(s). End date extended!`);
      onUpdated();
      onClose();
    } else {
      Alert.alert('Error', error || 'Failed to pause challenge');
    }
  };

  const handleResume = async () => {
    setLoading(true);
    const { success, error } = await resumeChallenge(challenge.id);
    setLoading(false);
    if (success) {
      Alert.alert('Challenge Resumed', 'Welcome back! Your streak and challenge are active again.');
      onUpdated();
      onClose();
    } else {
      Alert.alert('Error', error || 'Failed to resume challenge');
    }
  };

  const handleUpdateTarget = async (taskId: string) => {
    const target = taskTargets[taskId];
    if (!target || target < 1) return;
    setLoading(true);
    const { success, error } = await updateChallengeTaskTarget(taskId, target);
    setLoading(false);
    if (success) {
      Alert.alert('Target Updated', `Daily goal updated to ${target}`);
      onUpdated();
    } else {
      Alert.alert('Error', error || 'Failed to update target');
    }
  };

  const definiteTasks = challenge.tasks?.filter((t) => t.task_type === 'definite') || [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleRow}>
              <Sliders color={theme.accent} size={18} />
              <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                {challenge.title} · Settings
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
              <X color={theme.text} size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* 1. VACATION / PAUSE MODE */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <Palmtree color="#FFA502" size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Vacation / Freeze Mode</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                    Freeze challenge without losing hearts. Total allowed: {remainingPauseDays}/3 days left.
                  </Text>
                </View>
              </View>

              {isPaused ? (
                <View style={[styles.statusBox, { backgroundColor: 'rgba(255, 165, 2, 0.15)', borderColor: '#FFA502' }]}>
                  <Text style={[styles.statusBoxText, { color: '#FFA502' }]}>
                    🌴 Challenge is currently PAUSED. Unlogged days won't burn hearts.
                  </Text>
                  <TouchableOpacity
                    onPress={handleResume}
                    disabled={loading}
                    style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Play color="#FFFFFF" size={16} />
                        <Text style={styles.actionBtnText}>Resume Challenge Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pauseActionBox}>
                  {remainingPauseDays > 0 ? (
                    <>
                      <Text style={[styles.label, { color: theme.text }]}>Select Pause Duration:</Text>
                      <View style={styles.daysSelectorRow}>
                        {[1, 2, 3].map((days) => {
                          const disabled = days > remainingPauseDays;
                          const isSelected = pauseDays === days;
                          return (
                            <TouchableOpacity
                              key={days}
                              disabled={disabled}
                              onPress={() => setPauseDays(days)}
                              style={[
                                styles.dayOptionBtn,
                                {
                                  backgroundColor: isSelected ? theme.accent : theme.surface,
                                  borderColor: isSelected ? theme.accent : theme.border,
                                  opacity: disabled ? 0.4 : 1,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayOptionText,
                                  { color: isSelected ? '#000000' : theme.text },
                                ]}
                              >
                                {days} {days === 1 ? 'Day' : 'Days'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <TouchableOpacity
                        onPress={handlePause}
                        disabled={loading}
                        style={[styles.actionBtn, { backgroundColor: '#FFA502' }]}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#000000" />
                        ) : (
                          <>
                            <Palmtree color="#000000" size={16} />
                            <Text style={[styles.actionBtnText, { color: '#000000' }]}>
                              Activate {pauseDays}-Day Freeze
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={[styles.exhaustedText, { color: theme.textMuted }]}>
                      You have used all 3 vacation freeze days for this challenge.
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* 2. MID-CHALLENGE TASK TARGET ADJUSTMENTS */}
            {definiteTasks.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.sectionHeader}>
                  <Sliders color={theme.primary} size={20} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Adjust Daily Targets</Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                      Tune daily numeric targets to adapt to your evolving fitness/study capacity.
                    </Text>
                  </View>
                </View>

                {definiteTasks.map((t) => {
                  const currentVal = taskTargets[t.id] ?? t.target_quantity ?? 1;
                  return (
                    <View
                      key={t.id}
                      style={[styles.taskTargetRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.taskLabel, { color: theme.text }]}>{t.label}</Text>
                        <Text style={[styles.unitText, { color: theme.textMuted }]}>
                          Unit: {t.unit || 'reps/count'}
                        </Text>
                      </View>

                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          onPress={() =>
                            setTaskTargets((prev) => ({
                              ...prev,
                              [t.id]: Math.max(1, (prev[t.id] || 1) - 1),
                            }))
                          }
                          style={[styles.stepperBtn, { backgroundColor: theme.card }]}
                        >
                          <Minus color={theme.text} size={14} />
                        </TouchableOpacity>

                        <Text style={[styles.targetValueText, { color: theme.text }]}>{currentVal}</Text>

                        <TouchableOpacity
                          onPress={() =>
                            setTaskTargets((prev) => ({
                              ...prev,
                              [t.id]: (prev[t.id] || 1) + 1,
                            }))
                          }
                          style={[styles.stepperBtn, { backgroundColor: theme.card }]}
                        >
                          <Plus color={theme.text} size={14} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleUpdateTarget(t.id)}
                        disabled={loading || currentVal === t.target_quantity}
                        style={[
                          styles.saveTargetBtn,
                          {
                            backgroundColor:
                              currentVal !== t.target_quantity ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.saveTargetText,
                            { color: currentVal !== t.target_quantity ? '#FFFFFF' : theme.textMuted },
                          ]}
                        >
                          Save
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  statusBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statusBoxText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pauseActionBox: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exhaustedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  taskTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  taskLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  unitText: {
    fontSize: 11,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetValueText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  saveTargetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveTargetText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
