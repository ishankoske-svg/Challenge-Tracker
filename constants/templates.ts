export interface TaskTemplate {
  label: string;
  type: 'checkbox' | 'numeric' | 'photo' | 'text_note';
  unit?: string;
}

export interface ChallengeTemplate {
  id: string;
  title: string;
  category: 'fitness' | 'coding' | 'academics' | 'language' | 'mindset' | 'custom';
  duration_days: number;
  description: string;
  tasks: TaskTemplate[];
}

export const TEMPLATES: ChallengeTemplate[] = [
  {
    id: '75hard',
    title: '75 Hard',
    category: 'fitness',
    duration_days: 75,
    description: 'Mental toughness program requiring 2 workouts daily, 1 gallon water, diet discipline, 10 pages reading & daily progress photo.',
    tasks: [
      { label: '2 × 45-min workouts', type: 'checkbox' },
      { label: 'Drink 1 gallon of water', type: 'checkbox' },
      { label: 'Follow diet plan (no cheat meals)', type: 'checkbox' },
      { label: 'Read 10 pages non-fiction', type: 'checkbox' },
      { label: 'Progress photo', type: 'photo' },
      { label: 'Weight today', type: 'numeric', unit: 'kg' },
    ],
  },
  {
    id: '100code',
    title: '100 Days of Code',
    category: 'coding',
    duration_days: 100,
    description: 'Commit to coding for at least 1 hour every single day and document your learning progress.',
    tasks: [
      { label: 'Code for at least 1 hour', type: 'checkbox' },
      { label: 'What did you build/learn today?', type: 'text_note' },
    ],
  },
  {
    id: 'language30',
    title: '30-Day Language Sprint',
    category: 'language',
    duration_days: 30,
    description: 'Build consistency learning a new foreign language with daily lesson reviews and vocabulary tracking.',
    tasks: [
      { label: 'Completed daily lesson / Duolingo', type: 'checkbox' },
      { label: 'New words learned', type: 'numeric', unit: 'words' },
      { label: 'Grammar or conversation notes', type: 'text_note' },
    ],
  },
  {
    id: 'reading30',
    title: '30-Day Reading Streak',
    category: 'academics',
    duration_days: 30,
    description: 'Establish a lifelong daily reading habit to absorb key insights and retain knowledge.',
    tasks: [
      { label: 'Pages read today', type: 'numeric', unit: 'pages' },
      { label: 'Key takeaway or core insight', type: 'text_note' },
    ],
  },
];
