import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { User, LogOut, ShieldCheck, Award, Flame, Palette } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, themeKey } = useThemeStore();

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'Challenger';
  const email = user?.email || 'user@challengr.app';

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* App Bar Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.titleGroup}>
          <User color={theme.accent} size={22} />
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Profile</Text>
        </View>
        <ThemeSwitcher />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Badge Card */}
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

        {/* Section Card */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Badges & Milestone Rewards</Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
            Badge unlock logic and milestone rewards grid will be connected in Phase 5.
          </Text>
        </View>

        {/* Logout Action Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut color={theme.danger} size={18} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>Sign Out of Account</Text>
        </TouchableOpacity>
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
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    padding: 20,
  },
  userCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
