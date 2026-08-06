import { supabase, isSupabaseConfigured } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_LOGS_KEY = '@challengr_demo_logs';

export interface DailyLog {
  id: string;
  challenge_id: string;
  user_id: string;
  log_date: string;
  tasks_completed: Record<string, any>;
  notes: string;
  created_at: string;
}

function generateId(): string {
  return 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
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
  await AsyncStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(logs));
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
  date?: string,
): Promise<{ log: DailyLog | null; error: string | null }> {
  const logDate = date || todayStr();

  if (!isSupabaseConfigured()) {
    const all = await getDemoLogs();
    const existingIdx = all.findIndex(
      (l) => l.challenge_id === challengeId && l.user_id === userId && l.log_date === logDate,
    );

    if (existingIdx >= 0) {
      // Update existing log
      all[existingIdx].tasks_completed = tasksCompleted;
      all[existingIdx].notes = notes;
      await saveDemoLogs(all);
      return { log: all[existingIdx], error: null };
    } else {
      // Create new log
      const newLog: DailyLog = {
        id: generateId(),
        challenge_id: challengeId,
        user_id: userId,
        log_date: logDate,
        tasks_completed: tasksCompleted,
        notes,
        created_at: new Date().toISOString(),
      };
      all.push(newLog);
      await saveDemoLogs(all);
      return { log: newLog, error: null };
    }
  }

  // Supabase: upsert based on unique constraint (challenge_id, user_id, log_date)
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(
      {
        challenge_id: challengeId,
        user_id: userId,
        log_date: logDate,
        tasks_completed: tasksCompleted,
        notes,
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
    const today = new Date();
    const checkDate = new Date(today);

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

  // For Supabase, fetch recent logs and compute streak
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
