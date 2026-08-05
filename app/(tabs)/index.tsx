import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useChallengeStore } from '../../stores/challengeStore';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { ChallengeCard } from '../../components/ChallengeCard';
import { Flame, Plus, Target, ArrowUpRight } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const { activeChallenges, challenges, isLoading, loadChallenges } = useChallengeStore();

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'Challenger';
  const userId = user?.id || 'demo-user';

  useEffect(() => {
    loadChallenges(userId);
  }, [userId]);

  const handleRefresh = () => {
    loadChallenges(userId);
  };

  const completedCount = challenges.filter((c) => c.status === 'completed').length;
  const currentStreak = activeChallenges.length > 0 ? activeChallenges.length : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* App Bar Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.cardBorder }]}>
        <View>
          <Text style={[styles.greetingLabel, { color: theme.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.userNameText, { color: theme.textPrimary }]}>{displayName}</Text>
        </View>
        <ThemeSwitcher />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={theme.accent} />
        }
      >
        {/* Quick Stats Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.heroRow}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentBg }]}>
              <Flame color={theme.accent} size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroStatValue, { color: theme.textPrimary }]}>
                {activeChallenges.length} Active
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                {completedCount} completed · {challenges.length} total
              </Text>
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Active Challenges</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/new')} activeOpacity={0.7}>
            <View style={[styles.addBtn, { backgroundColor: theme.accentBg }]}>
              <Plus color={theme.accentText} size={16} />
              <Text style={[styles.addBtnText, { color: theme.accentText }]}>New</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {isLoading && activeChallenges.length === 0 && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.accent} size="large" />
          </View>
        )}

        {/* Active Challenge Cards */}
        {activeChallenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}

        {/* Empty State */}
        {!isLoading && activeChallenges.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Target color={theme.textMuted} size={48} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Active Challenges Yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Pick a pre-built template (75 Hard, 100 Days of Code, Language 30) or create a custom challenge to start logging daily.
            </Text>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: theme.accent }]}
              onPress={() => router.push('/(tabs)/new')}
              activeOpacity={0.85}
            >
              <Text style={styles.createBtnText}>Create Your First Challenge</Text>
              <ArrowUpRight color="#FFF" size={18} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  greetingLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  content: {
    padding: 20,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  heroStatLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
