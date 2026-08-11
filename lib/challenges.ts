import { supabase, isSupabaseConfigured } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskTemplate } from '../constants/templates';

const DEMO_CHALLENGES_KEY = '@challengr_demo_challenges';

export type ChallengeCategory = 'fitness' | 'coding' | 'academics' | 'language' | 'mindset' | 'custom';
export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'paused';

export interface ChallengeTask {
  id: string;
  challenge_id: string;
  label: string;
  type: 'checkbox' | 'numeric' | 'photo' | 'text_note';
  unit?: string;
  sort_order: number;
}

export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  category: ChallengeCategory;
  description: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: ChallengeStatus;
  template_id?: string;
  failure_reason?: string;
  created_at: string;
  tasks?: ChallengeTask[];
}

function generateId(): string {
  return 'ch-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ---------- DEMO (offline) STORAGE ----------

async function getDemoChallenges(): Promise<Challenge[]> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_CHALLENGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveDemoChallenges(challenges: Challenge[]): Promise<void> {
  await AsyncStorage.setItem(DEMO_CHALLENGES_KEY, JSON.stringify(challenges));
}

// ---------- PUBLIC API ----------

export async function createChallenge(
  userId: string,
  title: string,
  category: ChallengeCategory,
  description: string,
  durationDays: number,
  startDate: Date,
  tasks: TaskTemplate[],
  templateId?: string,
): Promise<{ challenge: Challenge | null; error: string | null }> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays - 1);

  const challengeId = generateId();

  const challenge: Challenge = {
    id: challengeId,
    user_id: userId,
    title,
    category,
    description,
    duration_days: durationDays,
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    status: 'active',
    template_id: templateId,
    created_at: new Date().toISOString(),
    tasks: tasks.map((t, i) => ({
      id: generateId(),
      challenge_id: challengeId,
      label: t.label,
      type: t.type,
      unit: t.unit,
      sort_order: i,
    })),
  };

  if (!isSupabaseConfigured()) {
    const existing = await getDemoChallenges();
    existing.push(challenge);
    await saveDemoChallenges(existing);
    return { challenge, error: null };
  }

  // Supabase path
  const { error: challengeError } = await supabase.from('challenges').insert({
    id: challenge.id,
    user_id: userId,
    title,
    category,
    description,
    duration_days: durationDays,
    start_date: challenge.start_date,
    end_date: challenge.end_date,
    status: 'active',
    template_id: templateId || null,
  });

  if (challengeError) {
    return { challenge: null, error: challengeError.message };
  }

  if (tasks.length > 0) {
    const taskRows = tasks.map((t, i) => ({
      challenge_id: challenge.id,
      label: t.label,
      type: t.type,
      unit: t.unit || null,
      sort_order: i,
    }));
    const { error: tasksError } = await supabase.from('challenge_tasks').insert(taskRows);
    if (tasksError) {
      return { challenge: null, error: tasksError.message };
    }
  }

  return { challenge, error: null };
}

export async function fetchChallenges(
  userId: string,
  status?: ChallengeStatus,
): Promise<{ challenges: Challenge[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    let all = await getDemoChallenges();
    if (status) {
      all = all.filter((c) => c.status === status);
    }
    return { challenges: all, error: null };
  }

  let query = supabase
    .from('challenges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return { challenges: [], error: error.message };
  }
  return { challenges: (data as Challenge[]) || [], error: null };
}

export async function fetchChallengeWithTasks(
  challengeId: string,
): Promise<{ challenge: Challenge | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const all = await getDemoChallenges();
    const found = all.find((c) => c.id === challengeId) || null;
    return { challenge: found, error: null };
  }

  const { data: challengeData, error: cErr } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (cErr) return { challenge: null, error: cErr.message };

  const { data: tasksData, error: tErr } = await supabase
    .from('challenge_tasks')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('sort_order', { ascending: true });

  const challenge: Challenge = {
    ...challengeData,
    tasks: tErr ? [] : tasksData || [],
  };

  return { challenge, error: null };
}

export async function deleteChallenge(
  challengeId: string,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    const all = await getDemoChallenges();
    const filtered = all.filter((c) => c.id !== challengeId);
    await saveDemoChallenges(filtered);
    return { error: null };
  }

  const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
  return { error: error?.message || null };
}

export async function updateChallengeStatus(
  challengeId: string,
  status: ChallengeStatus,
  failureReason?: string,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    const all = await getDemoChallenges();
    const index = all.findIndex((c) => c.id === challengeId);
    if (index >= 0) {
      all[index].status = status;
      if (failureReason) all[index].failure_reason = failureReason;
      await saveDemoChallenges(all);
    }
    return { error: null };
  }

  const updateData: Record<string, any> = { status };
  if (failureReason) updateData.failure_reason = failureReason;

  const { error } = await supabase
    .from('challenges')
    .update(updateData)
    .eq('id', challengeId);

  return { error: error?.message || null };
}
