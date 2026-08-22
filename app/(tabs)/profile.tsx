import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { THEMES, ThemeKey } from '../../theme/themes';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { User, LogOut, ShieldCheck, Palette, Target, CheckCircle2, XCircle, Award, Flame, Zap } from 'lucide-react-native';
import { BadgeGrid } from '../../components/BadgeGrid';
import { fetchUserBadges, ALL_BADGES, getUserXPAndLevel } from '../../lib/badges';
import { fetchChallenges, Challenge } from '../../lib/challenges';
import { FailureInsights } from '../../components/FailureInsights';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, themeKey, setTheme } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [earnedKeys, setEarnedKeys] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [xpData, setXpData] = useState<{ totalXP: number; level: number; levelTitle: string; xpNextLevel: number }>({
    totalXP: 0,
    level: 1,
    levelTitle: 'Novice',
    xpNextLevel: 100,
  });

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'Challenger';
  const email = user?.email || 'user@challengr.app';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ earnedBadges }, { challenges: fetchedChallenges }, userXp] = await Promise.all([
      fetchUserBadges(user.id),
      fetchChallenges(user.id),
      getUserXPAndLevel(user.id),
    ]);
    
    const keys = earnedBadges.map(ub => ALL_BADGES.find(b => b.id === ub.badge_id)?.key).filter(Boolean) as string[];
    setEarnedKeys(keys);
    setChallenges(fetchedChallenges);
    setXpData(userXp);
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const completedCount = challenges.filter(c => c.status === 'completed').length;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.titleGroup}>
          <User color={theme.accent} size={22} />
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Profile</Text>
        </View>
        <ThemeSwitcher />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.accentBg, borderColor: theme.accentBorder }]}>
            <Text style={[styles.avatarText, { color: theme.accentText }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{email}</Text>

          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: theme.accentBg }]}>
              <ShieldCheck color={theme.accentText} size={14} />
              <Text style={[styles.tagText, { color: theme.accentText }]}>Active Member</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.cardBorder }]}>
              <Palette color={theme.textPrimary} size={14} />
              <Text style={[styles.tagText, { color: theme.textPrimary }]}>Theme: {theme.name}</Text>
            </View>
          </View>
        </View>

        {loading ? (
           <ActivityIndicator size="large" color={theme.accent} style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* Level & XP Card */}
            <View style={[styles.xpCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.xpHeader}>
                <View style={styles.levelBadge}>
                  <Zap color={theme.accent} size={16} />
                  <Text style={[styles.levelText, { color: theme.textPrimary }]}>
                    Level {xpData.level} — {xpData.levelTitle}
                  </Text>
                </View>
                <Text style={[styles.xpTotalText, { color: theme.accentText }]}>
                  {xpData.totalXP} XP
                </Text>
              </View>

              <View style={styles.xpTrackContainer}>
                <View style={[styles.xpTrack, { backgroundColor: theme.inputBg }]}>
                  <View
                    style={[
                      styles.xpFill,
                      { width: `${Math.min(100, Math.max(10, 100 - (xpData.xpNextLevel / (xpData.xpNextLevel + 50)) * 100))}%`, backgroundColor: theme.accent },
                    ]}
                  />
                </View>
                <Text style={[styles.xpNextText, { color: theme.textSecondary }]}>
                  {xpData.xpNextLevel} XP to Level {xpData.level + 1}
                </Text>
              </View>
            </View>

            {/* Badges Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <Award color={theme.accent} size={18} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Badges & Rewards</Text>
              </View>
              <Text style={[styles.sectionSub, { color: theme.textSecondary, marginBottom: 16 }]}>
                {earnedKeys.length} / {ALL_BADGES.length} Badges Unlocked
              </Text>
              <BadgeGrid earnedKeys={earnedKeys} />
            </View>

            {/* Failure Insights */}
            <FailureInsights challenges={challenges} />

            {/* Challenge History */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Challenge History</Text>
              <Text style={[styles.sectionSub, { color: theme.textSecondary, marginBottom: 16 }]}>
                {completedCount} Challenges Completed
              </Text>
              
              {challenges.length === 0 ? (
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>No challenges yet.</Text>
              ) : (
                challenges.map((c, i) => {
                  const isLast = i === challenges.length - 1;
                  return (
                    <View key={c.id} style={[styles.historyRow, { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: theme.cardBorder }]}>
                      <View style={styles.historyIcon}>
                        {c.status === 'completed' && <CheckCircle2 color="#10b981" size={20} />}
                        {c.status === 'failed' && <XCircle color={theme.danger} size={20} />}
                        {c.status === 'active' && <Target color={theme.accent} size={20} />}
                        {c.status === 'paused' && <Target color={theme.textMuted} size={20} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyTitle, { color: theme.textPrimary }]}>{c.title}</Text>
                        <Text style={[styles.historyDetails, { color: theme.textSecondary }]}>
                          {c.duration_days} days • {c.domain_tag || c.category} • {c.difficulty_mode || 'medium'}
                        </Text>
                        {c.status === 'failed' && c.failure_reason ? (
                          <Text style={[styles.failureReasonText, { color: theme.textMuted }]} numberOfLines={2}>
                            "{c.failure_reason}"
                          </Text>
                        ) : null}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: c.status === 'completed' ? '#10b98120' : c.status === 'failed' ? theme.dangerBg : theme.accentBg }]}>
                         <Text style={[styles.statusText, { color: c.status === 'completed' ? '#10b981' : c.status === 'failed' ? theme.danger : theme.accent }]}>
                           {c.status.toUpperCase()}
                         </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Themes & Visual Styling */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <Palette color={theme.accent} size={18} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Theme & Appearance</Text>
              </View>
              <Text style={[styles.sectionSub, { color: theme.textSecondary, marginBottom: 16 }]}>
                Choose from 8 tailored color schemes
              </Text>
              
              <View style={styles.themeGrid}>
                {([
                  'midnight',
                  'forest',
                  'ember',
                  'light',
                  'dark',
                  'lavender',
                  'gold',
                  'silver',
                ] as ThemeKey[]).map((key) => {
                  const t = THEMES[key];
                  const isSelected = themeKey === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.themeItemCard,
                        {
                          backgroundColor: isSelected ? theme.accentBg : theme.inputBg,
                          borderColor: isSelected ? theme.accent : theme.inputBorder,
                        },
                      ]}
                      onPress={() => setTheme(key)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.themePreviewRow}>
                        <View style={[styles.colorDot, { backgroundColor: t.bg, borderColor: t.cardBorder, borderWidth: 1 }]} />
                        <View style={[styles.colorDot, { backgroundColor: t.card }]} />
                        <View style={[styles.colorDot, { backgroundColor: t.accent }]} />
                      </View>
                      <Text style={[styles.themeItemName, { color: isSelected ? theme.accentText : theme.textPrimary }]}>
                        {t.name}
                      </Text>
                      {isSelected && (
                        <View style={[styles.selectedCheck, { backgroundColor: theme.accent }]}>
                          <CheckCircle2 color="#FFF" size={12} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut color={theme.danger} size={18} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  screenTitle: { fontSize: 20, fontWeight: '800' },
  content: { padding: 20 },
  userCard: { borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800' },
  userName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 16 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  tagText: { fontSize: 12, fontWeight: '700' },
  xpCard: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 20 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelText: { fontSize: 16, fontWeight: '800' },
  xpTotalText: { fontSize: 16, fontWeight: '800' },
  xpTrackContainer: {},
  xpTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: 8, borderRadius: 4 },
  xpNextText: { fontSize: 11, fontWeight: '600', textAlign: 'right' },
  sectionCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSub: { fontSize: 13, lineHeight: 18 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  historyIcon: { width: 24, alignItems: 'center' },
  historyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  historyDetails: { fontSize: 12, textTransform: 'capitalize' },
  failureReasonText: { fontSize: 11, fontStyle: 'italic', marginTop: 4, lineHeight: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1, marginBottom: 40 },
  logoutText: { fontSize: 15, fontWeight: '700' },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  themeItemCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 4,
    position: 'relative',
  },
  themePreviewRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeItemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
