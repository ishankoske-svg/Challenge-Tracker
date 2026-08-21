import { Challenge } from './challenges';
import { DailyLog } from './logs';

// ---------- HEATMAP ----------

export interface HeatmapCell {
  dayOfWeek: number; // 0=Sun..6=Sat
  hour: number;      // 0..23
  count: number;     // number of logs in this slot
  intensity: number; // 0..1 normalized
}

/**
 * Computes a 7×24 heatmap grid of completion activity.
 * Each cell represents how many daily logs were created at that day+hour combo.
 */
export function computeHourlyHeatmap(logs: DailyLog[]): HeatmapCell[] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxCount = 0;

  for (const log of logs) {
    const d = new Date(log.created_at);
    const dayOfWeek = d.getDay();
    const hour = d.getHours();
    grid[dayOfWeek][hour]++;
    if (grid[dayOfWeek][hour] > maxCount) {
      maxCount = grid[dayOfWeek][hour];
    }
  }

  const cells: HeatmapCell[] = [];
  for (let dow = 0; dow < 7; dow++) {
    for (let h = 0; h < 24; h++) {
      cells.push({
        dayOfWeek: dow,
        hour: h,
        count: grid[dow][h],
        intensity: maxCount > 0 ? grid[dow][h] / maxCount : 0,
      });
    }
  }
  return cells;
}

// ---------- WEEKLY RECAP ----------

export interface WeeklyRecap {
  weekNumber: number;
  weekLabel: string;         // e.g. "Aug 12 – Aug 18"
  daysLogged: number;
  avgCompletionPct: number;
  totalXPEstimate: number;
  streakDays: number;
  penaltiesThisWeek: number;
  comparedToPrevWeek: {
    completionDelta: number;  // positive = improved
    streakDelta: number;
  } | null;
}

export function generateWeeklyRecaps(
  challenge: Challenge,
  logs: DailyLog[],
): WeeklyRecap[] {
  if (logs.length === 0) return [];

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime(),
  );

  const startDate = new Date(challenge.start_date);
  const weeks: WeeklyRecap[] = [];

  // Group logs by week number
  const weekBuckets: Map<number, DailyLog[]> = new Map();
  for (const log of sortedLogs) {
    const logDate = new Date(log.log_date);
    const diffDays = Math.floor((logDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(diffDays / 7) + 1;
    if (!weekBuckets.has(weekNum)) weekBuckets.set(weekNum, []);
    weekBuckets.get(weekNum)!.push(log);
  }

  const xpMultiplier = getXPMultiplier(challenge.difficulty_mode);

  const sortedWeeks = [...weekBuckets.entries()].sort((a, b) => a[0] - b[0]);

  for (let i = 0; i < sortedWeeks.length; i++) {
    const [weekNum, weekLogs] = sortedWeeks[i];
    const daysLogged = weekLogs.length;

    const avgCompletion = weekLogs.reduce((sum, l) => sum + (l.compulsory_completion_pct ?? 0), 0) / Math.max(daysLogged, 1);
    const penaltiesThisWeek = weekLogs.filter(l => l.penalty_triggered).length;

    // Streak: count consecutive completion days in this week
    let streak = 0;
    let currentStreak = 0;
    for (const log of weekLogs) {
      if ((log.compulsory_completion_pct ?? 0) >= 100) {
        currentStreak++;
        streak = Math.max(streak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const baseXP = daysLogged * 10;
    const totalXPEstimate = Math.round(baseXP * xpMultiplier * (avgCompletion / 100));

    // Week label
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekLabel = `${formatShortDate(weekStartDate)} – ${formatShortDate(weekEndDate)}`;

    // Compare to previous
    let comparedToPrevWeek = null;
    if (i > 0) {
      const prevRecap = weeks[i - 1];
      comparedToPrevWeek = {
        completionDelta: Math.round(avgCompletion - prevRecap.avgCompletionPct),
        streakDelta: streak - prevRecap.streakDays,
      };
    }

    weeks.push({
      weekNumber: weekNum,
      weekLabel,
      daysLogged,
      avgCompletionPct: Math.round(avgCompletion),
      totalXPEstimate,
      streakDays: streak,
      penaltiesThisWeek,
      comparedToPrevWeek,
    });
  }

  return weeks;
}

// ---------- SHARE CARD DATA ----------

export interface ShareCardData {
  challengeTitle: string;
  category: string;
  difficultyMode: string;
  difficultyEmoji: string;
  durationDays: number;
  daysCompleted: number;
  avgCompletionPct: number;
  currentStreak: number;
  penaltiesUsed: number;
  maxPenalties: number;
  totalXP: number;
  level: number;
  levelTitle: string;
  badgesEarned: number;
  status: string;
}

export function buildShareCardData(
  challenge: Challenge,
  logs: DailyLog[],
  streak: number,
  xpData: { totalXP: number; level: number; levelTitle: string },
  badgeCount: number,
): ShareCardData {
  const avgCompletion = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.compulsory_completion_pct ?? 0), 0) / logs.length)
    : 0;

  const emojiMap: Record<string, string> = {
    hardcore: '🔥', hard: '⚡', medium: '💪', easy: '🌱', relaxed: '☕',
  };

  return {
    challengeTitle: challenge.title,
    category: challenge.domain_tag || challenge.category,
    difficultyMode: challenge.difficulty_mode || 'medium',
    difficultyEmoji: emojiMap[challenge.difficulty_mode || 'medium'] || '💪',
    durationDays: challenge.duration_days,
    daysCompleted: logs.length,
    avgCompletionPct: avgCompletion,
    currentStreak: streak,
    penaltiesUsed: challenge.penalties_used ?? 0,
    maxPenalties: challenge.max_penalties ?? 0,
    totalXP: xpData.totalXP,
    level: xpData.level,
    levelTitle: xpData.levelTitle,
    badgesEarned: badgeCount,
    status: challenge.status,
  };
}

// ---------- HELPERS ----------

function formatShortDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getXPMultiplier(mode?: string): number {
  const map: Record<string, number> = {
    hardcore: 3.0, hard: 2.0, medium: 1.5, easy: 1.0, relaxed: 0.0,
  };
  return map[mode || 'medium'] ?? 1.0;
}
