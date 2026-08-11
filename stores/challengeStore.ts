import { create } from 'zustand';
import {
  Challenge,
  ChallengeStatus,
  DifficultyMode,
  ChallengeDomain,
  fetchChallenges,
  createChallenge as createChallengeApi,
  deleteChallenge as deleteChallengeApi,
} from '../lib/challenges';
import { TaskTemplate } from '../constants/templates';
import { ChallengeCategory } from '../lib/challenges';
import { reconcileUnloggedDaysPenalties } from '../lib/logs';

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
    domainTag?: ChallengeDomain,
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
    const { challenges: fetched, error } = await fetchChallenges(userId);

    // Reconcile unlogged days penalties for active challenges
    const updatedChallenges = [...fetched];
    for (let i = 0; i < updatedChallenges.length; i++) {
      if (updatedChallenges[i].status === 'active') {
        const { penaltiesAdded, failed } = await reconcileUnloggedDaysPenalties(updatedChallenges[i], userId);
        if (penaltiesAdded > 0) {
          updatedChallenges[i] = {
            ...updatedChallenges[i],
            penalties_used: (updatedChallenges[i].penalties_used || 0) + penaltiesAdded,
            status: failed ? 'failed' : updatedChallenges[i].status,
          };
        }
      }
    }

    const active = updatedChallenges.filter((c) => c.status === 'active');
    set({ challenges: updatedChallenges, activeChallenges: active, isLoading: false, error });
  },

  addChallenge: async (userId, title, category, description, durationDays, startDate, tasks, difficultyMode, domainTag, templateId) => {
    set({ isLoading: true, error: null });
    const { challenge, error } = await createChallengeApi(
      userId, title, category, description, durationDays, startDate, tasks, difficultyMode, domainTag, templateId,
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
