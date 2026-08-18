import { supabase, isSupabaseConfigured } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChallengeTask, Challenge, incrementPenalty } from './challenges';

const DEMO_LOGS_KEY = '@challengr_demo_logs';

export interface DailyLog {
  id: string;
  challenge_id: string;
  user_id: string;
  log_date: string;
  day_number?: number;
  tasks_completed: Record<string, any>;
  notes: string;
  compulsory_completion_pct: number;   // 0..100
  optional_bonus_pct: number;          // 0..100
  penalty_triggered: boolean;
  missed_task_ids: string[];
  created_at: string;
}

export interface DayEvaluation {
  compulsory_pct: number;
  optional_pct: number;
  penalty: boolean;
  missedTaskIds: string[];
}

function generateId(): string {
  return 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ---------- COMPLETION EVALUATION ----------

export function evaluateDayCompletion(
  tasks: ChallengeTask[],
  taskValues: Record<string, any>,
): DayEvaluation {
  const compulsoryTasks = tasks.filter(t => t.is_compulsory);
  const optionalTasks = tasks.filter(t => !t.is_compulsory);

  const scoreTask = (task: ChallengeTask): number => {
    const val = taskValues[task.id];
    if (task.task_type === 'definite') {
      const target = task.target_quantity || 1;
      if (val === undefined || val === null) return 0;
      const numVal = typeof val === 'object' ? (val.value ?? 0) : Number(val);
      return Math.min(numVal / target, 1);
    } else {
      // binary
      if (val === true) return 1;
      if (val && typeof val === 'object' && val.completed) return 1;
      if (typeof val === 'string' && val.trim().length > 0) return 1; // text_note counts as done if filled
      return 0;
    }
  };

  let compulsorySum = 0;
  let compulsoryCount = compulsoryTasks.length;
  const missedTaskIds: string[] = [];

  for (const task of compulsoryTasks) {
    const score = scoreTask(task);
    compulsorySum += score;
    if (score < 1) missedTaskIds.push(task.id);
  }

  let optionalSum = 0;
  let optionalCount = optionalTasks.length;
  for (const task of optionalTasks) {
    optionalSum += scoreTask(task);
  }

  const compulsory_pct = compulsoryCount > 0 ? Math.round((compulsorySum / compulsoryCount) * 100) : 100;
  const optional_pct = optionalCount > 0 ? Math.round((optionalSum / optionalCount) * 100) : 0;
  const penalty = compulsoryCount > 0 && compulsory_pct < 100;

  return { compulsory_pct, optional_pct, penalty, missedTaskIds };
}

// ---------- GRACE WINDOW & MISSED DAY RECONCILIATION ----------

export function isWithinGraceWindow(dateStr: string): boolean {
  const now = new Date();
  const today = todayStr();
  if (dateStr === today) return true; // always allowed for today

  // Allow logging yesterday until 6 AM today
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === yesterdayStr && now.getHours() < 6) {
    return true;
  }
  return false;
}

export function getDayNumber(startDate: string, logDate: string): number {
  const start = new Date(startDate);
  const log = new Date(logDate);
  const diffMs = log.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Reconciles unlogged past days for an active challenge.
 * If a past date (prior to grace period cutoff) has no log entry,
 * it automatically logs a missed day and increments penalties.
 */
export async function reconcileUnloggedDaysPenalties(
  challenge: Challenge,
  userId: string,
): Promise<{ penaltiesAdded: number; failed: boolean }> {
  if (challenge.status !== 'active' || challenge.is_paused) return { penaltiesAdded: 0, failed: false };

  const { logs } = await fetchLogsForChallenge(challenge.id, userId);
  const loggedDates = new Set(logs.map((l) => l.log_date));

  const startDate = new Date(challenge.start_date);
  const now = new Date();
  const today = todayStr();

  // Cutoff date for unlogged reconciliation (yesterday, or today if past 6:00 AM)
  const cutoffDate = new Date(now);
  if (now.getHours() < 6) {
    cutoffDate.setDate(cutoffDate.getDate() - 2); // yesterday is still in grace period
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - 1); // yesterday grace period has expired
  }

  let curr = new Date(startDate);
  let penaltiesAdded = 0;
  let isFailed = false;

  while (curr <= cutoffDate) {
    const currStr = curr.toISOString().split('T')[0];

    if (!loggedDates.has(currStr)) {
      // Auto-register missed day
      const dayNum = getDayNumber(challenge.start_date, currStr);
      const missedEvaluation: DayEvaluation = {
        compulsory_pct: 0,
        optional_pct: 0,
        penalty: true,
        missedTaskIds: challenge.tasks ? challenge.tasks.filter(t => t.is_compulsory).map(t => t.id) : [],
      };

      await saveLog(
        challenge.id,
        userId,
        {},
        'Auto-penalty: Missed daily log',
        missedEvaluation,
        dayNum,
        currStr,
      );

      const res = await incrementPenalty(challenge.id);
      penaltiesAdded++;
      if (res.failed) {
        isFailed = true;
        break;
      }
    }

    curr.setDate(curr.getDate() + 1);
  }

  return { penaltiesAdded, failed: isFailed };
}

