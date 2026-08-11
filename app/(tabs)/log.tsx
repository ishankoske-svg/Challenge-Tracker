import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useChallengeStore } from '../../stores/challengeStore';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { TaskRow } from '../../components/TaskRow';
import { PenaltyIndicator } from '../../components/PenaltyIndicator';
import { Challenge, fetchChallengeWithTasks, updateChallengeStatus, incrementPenalty } from '../../lib/challenges';
import { fetchLogForDate, saveLog, getStreakForChallenge, evaluateDayCompletion, isWithinGraceWindow, getDayNumber } from '../../lib/logs';
import { checkAndAwardBadges } from '../../lib/badges';
import { uploadProgressMedia, fetchMediaForLog } from '../../lib/storage';
import { CalendarCheck, Flame, CheckCircle2, AlertCircle, Shield, Sparkles, Heart } from 'lucide-react-native';

export default function LogScreen() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const { activeChallenges, loadChallenges } = useChallengeStore();

  const userId = user?.id || 'demo-user';

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form & state
  const [taskValues, setTaskValues] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<string>('');
  const [mediaUris, setMediaUris] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadChallenges(userId);
  }, [userId]);

  useEffect(() => {
    if (activeChallenges.length > 0 && !selectedChallengeId) {
      setSelectedChallengeId(activeChallenges[0].id);
    }
  }, [activeChallenges]);

  useEffect(() => {
    if (selectedChallengeId) {
      loadChallengeDetailsAndLog(selectedChallengeId, logDate);
    } else {
      setLoading(false);
    }
  }, [selectedChallengeId, logDate]);

  const loadChallengeDetailsAndLog = async (challengeId: string, date: string) => {
    setLoading(true);
    setSavedSuccess(false);

    // 1. Fetch challenge with tasks
    const { challenge } = await fetchChallengeWithTasks(challengeId);
    setCurrentChallenge(challenge);

    // 2. Fetch existing log for date
    const { log } = await fetchLogForDate(challengeId, userId, date);
    if (log) {
      setTaskValues(log.tasks_completed || {});
      setNotes(log.notes || '');

      // Load media
      const { media } = await fetchMediaForLog(log.id, userId);
      if (media && media.length > 0 && challenge?.tasks) {
        const photoTasks = challenge.tasks.filter(t => t.type === 'photo');
        const mediaMap: Record<string, string> = {};
        photoTasks.forEach((pt, idx) => {
          if (media[idx]) {
            mediaMap[pt.id] = media[idx].storage_path;
          }
        });
        setMediaUris(mediaMap);
      }
    } else {
      setTaskValues({});
      setNotes('');
      setMediaUris({});
    }

    // 3. Get streak
    const currentStreak = await getStreakForChallenge(challengeId, userId);
    setStreak(currentStreak);

    setLoading(false);
  };

  const handleTaskValueChange = (taskId: string, val: any) => {
    setTaskValues((prev) => ({ ...prev, [taskId]: val }));
    setSavedSuccess(false);
  };

  const handlePickMedia = (taskId: string, uri: string) => {
    setMediaUris((prev) => ({ ...prev, [taskId]: uri }));
    setSavedSuccess(false);
  };

  const handleRemoveMedia = (taskId: string) => {
    setMediaUris((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
    setSavedSuccess(false);
  };

  const handleSaveLog = async () => {
    if (!selectedChallengeId || !currentChallenge) return;

    if (!isWithinGraceWindow(logDate)) {
      Alert.alert('Grace Window Expired', 'Logs for past days can only be saved until 6:00 AM the next morning.');
      return;
    }

    setSaving(true);
    setSavedSuccess(false);

    // Evaluate scores & penalty
    const evaluation = evaluateDayCompletion(currentChallenge.tasks || [], taskValues);
    const dayNum = getDayNumber(currentChallenge.start_date, logDate);

    // 1. Save daily log entry
    const { log, error } = await saveLog(
      selectedChallengeId,
      userId,
      taskValues,
      notes,
      evaluation,
      dayNum,
      logDate,
    );

    if (error || !log) {
      setSaving(false);
      Alert.alert('Error', error || 'Failed to save daily log.');
      return;
    }

    // 2. Upload media
    for (const taskId of Object.keys(mediaUris)) {
      const uri = mediaUris[taskId];
      if (uri && (uri.startsWith('file://') || uri.startsWith('data:') || uri.startsWith('blob:'))) {
        await uploadProgressMedia(userId, log.id, uri, 'image');
      }
    }

    // 3. Handle Penalty if compulsory incomplete
    let penaltyIncurred = false;
    let challengeFailed = false;

    if (evaluation.penalty) {
      penaltyIncurred = true;
      const res = await incrementPenalty(selectedChallengeId);
      challengeFailed = res.failed;
      
      // Update local state
      setCurrentChallenge(prev => prev ? { ...prev, penalties_used: res.newCount, status: res.failed ? 'failed' : prev.status } : null);
      loadChallenges(userId);
    }

    // 4. Recalculate streak
    const newStreak = await getStreakForChallenge(selectedChallengeId, userId);
    setStreak(newStreak);

    // 5. Check for badge unlocks or completion
    if (logDate === currentChallenge.end_date && !challengeFailed && evaluation.compulsory_pct === 100) {
      await updateChallengeStatus(selectedChallengeId, 'completed');
      const earned = await checkAndAwardBadges(userId, 'challenge_completed');
      if (earned.length > 0) {
        Alert.alert('Challenge Completed & Badges Unlocked! 🎉', `Badges earned: ${earned.map(b => b.name).join(', ')}`);
      } else {
        Alert.alert('Challenge Completed! 🏆', 'Great job finishing the challenge!');
      }
    } else if (challengeFailed) {
      Alert.alert(
        'Challenge Failed 💔',
        `You triggered a penalty today and ran out of lives (${currentChallenge.max_penalties} max). Keep your head up and start fresh!`,
      );
    } else if (penaltyIncurred) {
      const remaining = currentChallenge.max_penalties - (currentChallenge.penalties_used + 1);
      Alert.alert(
        'Penalty Triggered! ⚠️',
        `Core tasks were incomplete today. You used 1 penalty buffer (${remaining} remaining).`,
      );
    } else {
      const earned = await checkAndAwardBadges(userId, 'log_saved', selectedChallengeId);
      if (earned.length > 0) {
        Alert.alert('Badges Unlocked!', `You earned: ${earned.map(b => b.name).join(', ')}`);
      }
    }

    setSaving(false);
    setSavedSuccess(true);
  };

  const tasks = currentChallenge?.tasks || [];
  const currentEvaluation = evaluateDayCompletion(tasks, taskValues);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.titleGroup}>
          <CalendarCheck color={theme.accent} size={22} />
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Daily Log</Text>
        </View>
        <ThemeSwitcher />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Challenge Selector Pills */}
        {activeChallenges.length > 0 && (
          <View style={styles.pickerSection}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SELECT CHALLENGE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {activeChallenges.map((c) => {
                const isSelected = c.id === selectedChallengeId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.challengePill,
                      {
                        backgroundColor: isSelected ? theme.accent : theme.card,
                        borderColor: isSelected ? theme.accent : theme.cardBorder,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedChallengeId(c.id)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isSelected ? '#FFF' : theme.textPrimary },
                      ]}
                    >
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Empty State if No Active Challenge */}
        {activeChallenges.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <AlertCircle color={theme.textMuted} size={44} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Active Challenge</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Create a challenge in the New tab first to start logging your daily progress!
            </Text>
          </View>
        )}

        {/* Challenge Banner & Penalties */}
        {currentChallenge && (
          <>
            <View style={[styles.streakBanner, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.fireIcon, { backgroundColor: theme.accentBg }]}>
                <Flame color={theme.accent} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.streakCount, { color: theme.textPrimary }]}>{streak} Day Streak</Text>
                <Text style={[styles.streakSub, { color: theme.textSecondary }]}>
                  {logDate === new Date().toISOString().split('T')[0] ? "Today's Log Entry" : `Log for ${logDate}`}
                </Text>
              </View>
            </View>

            {/* Heart / Lives Penalty Indicator */}
            <PenaltyIndicator
              difficultyMode={currentChallenge.difficulty_mode || 'medium'}
              maxPenalties={currentChallenge.max_penalties ?? 7}
              penaltiesUsed={currentChallenge.penalties_used ?? 0}
            />

            {/* Dual Meter Score Display */}
            <View style={[styles.scoreMeterCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.meterRow}>
                <View style={styles.meterHeader}>
                  <Shield color={theme.accentText} size={14} />
                  <Text style={[styles.meterTitle, { color: theme.textPrimary }]}>Core Tasks: {currentEvaluation.compulsory_pct}%</Text>
                </View>
                <View style={[styles.meterTrack, { backgroundColor: theme.inputBg }]}>
                  <View
                    style={[
                      styles.meterFill,
                      { width: `${currentEvaluation.compulsory_pct}%`, backgroundColor: currentEvaluation.compulsory_pct === 100 ? theme.success : theme.accent },
                    ]}
                  />
                </View>
              </View>

              <View style={[styles.meterRow, { marginTop: 10 }]}>
                <View style={styles.meterHeader}>
                  <Sparkles color={theme.textMuted} size={14} />
                  <Text style={[styles.meterTitle, { color: theme.textSecondary }]}>Bonus Tasks: {currentEvaluation.optional_pct}%</Text>
                </View>
                <View style={[styles.meterTrack, { backgroundColor: theme.inputBg }]}>
                  <View
                    style={[
                      styles.meterFill,
                      { width: `${currentEvaluation.optional_pct}%`, backgroundColor: theme.warning },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Saved Toast Banner */}
            {savedSuccess && (
              <View style={[styles.successBanner, { backgroundColor: theme.accentBg, borderColor: theme.accentBorder }]}>
                <CheckCircle2 color={theme.accentText} size={18} />
                <Text style={[styles.successText, { color: theme.accentText }]}>Log saved successfully!</Text>
              </View>
            )}

            {/* Loading Indicator */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={theme.accent} />
              </View>
            ) : (
              <>
                {/* Task List */}
                <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                  DAILY TASKS ({tasks.length})
                </Text>

                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    value={taskValues[task.id]}
                    onChangeValue={handleTaskValueChange}
                    mediaUri={mediaUris[task.id]}
                    onPickMedia={handlePickMedia}
                    onRemoveMedia={handleRemoveMedia}
                  />
                ))}

                {/* Additional Journal Notes */}
                <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 16 }]}>
                  DAILY REFLECTION / NOTES (OPTIONAL)
                </Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
                  ]}
                  placeholder="How did today's challenge feel? Any wins or struggles?"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={(val) => {
                    setNotes(val);
                    setSavedSuccess(false);
                  }}
                />

                {/* Save CTA Button */}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: savedSuccess ? '#10b981' : theme.accent }]}
                  activeOpacity={0.85}
                  onPress={handleSaveLog}
                  disabled={saving || savedSuccess}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : savedSuccess ? (
                    <View style={styles.btnContent}>
                      <CheckCircle2 color="#FFF" size={20} />
                      <Text style={styles.saveBtnText}>Saved!</Text>
                    </View>
                  ) : (
                    <View style={styles.btnContent}>
                      <CheckCircle2 color="#FFF" size={20} />
                      <Text style={styles.saveBtnText}>Save Today's Log</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  screenTitle: { fontSize: 20, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 40 },
  pickerSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  pillScroll: { flexDirection: 'row' },
  challengePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginRight: 10 },
  pillText: { fontSize: 14, fontWeight: '700' },
  streakBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  fireIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  streakCount: { fontSize: 18, fontWeight: '800' },
  streakSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  scoreMeterCard: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 16 },
  meterRow: {},
  meterHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  meterTitle: { fontSize: 12, fontWeight: '700' },
  meterTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  successText: { fontSize: 14, fontWeight: '700' },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  notesInput: { height: 90, borderRadius: 14, paddingHorizontal: 16, paddingTop: 12, fontSize: 14, borderWidth: 1, textAlignVertical: 'top' },
  saveBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
