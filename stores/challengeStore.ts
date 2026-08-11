import { create } from 'zustand';
import {
  Challenge,
  ChallengeStatus,
  DifficultyMode,
  fetchChallenges,
  createChallenge as createChallengeApi,
  deleteChallenge as deleteChallengeApi,
} from '../lib/challenges';
import { TaskTemplate } from '../constants/templates';
import { ChallengeCategory } from '../lib/challenges';

interface ChallengeState {
  challenges: Challenge[];
  activeChallenges: Challenge[];
  isLoading: boolean;
  error: string | null;

  loadChallenges: (userId: string) => Promise<void>;
  addChallenge: (
    userId: string,
    title: string,
    category: ChallengeCategory,
    description: string,
    durationDays: number,
    startDate: Date,
    tasks: TaskTemplate[],
    difficultyMode: DifficultyMode,
    templateId?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removeChallenge: (challengeId: string) => Promise<void>;
  getActiveCount: () => number;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  activeChallenges: [],
  isLoading: false,
  error: null,

  loadChallenges: async (userId: string) => {
    set({ isLoading: true, error: null });
    const { challenges, error } = await fetchChallenges(userId);
    const active = challenges.filter((c) => c.status === 'active');
    set({ challenges, activeChallenges: active, isLoading: false, error });
  },

  addChallenge: async (userId, title, category, description, durationDays, startDate, tasks, difficultyMode, templateId) => {
    set({ isLoading: true, error: null });
    const { challenge, error } = await createChallengeApi(
      userId, title, category, description, durationDays, startDate, tasks, difficultyMode, templateId,
    );
    if (error || !challenge) {
      set({ isLoading: false, error: error || 'Unknown error' });
      return { success: false, error: error || 'Unknown error' };
    }
    const prev = get().challenges;
    const updated = [challenge, ...prev];
    const active = updated.filter((c) => c.status === 'active');
    set({ challenges: updated, activeChallenges: active, isLoading: false });
    return { success: true };
  },

  removeChallenge: async (challengeId: string) => {
    set({ isLoading: true });
    await deleteChallengeApi(challengeId);
    const prev = get().challenges;
    const updated = prev.filter((c) => c.id !== challengeId);
    const active = updated.filter((c) => c.status === 'active');
    set({ challenges: updated, activeChallenges: active, isLoading: false });
  },

  getActiveCount: () => get().activeChallenges.length,
}));
