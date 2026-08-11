import { supabase, isSupabaseConfigured } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreakForChallenge, fetchLogsForChallenge } from './logs';
import { fetchChallenges, ChallengeDomain } from './challenges';

export type BadgeDomain =
  | 'consistency'
  | 'difficulty'
  | 'fitness'
  | 'coding'
  | 'learning'
  | 'creative'
  | 'milestone'
  | 'social';

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  domain: BadgeDomain;
  difficulty_tier: 1 | 2 | 3 | 4 | 5;
  is_hardcore_exclusive?: boolean;
  base_xp: number;
  icon: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  xp_awarded: number;
  earned_at: string;
}

// Base XP table by difficulty tier
export const TIER_BASE_XP: Record<number, number> = {
  1: 50,
  2: 150,
  3: 400,
  4: 900,
  5: 2000,
};

export const ALL_BADGES: Badge[] = [
  // --- Consistency ---
  { id: 'b-c1', key: 'first_step', name: 'First Step', description: 'Complete Day 1 of any challenge.', domain: 'consistency', difficulty_tier: 1, base_xp: 50, icon: 'footprints' },
  { id: 'b-c2', key: 'streak_7', name: 'Week One', description: 'Maintain a 7-day streak.', domain: 'consistency', difficulty_tier: 1, base_xp: 50, icon: 'flame' },
  { id: 'b-c3', key: 'streak_14', name: 'Fortnight Strong', description: 'Maintain a 14-day streak.', domain: 'consistency', difficulty_tier: 2, base_xp: 150, icon: 'zap' },
  { id: 'b-c4', key: 'halfway', name: 'Halfway There', description: 'Reach midpoint of any challenge with 80%+ completion.', domain: 'consistency', difficulty_tier: 2, base_xp: 150, icon: 'compass' },
  { id: 'b-c5', key: 'streak_30', name: 'Iron Habit', description: 'Maintain a 30-day streak.', domain: 'consistency', difficulty_tier: 3, base_xp: 400, icon: 'shield-check' },
  { id: 'b-c6', key: 'comeback', name: 'Comeback Kid', description: 'Recover a 100% streak for 7 days after using a penalty.', domain: 'consistency', difficulty_tier: 3, base_xp: 400, icon: 'rotate-ccw' },
  { id: 'b-c7', key: 'consistency_king', name: 'Consistency King', description: 'Finish a challenge with 90%+ average completion.', domain: 'consistency', difficulty_tier: 4, base_xp: 900, icon: 'crown' },
  { id: 'b-c8', key: 'unbroken', name: 'Unbroken', description: 'Complete a 90+ day challenge with ZERO penalties used.', domain: 'consistency', difficulty_tier: 5, base_xp: 2000, icon: 'award' },

  // --- Difficulty ---
  { id: 'b-d1', key: 'medium_complete', name: 'Stepping It Up', description: 'Complete a challenge on Medium mode.', domain: 'difficulty', difficulty_tier: 2, base_xp: 150, icon: 'trending-up' },
  { id: 'b-d2', key: 'hard_complete', name: 'No Excuses', description: 'Complete a challenge on Hard mode.', domain: 'difficulty', difficulty_tier: 3, base_xp: 400, icon: 'swords' },
  { id: 'b-d3', key: 'hardcore_initiate', name: 'Hardcore Initiate', description: 'Complete a 30+ day Hardcore challenge.', domain: 'difficulty', difficulty_tier: 4, is_hardcore_exclusive: true, base_xp: 900, icon: 'flame' },
  { id: 'b-d4', key: 'zero_penalties_90', name: 'Zero Penalties, Zero Regrets', description: 'Complete a 90-day Hardcore challenge.', domain: 'difficulty', difficulty_tier: 5, is_hardcore_exclusive: true, base_xp: 2000, icon: 'skull' },
  { id: 'b-d5', key: 'mode_master', name: 'Mode Master', description: 'Complete at least one challenge in every difficulty mode.', domain: 'difficulty', difficulty_tier: 5, base_xp: 2000, icon: 'sparkles' },

  // --- Domain: Fitness ---
  { id: 'b-f1', key: 'first_rep', name: 'First Rep', description: 'Complete your first fitness task.', domain: 'fitness', difficulty_tier: 1, base_xp: 50, icon: 'activity' },
  { id: 'b-f2', key: 'gains_log', name: 'Gains Log', description: 'Complete a 30-day fitness challenge.', domain: 'fitness', difficulty_tier: 2, base_xp: 150, icon: 'dumbbell' },
  { id: 'b-f3', key: 'transformation', name: 'Transformation', description: 'Complete a 90-day fitness challenge at 85%+ completion.', domain: 'fitness', difficulty_tier: 3, base_xp: 400, icon: 'heart-pulse' },
  { id: 'b-f4', key: 'beast_mode', name: 'Beast Mode', description: 'Complete a 90-day Hardcore fitness challenge.', domain: 'fitness', difficulty_tier: 4, is_hardcore_exclusive: true, base_xp: 900, icon: 'zap' },

  // --- Domain: Coding ---
  { id: 'b-k1', key: 'hello_world', name: 'Hello World', description: 'Complete your first coding task.', domain: 'coding', difficulty_tier: 1, base_xp: 50, icon: 'code' },
  { id: 'b-k2', key: 'problem_solver', name: 'Problem Solver', description: 'Log 100+ total problems across a challenge.', domain: 'coding', difficulty_tier: 2, base_xp: 150, icon: 'cpu' },
  { id: 'b-k3', key: 'grinder', name: 'Grinder', description: 'Complete a 60+ day coding challenge at 85%+ completion.', domain: 'coding', difficulty_tier: 3, base_xp: 400, icon: 'terminal' },
  { id: 'b-k4', key: 'algorithm_master', name: 'Algorithm Master', description: 'Complete a 90-day Hardcore coding challenge.', domain: 'coding', difficulty_tier: 4, is_hardcore_exclusive: true, base_xp: 900, icon: 'brain' },

  // --- Domain: Learning ---
  { id: 'b-l1', key: 'first_lesson', name: 'First Lesson', description: 'Complete your first learning task.', domain: 'learning', difficulty_tier: 1, base_xp: 50, icon: 'book-open' },
  { id: 'b-l2', key: 'steady_study', name: 'Steady Study', description: 'Maintain a 21-day streak on a learning challenge.', domain: 'learning', difficulty_tier: 2, base_xp: 150, icon: 'book' },
  { id: 'b-l3', key: 'deep_focus', name: 'Deep Focus', description: 'Complete a 60+ day learning challenge at 85%+ completion.', domain: 'learning', difficulty_tier: 3, base_xp: 400, icon: 'graduation-cap' },

  // --- Domain: Creative ---
  { id: 'b-cr1', key: 'first_sketch', name: 'First Sketch', description: 'Complete your first creative task.', domain: 'creative', difficulty_tier: 1, base_xp: 50, icon: 'pen-tool' },
  { id: 'b-cr2', key: 'creative_flow', name: 'Creative Flow', description: 'Maintain a 14-day streak on a creative challenge.', domain: 'creative', difficulty_tier: 2, base_xp: 150, icon: 'palette' },
  { id: 'b-cr3', key: 'portfolio_builder', name: 'Portfolio Builder', description: 'Complete a 60+ day creative challenge.', domain: 'creative', difficulty_tier: 3, base_xp: 400, icon: 'image' },

  // --- Milestone ---
  { id: 'b-m1', key: 'getting_started', name: 'Getting Started', description: 'Complete your first challenge.', domain: 'milestone', difficulty_tier: 1, base_xp: 50, icon: 'flag' },
  { id: 'b-m2', key: 'repeat_achiever', name: 'Repeat Achiever', description: 'Complete 3 challenges total.', domain: 'milestone', difficulty_tier: 2, base_xp: 150, icon: 'layers' },
  { id: 'b-m3', key: 'habit_architect', name: 'Habit Architect', description: 'Complete 10 challenges total.', domain: 'milestone', difficulty_tier: 3, base_xp: 400, icon: 'trophy' },
  { id: 'b-m4', key: 'the_long_game', name: 'The Long Game', description: 'Accumulate 365 total logged days across all challenges.', domain: 'milestone', difficulty_tier: 4, base_xp: 900, icon: 'calendar' },
];

