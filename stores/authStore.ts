import { create } from 'zustand';
import { getCurrentUserSession, signOutUser, UserProfile } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: any | null) => void;
  setSession: (session: any | null) => void;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const { user, session } = await getCurrentUserSession();
      set({ user, session, isLoading: false, isInitialized: true });

      if (isSupabaseConfigured()) {
        supabase.auth.onAuthStateChange((_event, session) => {
          set({ session, user: session?.user ?? null, isLoading: false });
        });
      }
    } catch (e) {
      console.error('Error initializing auth store:', e);
      set({ isLoading: false, isInitialized: true });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await signOutUser();
    set({ user: null, session: null, isLoading: false });
  },
}));
