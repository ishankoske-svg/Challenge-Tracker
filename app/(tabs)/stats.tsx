import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useChallengeStore } from '../../stores/challengeStore';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { PenaltyIndicator } from '../../components/PenaltyIndicator';
import { BarChart3, TrendingUp, Sparkles, AlertCircle, Calendar, Flag } from 'lucide-react-native';
import { fetchChallengeWithTasks, Challenge, ChallengeTask, updateChallengeStatus } from '../../lib/challenges';
import { fetchLogsForChallenge, getStreakForChallenge, DailyLog } from '../../lib/logs';
import { generateProgressSummary } from '../../lib/ai';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryLine, VictoryAxis, VictoryGroup } from 'victory-native';

export default function StatsScreen() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { activeChallenges, loadChallenges } = useChallengeStore();
  const userId = user?.id || 'demo-user';

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [aiSummary, setAiSummary] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Give Up state
  const [showGiveUpForm, setShowGiveUpForm] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [submittingGiveUp, setSubmittingGiveUp] = useState(false);

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
      loadStats(selectedChallengeId);
    } else {
      setLoading(false);
    }
  }, [selectedChallengeId]);

  const loadStats = async (challengeId: string) => {
    setLoading(true);

    const [{ challenge }, { logs: fetchedLogs }, currentStreak] = await Promise.all([
      fetchChallengeWithTasks(challengeId),
      fetchLogsForChallenge(challengeId, userId),
      getStreakForChallenge(challengeId, userId)
    ]);

    setCurrentChallenge(challenge);
    setLogs(fetchedLogs);
    setStreak(currentStreak);

    if (challenge && fetchedLogs.length > 0) {
      setGeneratingAi(true);
      const summary = await generateProgressSummary(challenge, fetchedLogs);
      setAiSummary(summary);
      setGeneratingAi(false);
    } else {
      setAiSummary('Log some days to get AI insights!');
    }

    setLoading(false);
  };

  const handleConfirmGiveUp = async () => {
    if (!selectedChallengeId) return;
    setSubmittingGiveUp(true);
    await updateChallengeStatus(selectedChallengeId, 'failed', failureReason.trim() || undefined);
    loadChallenges(userId);
    setSelectedChallengeId(null);
    setShowGiveUpForm(false);
    setFailureReason('');
    setSubmittingGiveUp(false);
  };

  // --- Data Aggregation ---

  // 1. Completion % Chart (Bar)
  const getBarChartData = () => {
    if (!currentChallenge || logs.length === 0) return [];
    
    // Take up to last 7 logs, chronologically
    const recentLogs = [...logs].reverse().slice(-7);
    const totalTasks = currentChallenge.tasks?.length || 1;

    return recentLogs.map((log) => {
      let completedCount = 0;
      if (log.tasks_completed) {
        Object.values(log.tasks_completed).forEach(val => {
          if (val === true || (val && typeof val === 'object' && val.completed)) completedCount++;
        });
      }
      return {
        x: log.log_date.slice(5, 10), // MM-DD
        y: Math.round((completedCount / totalTasks) * 100)
      };
    });
  };

  // 2. Numeric Metric Chart (Line)
  const getLineChartData = () => {
    if (!currentChallenge || logs.length === 0) return { data: [], task: null };

    const numericTask = currentChallenge.tasks?.find(t => t.type === 'numeric');
    if (!numericTask) return { data: [], task: null };

    const recentLogs = [...logs].reverse();
    const data = recentLogs
      .filter(l => l.tasks_completed && l.tasks_completed[numericTask.id] !== undefined)
      .map(l => {
        const val = l.tasks_completed[numericTask.id];
        const numValue = (typeof val === 'object' && val !== null) ? val.value : val;
        return {
          x: l.log_date.slice(5, 10),
          y: Number(numValue) || 0
        };
      });

    return { data, task: numericTask };
  };

  const barData = getBarChartData();
  const { data: lineData, task: numericTask } = getLineChartData();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.titleGroup}>
          <BarChart3 color={theme.accent} size={22} />
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Progress & Stats</Text>
        </View>
        <ThemeSwitcher />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Challenge Selector */}
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

        {/* Empty State */}
        {activeChallenges.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <AlertCircle color={theme.textMuted} size={44} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Active Challenge</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Create a challenge to see your progress and stats.
            </Text>
          </View>
        )}

        {loading && activeChallenges.length > 0 && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        )}

        {!loading && currentChallenge && (
          <>
            {/* Heart / Penalty Indicator */}
            <PenaltyIndicator
              difficultyMode={currentChallenge.difficulty_mode || 'medium'}
              maxPenalties={currentChallenge.max_penalties ?? 7}
              penaltiesUsed={currentChallenge.penalties_used ?? 0}
            />

            {/* Top Stat Cards */}
            <View style={styles.topStatsRow}>
              <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Calendar color={theme.textMuted} size={20} />
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>{logs.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Days Logged</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <TrendingUp color={theme.textMuted} size={20} />
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>{streak}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Day Streak</Text>
              </View>
            </View>

            {/* AI Summary Card */}
            <View style={[styles.aiCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.aiHeader}>
                <Sparkles color={theme.accent} size={18} />
                <Text style={[styles.aiTitle, { color: theme.textPrimary }]}>AI Insights</Text>
              </View>
              {generatingAi ? (
                <View style={styles.aiLoading}>
                  <ActivityIndicator size="small" color={theme.accent} />
                  <Text style={{ color: theme.textSecondary, marginLeft: 8 }}>Analyzing progress...</Text>
                </View>
              ) : (
                <Text style={[styles.aiText, { color: theme.textSecondary }]}>{aiSummary}</Text>
              )}
            </View>

            {/* Bar Chart (Completion) */}
            {barData.length > 0 ? (
              <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Task Completion (%)</Text>
                <View pointerEvents="none">
                  <VictoryChart theme={VictoryTheme.material} height={220} padding={{ top: 20, bottom: 40, left: 40, right: 20 }}>
                    <VictoryAxis 
                      style={{
                        tickLabels: { fill: theme.textSecondary, fontSize: 10 },
                        axis: { stroke: theme.cardBorder }
                      }} 
                    />
                    <VictoryAxis 
                      dependentAxis 
                      style={{
                        tickLabels: { fill: theme.textSecondary, fontSize: 10 },
                        axis: { stroke: theme.cardBorder }
                      }} 
                    />
                    <VictoryBar
                      data={barData}
                      style={{ data: { fill: theme.accent, width: 20, rx: 4 } }}
                      animate={{ duration: 500 }}
                      cornerRadius={{ top: 4, bottom: 4 }}
                    />
                  </VictoryChart>
                </View>
              </View>
            ) : (
              <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Task Completion (%)</Text>
                <Text style={[styles.emptySub, { color: theme.textMuted, marginTop: 20 }]}>Log some tasks to see charts.</Text>
              </View>
            )}

            {/* Line Chart (Numeric Metric) */}
            {numericTask && lineData.length > 0 && (
              <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
                  Trend: {numericTask.label} {numericTask.unit ? `(${numericTask.unit})` : ''}
                </Text>
                <View pointerEvents="none">
                  <VictoryChart theme={VictoryTheme.material} height={220} padding={{ top: 20, bottom: 40, left: 40, right: 20 }}>
                    <VictoryAxis 
                      style={{
                        tickLabels: { fill: theme.textSecondary, fontSize: 10 },
                        axis: { stroke: theme.cardBorder }
                      }} 
                    />
                    <VictoryAxis 
                      dependentAxis 
                      style={{
                        tickLabels: { fill: theme.textSecondary, fontSize: 10 },
                        axis: { stroke: theme.cardBorder }
                      }} 
                    />
                    <VictoryLine
                      data={lineData}
                      style={{
                        data: { stroke: theme.accent, strokeWidth: 3 },
                      }}
                      animate={{ duration: 500 }}
                    />
                  </VictoryChart>
                </View>
              </View>
            )}

            {/* Give Up Section */}
            {!showGiveUpForm ? (
              <TouchableOpacity
                style={[styles.giveUpBtn, { borderColor: theme.danger }]}
                onPress={() => setShowGiveUpForm(true)}
                activeOpacity={0.8}
              >
                <Flag color={theme.danger} size={16} />
                <Text style={[styles.giveUpText, { color: theme.danger }]}>Give Up Challenge</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.giveUpCard, { backgroundColor: theme.card, borderColor: theme.danger }]}>
                <Text style={[styles.giveUpCardTitle, { color: theme.danger }]}>Why are you giving up?</Text>
                <Text style={[styles.giveUpCardSub, { color: theme.textSecondary }]}>
                  Your feedback helps us understand common reasons people struggle. This is optional.
                </Text>
                <TextInput
                  style={[styles.reasonInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                  placeholder="e.g. Lost motivation, too busy at work, injury..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                  value={failureReason}
                  onChangeText={setFailureReason}
                />
                <View style={styles.giveUpActions}>
                  <TouchableOpacity
                    style={[styles.giveUpCancel, { borderColor: theme.cardBorder }]}
                    onPress={() => { setShowGiveUpForm(false); setFailureReason(''); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.giveUpCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.giveUpConfirm, { backgroundColor: theme.danger }]}
                    onPress={handleConfirmGiveUp}
                    activeOpacity={0.8}
                    disabled={submittingGiveUp}
                  >
                    {submittingGiveUp ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.giveUpConfirmText}>Confirm Give Up</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  screenTitle: { fontSize: 20, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 40 },
  pickerSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  pillScroll: { flexDirection: 'row' },
  challengePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginRight: 10 },
  pillText: { fontSize: 14, fontWeight: '700' },
  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  topStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  aiCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiTitle: { fontSize: 16, fontWeight: '700' },
  aiText: { fontSize: 14, lineHeight: 22 },
  aiLoading: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  chartCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  chartTitle: { fontSize: 16, fontWeight: '700', alignSelf: 'flex-start', marginBottom: 10 },
  giveUpBtn: { paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', marginTop: 8, marginBottom: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  giveUpText: { fontSize: 15, fontWeight: '700' },
  giveUpCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginTop: 8, marginBottom: 20 },
  giveUpCardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  giveUpCardSub: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  reasonInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 14, textAlignVertical: 'top', minHeight: 80, marginBottom: 16 },
  giveUpActions: { flexDirection: 'row', gap: 12 },
  giveUpCancel: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  giveUpCancelText: { fontSize: 14, fontWeight: '700' },
  giveUpConfirm: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  giveUpConfirmText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
