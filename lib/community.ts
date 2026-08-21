import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { Challenge, ChallengeTask } from './challenges';

export interface CommunityTemplate {
  id: string;
  author_id: string;
  title: string;
  category: string;
  description: string;
  tasks_json: ChallengeTask[];
  fork_count: number;
  like_count: number;
  created_at: string;
}

const DEMO_TEMPLATES_KEY = '@challengr_demo_templates';
const DEMO_LIKES_KEY = '@challengr_demo_template_likes';

function generateId() {
  return 'tpl-' + Date.now().toString(36);
}

const SEED_TEMPLATES: CommunityTemplate[] = [
  {
    id: 'seed1',
    author_id: 'community1',
    title: '75 Hard - Ultimate Challenge',
    category: 'fitness',
    description: 'The infamous mental toughness program.',
    tasks_json: [
      { id: '1', type: 'checkbox', label: 'Follow a diet', is_compulsory: true },
      { id: '2', type: 'checkbox', label: 'Workout 1 (45m, outside)', is_compulsory: true },
      { id: '3', type: 'checkbox', label: 'Workout 2 (45m)', is_compulsory: true },
      { id: '4', type: 'checkbox', label: 'No alcohol/cheat meals', is_compulsory: true },
      { id: '5', type: 'photo', label: 'Progress photo', is_compulsory: true },
      { id: '6', type: 'numeric', label: 'Drink water', unit: 'Gallon', is_compulsory: true },
      { id: '7', type: 'numeric', label: 'Read nonfiction', unit: 'Pages', is_compulsory: true },
    ],
    fork_count: 1450,
    like_count: 3200,
    created_at: new Date().toISOString()
  },
  {
    id: 'seed2',
    author_id: 'community2',
    title: 'Code Everyday (100 Days of Code)',
    category: 'coding',
    description: 'Code for at least 1 hour every day for 100 days.',
    tasks_json: [
      { id: '1', type: 'checkbox', label: 'Code for 1 hour', is_compulsory: true },
      { id: '2', type: 'text_note', label: 'What did you learn?', is_compulsory: false },
      { id: '3', type: 'checkbox', label: 'Post update to Twitter/social', is_compulsory: true },
    ],
    fork_count: 850,
    like_count: 1200,
    created_at: new Date().toISOString()
  },
  {
    id: 'seed3',
    author_id: 'community3',
    title: 'Morning Routine Builder',
    category: 'mindset',
    description: 'Start the day right.',
    tasks_json: [
      { id: '1', type: 'checkbox', label: 'Wake up before 7 AM', is_compulsory: true },
      { id: '2', type: 'checkbox', label: 'Make bed', is_compulsory: true },
      { id: '3', type: 'numeric', label: 'Meditate', unit: 'Minutes', is_compulsory: true },
      { id: '4', type: 'checkbox', label: 'No phone for first hour', is_compulsory: true },
    ],
    fork_count: 420,
    like_count: 650,
    created_at: new Date().toISOString()
  }
];

export async function fetchCommunityTemplates(): Promise<{ templates: CommunityTemplate[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    try {
      const raw = await AsyncStorage.getItem(DEMO_TEMPLATES_KEY);
      if (raw) {
        return { templates: JSON.parse(raw), error: null };
      } else {
        await AsyncStorage.setItem(DEMO_TEMPLATES_KEY, JSON.stringify(SEED_TEMPLATES));
        return { templates: SEED_TEMPLATES, error: null };
      }
    } catch {
      return { templates: SEED_TEMPLATES, error: null };
    }
  }

  const { data, error } = await supabase
    .from('community_templates')
    .select('*')
    .order('like_count', { ascending: false });

  return { templates: (data as CommunityTemplate[]) || [], error: error?.message || null };
}

export async function publishTemplate(challenge: Challenge, userId: string): Promise<{ template: CommunityTemplate | null; error: string | null }> {
  const newTpl: CommunityTemplate = {
    id: generateId(),
    author_id: userId,
    title: challenge.title,
    category: challenge.category,
    description: challenge.description || '',
    tasks_json: challenge.tasks || [],
    fork_count: 0,
    like_count: 0,
    created_at: new Date().toISOString()
  };

  if (!isSupabaseConfigured()) {
    const { templates } = await fetchCommunityTemplates();
    await AsyncStorage.setItem(DEMO_TEMPLATES_KEY, JSON.stringify([newTpl, ...templates]));
    return { template: newTpl, error: null };
  }

  const { data, error } = await supabase
    .from('community_templates')
    .insert([newTpl])
    .select()
    .single();

  return { template: (data as CommunityTemplate), error: error?.message || null };
}

export async function getTemplateLikes(userId: string): Promise<{ likedIds: string[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    try {
      const raw = await AsyncStorage.getItem(DEMO_LIKES_KEY);
      return { likedIds: raw ? JSON.parse(raw) : [], error: null };
    } catch {
      return { likedIds: [], error: null };
    }
  }

  const { data, error } = await supabase.from('template_likes').select('template_id').eq('user_id', userId);
  return { likedIds: data?.map(d => d.template_id) || [], error: error?.message || null };
}

export async function toggleTemplateLike(templateId: string, userId: string, currentlyLiked: boolean): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    const { likedIds } = await getTemplateLikes(userId);
    let newLikes = [...likedIds];
    if (currentlyLiked) {
      newLikes = newLikes.filter(id => id !== templateId);
    } else {
      newLikes.push(templateId);
    }
    await AsyncStorage.setItem(DEMO_LIKES_KEY, JSON.stringify(newLikes));
    
    // Update local template count
    const { templates } = await fetchCommunityTemplates();
    const updated = templates.map(t => {
      if (t.id === templateId) {
        return { ...t, like_count: t.like_count + (currentlyLiked ? -1 : 1) };
      }
      return t;
    });
    await AsyncStorage.setItem(DEMO_TEMPLATES_KEY, JSON.stringify(updated));

    return { error: null };
  }

  if (currentlyLiked) {
    await supabase.from('template_likes').delete().match({ user_id: userId, template_id: templateId });
    // Trigger or RPC could update the like_count, or we do it manually (for simplicity manually incrementing here requires a rpc or optimistic update in UI)
  } else {
    await supabase.from('template_likes').insert([{ user_id: userId, template_id: templateId }]);
  }

  return { error: null };
}