const DEMO_USER_BADGES_KEY = '@challengr_demo_user_badges';
const DEMO_DOMAIN_FIRST_KEY = '@challengr_demo_domain_first';
const DEMO_HARDCORE_FIRST_KEY = '@challengr_demo_hardcore_first';

function generateId(): string {
  return 'ub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// ---------- DEMO STORAGE ----------

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

  return { earnedBadges: (data as UserBadge[]) || [], error: error?.message || null };
}

/**
 * Calculates user Total XP and Level.
 * XP comes from:
 * 1. Base log completion XP per day (20 XP * difficulty multiplier)
 * 2. Earned badge XP (including first-domain + first-hardcore bonuses)
 */
export async function getUserXPAndLevel(userId: string): Promise<{ totalXP: number; level: number; levelTitle: string; xpNextLevel: number }> {
  const { earnedBadges } = await fetchUserBadges(userId);
  
  let badgeXP = 0;
  earnedBadges.forEach((ub) => {
    badgeXP += ub.xp_awarded || 0;
  });

  // Calculate log completion XP
  const { challenges } = await fetchChallenges(userId);
  let logXP = 0;

  for (const c of challenges) {
    const mult = c.difficulty_mode === 'hardcore' ? 3.0 : c.difficulty_mode === 'hard' ? 2.0 : c.difficulty_mode === 'medium' ? 1.5 : c.difficulty_mode === 'easy' ? 1.0 : 0;
    const { logs } = await fetchLogsForChallenge(c.id, userId);
    logs.forEach((l) => {
      if (l.compulsory_completion_pct > 0) {
        logXP += Math.round(20 * (l.compulsory_completion_pct / 100) * mult);
      }
    });
  }

  const totalXP = badgeXP + logXP;
  // Level formula: Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 300 XP, Level N = 50 * N^2
  const level = Math.floor(Math.sqrt(totalXP / 50)) + 1;
  const currentLevelMinXP = 50 * Math.pow(level - 1, 2);
  const nextLevelXP = 50 * Math.pow(level, 2);

  const LEVEL_TITLES = ['Novice', 'Challenger', 'Apprentice', 'Dedicated', 'Disciplined', 'Iron-Willed', 'Master', 'Legend', 'Unstoppable'];
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  return {
    totalXP,
    level,
    levelTitle,
    xpNextLevel: nextLevelXP - totalXP,
  };
}

