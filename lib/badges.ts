import { supabase, isSupabaseConfigured } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreakForChallenge } from './logs';
import { fetchChallenges } from './challenges';

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export const ALL_BADGES: Badge[] = [
  { id: 'badge-first-win', key: 'first_win', name: 'First Win', description: 'Complete your first challenge.', icon: 'award' },
  { id: 'badge-streak-7', key: 'streak_7', name: '7-Day Streak', description: 'Log 7 consecutive days on any challenge.', icon: 'flame' },
  { id: 'badge-streak-30', key: 'streak_30', name: '30-Day Streak', description: 'Log 30 consecutive days on any challenge.', icon: 'zap' },
  { id: 'badge-days-100', key: 'days_100', name: 'Century Club', description: 'Complete a 100-day challenge.', icon: 'star' },
  { id: 'badge-fitness', key: 'fitness_starter', name: 'Fitness Starter', description: 'Complete a fitness challenge.', icon: 'activity' },
  { id: 'badge-coding', key: 'coding_starter', name: 'Code Newbie', description: 'Complete a coding challenge.', icon: 'code' },
  { id: 'badge-polyglot', key: 'polyglot', name: 'Polyglot', description: 'Complete a language challenge.', icon: 'globe' },
];

const DEMO_USER_BADGES_KEY = '@challengr_demo_user_badges';

function generateId(): string {
  return 'ub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// ---------- DEMO (offline) STORAGE ----------

async function getDemoUserBadges(): Promise<UserBadge[]> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_USER_BADGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveDemoUserBadges(badges: UserBadge[]): Promise<void> {
  await AsyncStorage.setItem(DEMO_USER_BADGES_KEY, JSON.stringify(badges));
}

// ---------- PUBLIC API ----------

export async function fetchUserBadges(userId: string): Promise<{ earnedBadges: UserBadge[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const all = await getDemoUserBadges();
    return { earnedBadges: all.filter(ub => ub.user_id === userId), error: null };
  }

  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId);

  return { earnedBadges: data as UserBadge[] || [], error: error?.message || null };
}

export async function checkAndAwardBadges(
  userId: string,
  event: 'log_saved' | 'challenge_completed',
  challengeId?: string
): Promise<Badge[]> {
  const { earnedBadges } = await fetchUserBadges(userId);
  const earnedKeys = earnedBadges.map(ub => ALL_BADGES.find(b => b.id === ub.badge_id)?.key).filter(Boolean);
  
  let newBadgesToAward: Badge[] = [];

  // Helper to safely add badge to award list
  const tryAward = (key: string) => {
    if (!earnedKeys.includes(key) && !newBadgesToAward.find(b => b.key === key)) {
      const badge = ALL_BADGES.find(b => b.key === key);
      if (badge) newBadgesToAward.push(badge);
    }
  };

  if (event === 'log_saved' && challengeId) {
    const streak = await getStreakForChallenge(challengeId, userId);
    if (streak >= 7) tryAward('streak_7');
    if (streak >= 30) tryAward('streak_30');
  }

  if (event === 'challenge_completed') {
    const { challenges } = await fetchChallenges(userId, 'completed');
    if (challenges.length >= 1) {
      tryAward('first_win');
    }
    
    // Check categories and duration
    for (const c of challenges) {
      if (c.category === 'fitness') tryAward('fitness_starter');
      if (c.category === 'coding') tryAward('coding_starter');
      if (c.category === 'language') tryAward('polyglot');
      if (c.duration_days >= 100) tryAward('days_100');
    }
  }

  if (newBadgesToAward.length > 0) {
    // Save to DB
    const newEarned: UserBadge[] = newBadgesToAward.map(b => ({
      id: generateId(),
      user_id: userId,
      badge_id: b.id,
      earned_at: new Date().toISOString()
    }));

    if (!isSupabaseConfigured()) {
      const all = await getDemoUserBadges();
      await saveDemoUserBadges([...all, ...newEarned]);
    } else {
      // Assuming 'badges' table is pre-populated in supabase matching our ALL_BADGES.
      // If the 'badges' table ids are different, this logic might fail on Supabase.
      // We will insert by badge_id.
      await supabase.from('user_badges').insert(
        newEarned.map(ub => ({
          user_id: ub.user_id,
          badge_id: ub.badge_id
        }))
      );
    }
  }

  return newBadgesToAward;
}
