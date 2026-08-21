import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';

export interface Pod {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  challenge_template_id?: string;
  created_at: string;
}

export interface PodMember {
  id: string;
  pod_id: string;
  user_id: string;
  joined_at: string;
  
  // Enriched data for UI
  displayName?: string;
  avatarUrl?: string;
  currentStreak?: number;
  penaltiesUsed?: number;
}

const DEMO_PODS_KEY = '@challengr_demo_pods';
const DEMO_POD_MEMBERS_KEY = '@challengr_demo_pod_members';

const MOCK_AVATARS = [
  'https://i.pravatar.cc/150?u=1',
  'https://i.pravatar.cc/150?u=2',
  'https://i.pravatar.cc/150?u=3',
];

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateId() {
  return 'pod-' + Date.now().toString(36);
}

// ---------- DEMO STORAGE ----------

async function getDemoPods(): Promise<Pod[]> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_PODS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function getDemoPodMembers(): Promise<PodMember[]> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_POD_MEMBERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveDemoPods(pods: Pod[]) {
  await AsyncStorage.setItem(DEMO_PODS_KEY, JSON.stringify(pods));
}

async function saveDemoPodMembers(members: PodMember[]) {
  await AsyncStorage.setItem(DEMO_POD_MEMBERS_KEY, JSON.stringify(members));
}

// ---------- API ----------

export async function createPod(name: string, userId: string, challengeTemplateId?: string): Promise<{ pod: Pod | null; error: string | null }> {
  const invite_code = generateInviteCode();
  
  if (!isSupabaseConfigured()) {
    const newPod: Pod = {
      id: generateId(),
      name,
      created_by: userId,
      invite_code,
      challenge_template_id: challengeTemplateId,
      created_at: new Date().toISOString()
    };
    const pods = await getDemoPods();
    await saveDemoPods([...pods, newPod]);

    // Add creator as member
    const newMember: PodMember = {
      id: generateId(),
      pod_id: newPod.id,
      user_id: userId,
      joined_at: new Date().toISOString()
    };
    const members = await getDemoPodMembers();
    await saveDemoPodMembers([...members, newMember]);
    
    return { pod: newPod, error: null };
  }

  const { data, error } = await supabase
    .from('pods')
    .insert([{ name, created_by: userId, invite_code, challenge_template_id: challengeTemplateId }])
    .select()
    .single();

  if (error) return { pod: null, error: error.message };

  if (data) {
    await supabase.from('pod_members').insert([{ pod_id: data.id, user_id: userId }]);
  }

  return { pod: data as Pod, error: null };
}

export async function joinPodByCode(inviteCode: string, userId: string): Promise<{ pod: Pod | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const pods = await getDemoPods();
    const pod = pods.find(p => p.invite_code === inviteCode.toUpperCase());
    if (!pod) return { pod: null, error: 'Pod not found with that invite code' };

    const members = await getDemoPodMembers();
    if (members.find(m => m.pod_id === pod.id && m.user_id === userId)) {
      return { pod, error: 'Already a member' };
    }

    const newMember: PodMember = {
      id: generateId(),
      pod_id: pod.id,
      user_id: userId,
      joined_at: new Date().toISOString()
    };
    await saveDemoPodMembers([...members, newMember]);

    return { pod, error: null };
  }

  const { data: pod, error: podErr } = await supabase.from('pods').select('*').eq('invite_code', inviteCode.toUpperCase()).single();
  if (podErr || !pod) return { pod: null, error: 'Pod not found' };

  const { error: memErr } = await supabase.from('pod_members').insert([{ pod_id: pod.id, user_id: userId }]);
  if (memErr) return { pod: null, error: memErr.message };

  return { pod, error: null };
}

export async function fetchUserPods(userId: string): Promise<{ pods: Pod[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const allMembers = await getDemoPodMembers();
    const myMembership = allMembers.filter(m => m.user_id === userId);
    const podIds = myMembership.map(m => m.pod_id);
    const allPods = await getDemoPods();
    return { pods: allPods.filter(p => podIds.includes(p.id)), error: null };
  }

  const { data: members, error: memErr } = await supabase.from('pod_members').select('pod_id').eq('user_id', userId);
  if (memErr) return { pods: [], error: memErr.message };

  const podIds = members.map(m => m.pod_id);
  const { data, error } = await supabase.from('pods').select('*').in('id', podIds);
  return { pods: (data as Pod[]) || [], error: error?.message || null };
}

export async function fetchPodMembers(podId: string): Promise<{ members: PodMember[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const allMembers = await getDemoPodMembers();
    const podMembers = allMembers.filter(m => m.pod_id === podId);
    
    // Add mock data for UI visualization
    const enriched = podMembers.map((m, i) => ({
      ...m,
      displayName: m.user_id === 'demo-user' ? 'You' : `User ${i+1}`,
      avatarUrl: m.user_id === 'demo-user' ? 'https://i.pravatar.cc/150?u=you' : MOCK_AVATARS[i % MOCK_AVATARS.length],
      currentStreak: m.user_id === 'demo-user' ? 5 : Math.floor(Math.random() * 20),
      penaltiesUsed: m.user_id === 'demo-user' ? 1 : Math.floor(Math.random() * 3),
    }));
    
    // Auto-add 2 mock members if it's just the user
    if (enriched.length === 1) {
      enriched.push({
        id: 'mock1', pod_id: podId, user_id: 'mock1', joined_at: new Date().toISOString(),
        displayName: 'Alice', avatarUrl: MOCK_AVATARS[0], currentStreak: 12, penaltiesUsed: 0
      });
      enriched.push({
        id: 'mock2', pod_id: podId, user_id: 'mock2', joined_at: new Date().toISOString(),
        displayName: 'Bob', avatarUrl: MOCK_AVATARS[1], currentStreak: 2, penaltiesUsed: 2
      });
    }

    return { members: enriched, error: null };
  }

  const { data, error } = await supabase.from('pod_members').select('*, users(display_name, avatar_url)').eq('pod_id', podId);
  if (error) return { members: [], error: error.message };

  const enriched = data.map((d: any) => ({
    id: d.id,
    pod_id: d.pod_id,
    user_id: d.user_id,
    joined_at: d.joined_at,
    displayName: d.users?.display_name || 'Unknown',
    avatarUrl: d.users?.avatar_url,
    currentStreak: 0, // In real app, fetch from backend logic
    penaltiesUsed: 0,
  }));
  return { members: enriched, error: null };
}

export async function leavePod(podId: string, userId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    const members = await getDemoPodMembers();
    await saveDemoPodMembers(members.filter(m => !(m.pod_id === podId && m.user_id === userId)));
    return { error: null };
  }

  const { error } = await supabase.from('pod_members').delete().match({ pod_id: podId, user_id: userId });
  return { error: error?.message || null };
}
