export interface TaskTemplate {
  label: string;
  type: 'checkbox' | 'numeric' | 'photo' | 'text_note';
  unit?: string;
  // --- Phase 1 additions (optional for backward compat) ---
  task_type?: 'definite' | 'binary';       // definite = numeric target, binary = done/not-done
  target_quantity?: number | null;          // required when task_type = 'definite'
  is_compulsory?: boolean;                  // default true
}

export interface ChallengeTemplate {
  id: string;
  title: string;
  category: 'fitness' | 'coding' | 'academics' | 'language' | 'mindset' | 'custom';
  duration_days: number;
  description: string;
  default_difficulty?: 'hardcore' | 'hard' | 'medium' | 'easy';
  tasks: TaskTemplate[];
}

export const TEMPLATES: ChallengeTemplate[] = [
  {
    id: '75hard',
    title: '75 Hard',
    category: 'fitness',
    duration_days: 75,
    description: 'Mental toughness program requiring 2 workouts daily, 1 gallon water, diet discipline, 10 pages reading & daily progress photo.',
    default_difficulty: 'hardcore',
    tasks: [
      { label: '2 × 45-min workouts', type: 'checkbox', task_type: 'binary', is_compulsory: true },
      { label: 'Drink 1 gallon of water', type: 'checkbox', task_type: 'binary', is_compulsory: true },
      { label: 'Follow diet plan (no cheat meals)', type: 'checkbox', task_type: 'binary', is_compulsory: true },
      { label: 'Read 10 pages non-fiction', type: 'checkbox', task_type: 'binary', is_compulsory: true },
      { label: 'Progress photo', type: 'photo', task_type: 'binary', is_compulsory: true },
      { label: 'Weight today', type: 'numeric', task_type: 'definite', target_quantity: 1, unit: 'kg', is_compulsory: false },
    ],
  },
  {
    id: '100code',
    title: '100 Days of Code',
    category: 'coding',
    duration_days: 100,
    description: 'Commit to coding for at least 1 hour every single day and document your learning progress.',
    default_difficulty: 'medium',
    tasks: [
      { label: 'Code for at least 1 hour', type: 'checkbox', task_type: 'binary', is_compulsory: true },
      { label: 'What did you build/learn today?', type: 'text_note', task_type: 'binary', is_compulsory: false },
    ],
  },
  {
    id: 'language30',
    title: '30-Day Language Sprint',
    category: 'language',
    duration_days: 30,
    description: 'Build consistency learning a new foreign language with daily lesson reviews and vocabulary tracking.',
    default_difficulty: 'medium',
    tasks: [
      { label: 'Completed daily lesson / Duolingo', type: 'checkbox', task_type: 'binary', is_compulsory: true },
      { label: 'New words learned', type: 'numeric', task_type: 'definite', target_quantity: 5, unit: 'words', is_compulsory: true },
      { label: 'Grammar or conversation notes', type: 'text_note', task_type: 'binary', is_compulsory: false },
    ],
  },
  {
    id: 'reading30',
    title: '30-Day Reading Streak',
    category: 'academics',
    duration_days: 30,
    description: 'Establish a lifelong daily reading habit to absorb key insights and retain knowledge.',
    default_difficulty: 'easy',
    tasks: [
      { label: 'Pages read today', type: 'numeric', task_type: 'definite', target_quantity: 20, unit: 'pages', is_compulsory: true },
      { label: 'Key takeaway or core insight', type: 'text_note', task_type: 'binary', is_compulsory: false },
    ],
  },
  {
    id: 'dsa90',
    title: '90-Day DSA Grind',
    category: 'coding',
    duration_days: 90,
    description: 'Build algorithmic problem-solving skills by solving a set number of problems daily.',
    default_difficulty: 'hard',
    tasks: [
      { label: 'DSA problems solved', type: 'numeric', task_type: 'definite', target_quantity: 5, unit: 'problems', is_compulsory: true },
      { label: 'Reviewed solutions / editorials', type: 'checkbox', task_type: 'binary', is_compulsory: true },
      { label: 'Notes on patterns learned', type: 'text_note', task_type: 'binary', is_compulsory: false },
    ],
  },
];