// ---------- DEMO STORAGE ----------

async function getDemoLogs(): Promise<DailyLog[]> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveDemoLogs(logs: DailyLog[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn('AsyncStorage quota exceeded for logs, pruning old logs...');
    if (logs.length > 1) {
      const pruned = logs.slice(Math.floor(logs.length / 2));
      try {
        await AsyncStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(pruned));
      } catch {
        await AsyncStorage.removeItem(DEMO_LOGS_KEY).catch(() => {});
      }
    } else {
      await AsyncStorage.removeItem(DEMO_LOGS_KEY).catch(() => {});
    }
  }
}

// ---------- PUBLIC API ----------

export async function fetchLogForDate(
  challengeId: string,
  userId: string,
  date?: string,
): Promise<{ log: DailyLog | null; error: string | null }> {
  const logDate = date || todayStr();

  if (!isSupabaseConfigured()) {
    const all = await getDemoLogs();
    const found = all.find(
      (l) => l.challenge_id === challengeId && l.user_id === userId && l.log_date === logDate,
    ) || null;
    return { log: found, error: null };
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .eq('log_date', logDate)
    .maybeSingle();

  if (error) return { log: null, error: error.message };
  return { log: data as DailyLog | null, error: null };
}

export async function saveLog(
  challengeId: string,
  userId: string,
  tasksCompleted: Record<string, any>,
  notes: string,
  evaluation: DayEvaluation,
  dayNumber?: number,
  date?: string,
): Promise<{ log: DailyLog | null; error: string | null }> {
  const logDate = date || todayStr();

  if (!isSupabaseConfigured()) {
    const all = await getDemoLogs();
    const existingIdx = all.findIndex(
      (l) => l.challenge_id === challengeId && l.user_id === userId && l.log_date === logDate,
    );

    const logData: DailyLog = {
      id: existingIdx >= 0 ? all[existingIdx].id : generateId(),
      challenge_id: challengeId,
      user_id: userId,
      log_date: logDate,
      day_number: dayNumber,
      tasks_completed: tasksCompleted,
      notes,
      compulsory_completion_pct: evaluation.compulsory_pct,
      optional_bonus_pct: evaluation.optional_pct,
      penalty_triggered: evaluation.penalty,
      missed_task_ids: evaluation.missedTaskIds,
      created_at: existingIdx >= 0 ? all[existingIdx].created_at : new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      all[existingIdx] = logData;
    } else {
      all.push(logData);
    }
    await saveDemoLogs(all);
    return { log: logData, error: null };
  }

  // Supabase: upsert
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(
      {
        challenge_id: challengeId,
        user_id: userId,
        log_date: logDate,
        day_number: dayNumber,
        tasks_completed: tasksCompleted,
        notes,
        compulsory_completion_pct: evaluation.compulsory_pct,
        optional_bonus_pct: evaluation.optional_pct,
        penalty_triggered: evaluation.penalty,
        missed_task_ids: evaluation.missedTaskIds,
      },
      { onConflict: 'challenge_id,user_id,log_date' },
    )
    .select()
    .single();

  if (error) return { log: null, error: error.message };
  return { log: data as DailyLog, error: null };
}

export async function fetchLogsForChallenge(
  challengeId: string,
  userId: string,
): Promise<{ logs: DailyLog[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const all = await getDemoLogs();
    const filtered = all
      .filter((l) => l.challenge_id === challengeId && l.user_id === userId)
      .sort((a, b) => b.log_date.localeCompare(a.log_date));
    return { logs: filtered, error: null };
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .order('log_date', { ascending: false });

  if (error) return { logs: [], error: error.message };
  return { logs: (data as DailyLog[]) || [], error: null };
}

export async function getLogCountForChallenge(
  challengeId: string,
  userId: string,
): Promise<number> {
  if (!isSupabaseConfigured()) {
    const all = await getDemoLogs();
    return all.filter((l) => l.challenge_id === challengeId && l.user_id === userId).length;
  }

  const { count, error } = await supabase
    .from('daily_logs')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  return error ? 0 : (count || 0);
}

export async function getStreakForChallenge(
  challengeId: string,
  userId: string,
): Promise<number> {
  if (!isSupabaseConfigured()) {
    const all = await getDemoLogs();
    const logs = all
      .filter((l) => l.challenge_id === challengeId && l.user_id === userId)
      .map((l) => l.log_date)
      .sort()
      .reverse();

    if (logs.length === 0) return 0;

    let streak = 0;
    const checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (logs.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  const { data } = await supabase
    .from('daily_logs')
    .select('log_date')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(365);

  if (!data || data.length === 0) return 0;

  const dates = data.map((d: any) => d.log_date);
  let streak = 0;
  const checkDate = new Date();

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