export interface AwardResult {
  badge: Badge;
  xpAwarded: number;
  isFirstDomain: boolean;
  isFirstHardcore: boolean;
}

export async function checkAndAwardBadges(
  userId: string,
  event: 'log_saved' | 'challenge_completed',
  challengeId?: string,
): Promise<AwardResult[]> {
  const { earnedBadges } = await fetchUserBadges(userId);
  const earnedKeys = earnedBadges.map(ub => ALL_BADGES.find(b => b.id === ub.badge_id)?.key).filter(Boolean);

  // Track existing domains earned
  const earnedDomains = new Set<string>();
  let hasHardcoreEarned = false;

  earnedBadges.forEach(ub => {
    const badge = ALL_BADGES.find(b => b.id === ub.badge_id);
    if (badge) {
      earnedDomains.add(badge.domain);
      if (badge.is_hardcore_exclusive) hasHardcoreEarned = true;
    }
  });

  const awardList: AwardResult[] = [];

  const tryAward = (key: string) => {
    if (earnedKeys.includes(key) || awardList.find(a => a.badge.key === key)) return;
    const badge = ALL_BADGES.find(b => b.key === key);
    if (!badge) return;

    // Stacking Bonus Calculation
    const isFirstDomain = !earnedDomains.has(badge.domain);
    const isFirstHardcore = Boolean(badge.is_hardcore_exclusive && !hasHardcoreEarned);

    let baseXP = Math.round(badge.base_xp * (badge.is_hardcore_exclusive ? 1.5 : 1.0));
    let xpAwarded = baseXP;
    if (isFirstDomain) xpAwarded += 100;
    if (isFirstHardcore) xpAwarded += 300;

    earnedDomains.add(badge.domain);
    if (badge.is_hardcore_exclusive) hasHardcoreEarned = true;

    awardList.push({ badge, xpAwarded, isFirstDomain, isFirstHardcore });
  };

  // Event 1: log_saved
  if (event === 'log_saved' && challengeId) {
    const { challenges } = await fetchChallenges(userId);
    const curr = challenges.find(c => c.id === challengeId);
    
    // Day 1 check
    const { logs } = await fetchLogsForChallenge(challengeId, userId);
    if (logs.length >= 1) tryAward('first_step');

    // Domain task checks
    if (curr) {
      if (curr.domain_tag === 'fitness' || curr.category === 'fitness') tryAward('first_rep');
      if (curr.domain_tag === 'coding' || curr.category === 'coding') tryAward('hello_world');
      if (curr.domain_tag === 'learning' || curr.category === 'academics' || curr.category === 'language') tryAward('first_lesson');
      if (curr.domain_tag === 'creative') tryAward('first_sketch');
    }

    const streak = await getStreakForChallenge(challengeId, userId);
    if (streak >= 7) tryAward('streak_7');
    if (streak >= 14) tryAward('streak_14');
    if (streak >= 30) tryAward('streak_30');

    // Total days check across all challenges
    let totalLoggedDays = 0;
    for (const c of challenges) {
      const { logs: cLogs } = await fetchLogsForChallenge(c.id, userId);
      totalLoggedDays += (cLogs || []).length;
    }
    if (totalLoggedDays >= 365) tryAward('the_long_game');
  }

  // Event 2: challenge_completed
  if (event === 'challenge_completed') {
    const { challenges } = await fetchChallenges(userId, 'completed');
    if (challenges.length >= 1) tryAward('getting_started');
    if (challenges.length >= 3) tryAward('repeat_achiever');
    if (challenges.length >= 10) tryAward('habit_architect');

    for (const c of challenges) {
      if (c.difficulty_mode === 'medium') tryAward('medium_complete');
      if (c.difficulty_mode === 'hard') tryAward('hard_complete');
      if (c.difficulty_mode === 'hardcore' && c.duration_days >= 30) tryAward('hardcore_initiate');
      if (c.difficulty_mode === 'hardcore' && c.duration_days >= 90) tryAward('zero_penalties_90');

      if ((c.domain_tag === 'fitness' || c.category === 'fitness') && c.duration_days >= 30) tryAward('gains_log');
      if ((c.domain_tag === 'coding' || c.category === 'coding') && c.duration_days >= 60) tryAward('grinder');
      if ((c.domain_tag === 'coding' || c.category === 'coding') && c.difficulty_mode === 'hardcore' && c.duration_days >= 90) tryAward('algorithm_master');
      if ((c.domain_tag === 'fitness' || c.category === 'fitness') && c.difficulty_mode === 'hardcore' && c.duration_days >= 90) tryAward('beast_mode');
    }
  }

  if (awardList.length > 0) {
    const newEarned: UserBadge[] = awardList.map(a => ({
      id: generateId(),
      user_id: userId,
      badge_id: a.badge.id,
      xp_awarded: a.xpAwarded,
      earned_at: new Date().toISOString(),
    }));

    if (!isSupabaseConfigured()) {
      const all = await getDemoUserBadges();
      await saveDemoUserBadges([...all, ...newEarned]);
    } else {
      await supabase.from('user_badges').insert(
        newEarned.map(ub => ({
          user_id: ub.user_id,
          badge_id: ub.badge_id,
          xp_awarded: ub.xp_awarded,
        }))
      );
    }
  }

  return awardList;
}
