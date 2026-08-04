import { supabase, isSupabaseConfigured } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_USER_KEY = '@challengr_demo_user';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  theme?: string;
}

export async function signUpUser(email: string, password: string, displayName?: string) {
  if (!isSupabaseConfigured()) {
    // Demo mode signup fallback
    const mockUser: UserProfile = {
      id: 'demo-user-' + Date.now(),
      email,
      display_name: displayName || email.split('@')[0],
      theme: 'midnight',
    };
    await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
    return { data: { user: mockUser, session: { access_token: 'demo-token' } }, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  });

  if (data?.user && !error) {
    // Ensure profile entry exists
    await supabase.from('users').upsert({
      id: data.user.id,
      display_name: displayName || email.split('@')[0],
      theme: 'midnight',
    });
  }

  return { data, error };
}

export async function signInUser(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    const saved = await AsyncStorage.getItem(DEMO_USER_KEY);
    const mockUser: UserProfile = saved
      ? JSON.parse(saved)
      : {
          id: 'demo-user-123',
          email,
          display_name: email.split('@')[0],
          theme: 'midnight',
        };
    await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
    return { data: { user: mockUser, session: { access_token: 'demo-token' } }, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signOutUser() {
  if (!isSupabaseConfigured()) {
    await AsyncStorage.removeItem(DEMO_USER_KEY);
    return { error: null };
  }
  return await supabase.auth.signOut();
}

export async function getCurrentUserSession() {
  if (!isSupabaseConfigured()) {
    const saved = await AsyncStorage.getItem(DEMO_USER_KEY);
    if (saved) {
      const mockUser = JSON.parse(saved);
      return { user: mockUser, session: { access_token: 'demo-token' } };
    }
    return { user: null, session: null };
  }

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return { user: data.session.user, session: data.session };
  }
  return { user: null, session: null };
}
