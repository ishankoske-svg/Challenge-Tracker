# Challengr — Master Feature & Architecture Specification

Challengr is a cross-platform personal challenge tracker built with **React Native + Expo** (iOS, Android, Web) and **Supabase** as the backend.

---

## Part 1: Completed Baseline Phases (Preserved & Active)

### Phase 1: Foundation & Authentication
- Supabase Auth integration (email/password login & sign-up).
- Demo Mode fallback using `AsyncStorage`.
- Global authentication state with Zustand (`useAuthStore`).

### Phase 2: Core Data Engine & Challenge Creator
- Multi-step challenge wizard with template selector (`75 Hard`, `100 Days of Code`, `30-Day Language Sprint`, `30-Day Reading`).
- Custom challenge builder with dynamic tasks (checkbox, numeric, photo, text note).
- Active challenge store (`useChallengeStore`).

### Phase 3: Daily Logging & Progress Tracking
- Interactive daily task logging screen (`log.tsx`).
- Photo attachments with `expo-image-picker`.
- Streak calculation & daily task completion state.

### Phase 4: Data Visualization & AI Insights
- Victory Native interactive completion bar charts & trend lines.
- AI progress summary generator (`lib/ai.ts`).

### Phase 5: Rewards, History & Failure Analytics
- Event-driven badge engine (`lib/badges.ts`) & visual `<BadgeGrid />`.
- Full challenge history list (Active, Completed, Failed).
- Give Up feedback flow with reason text input.
- Keyword-based failure analytics (`<FailureInsights />`) with percentage category breakdown.

---

## Part 2: Feature Integration Specification

### 1. Core Data Model Changes

#### 1.1 Task Types

Every task within a challenge is one of two types:

| Type | Description | Example |
|---|---|---|
| `definite` | Has a numeric daily target. Progress is logged as a quantity. | "Solve 5 DSA problems" |
| `binary` | Simple done/not-done. No quantity. | "Do skincare" |

**Task fields:**
```ts
interface ChallengeTask {
  id: string;
  challenge_id: string;
  label: string;
  type: 'checkbox' | 'numeric' | 'photo' | 'text_note';
  task_type: 'definite' | 'binary';
  target_quantity?: number | null; // required if task_type = definite
  unit?: string | null;           // e.g. "problems", "pages", "kg"
  is_compulsory: boolean;        // default true
  sort_order: number;
  created_at: string;
}
```

#### 1.2 Daily Log Entries

```ts
interface DailyLogEntry {
  task_id: string;
  completed_quantity: number | null; // for definite tasks
  is_done: boolean;                  // for binary tasks
}

interface DailyLog {
  id: string;
  challenge_id: string;
  user_id: string;
  day_number?: number;
  log_date: string;                  // YYYY-MM-DD
  tasks_completed: Record<string, any>;
  compulsory_completion_pct: number; // 0..100
  optional_bonus_pct: number;        // 0..100
  penalty_triggered: boolean;
  missed_task_ids: string[];
  notes?: string | null;
  created_at: string;
}
```

#### 1.3 Completion % Formula

Per day, per task:
- Definite: `task_score = min(completed_quantity / target_quantity, 1.0)`
- Binary: `task_score = is_done ? 1.0 : 0.0`

Pool calculation (compulsory vs optional):
```ts
compulsory_completion_pct = avg(task_score for all compulsory tasks that day) * 100
optional_bonus_pct        = avg(task_score for all optional tasks that day) * 100
```
Display format: "Core: 80% · Bonus: 60%". Optional tasks feed a separate bonus consistency score and never factor into penalties or main streaks.

#### 1.4 Challenge Table Schema

```ts
type DifficultyMode = 'hardcore' | 'hard' | 'medium' | 'easy';

interface Challenge {
  id: string;
  user_id: string;
  title: string;
  category: 'fitness' | 'coding' | 'academics' | 'language' | 'mindset' | 'custom';
  description: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'failed' | 'paused';
  difficulty_mode: DifficultyMode;
  max_penalties: number;           // computed at creation
  penalties_used: number;          // default 0
  template_id?: string | null;
  failure_reason?: string | null;
  created_at: string;
  tasks?: ChallengeTask[];
}
```

---

### 2. Difficulty Modes & Penalty System

#### 2.1 Base Penalty Allowance (30-Day Baseline)

| Mode | Penalties Allowed (30 Days) | XP Multiplier | Description |
|---|---|---|---|
| `hardcore` | 0 | 3.0x | Zero room for error. Miss once and it's over. |
| `hard` | 2 | 2.0x | 2 penalties per 30 days buffer. High discipline. |
| `medium` | 5 | 1.5x | 5 penalties per 30 days buffer. Balanced pace. |
| `easy` | 10 | 1.0x | 10 penalties per 30 days buffer. Build habit first. |
| `relaxed` | Unlimited | 0.0x | Track Only mode. No penalties, no failing, no XP. |

#### 2.2 Scaling Formula

For a challenge of length `N` days:
```ts
allowed_penalties = Math.round(base_penalties * (N / 30));
if (mode === 'relaxed') return 999; // No penalties
```
// Floor rule: Hard/Medium/Easy always get at least 1 buffer,
// even on short challenges, so they stay distinct from Hardcore.
if (mode !== 'hardcore') {
  allowed_penalties = Math.max(1, allowed_penalties);
}

#### 2.3 Penalty Trigger Rule (Day-Level)

Missing any compulsory task on a given day = 1 penalty for that day (capped at 1 per day).

```ts
if (compulsory_completion_pct < 100) {
  day.penalty_triggered = true;
  day.missed_task_ids = incompleteCompulsoryTaskIds;
  challenge.penalties_used += 1;
}

if (challenge.penalties_used > challenge.max_penalties) {
  challenge.status = 'failed';
}
```

#### 2.4 Grace Window

Allow logging/editing the previous day up until 6:00 AM the next day before log evaluation is locked in as final.

#### 2.5 UI Requirements
- Persistent "penalties remaining" indicator (❤️ heart/life style) visible on Challenge Card, Log Screen, and Stats Screen.
- When a penalty is used, show a toast/modal: which task(s) caused it, and penalties remaining.
- Prominently warn user when down to their last penalty.

---

### 3. Trajectory Engine (Prediction Feature)

- **Inputs**: `compulsory_completion_pct`, `optional_bonus_pct`, task quantity history, `penalties_used`, rolling 14-day consistency.
- **Trend Fitting**: Diminishing-returns curve `y = a - b * exp(-c * day)` fitted via least-squares.
- **Output Card**: "At your current pace, you'll be solving ~9 DSA problems/day and averaging 87% consistency by Day 100."
- **Interactive Slider**: "What Changes the Projection" consistency slider (drag 80% → 95% to see updated projection live).

---

### 4. Gamification

- **Streak freeze / penalty shield**: Earned after 7 consecutive days at 100% compulsory completion. Can be manually applied to cancel a pending penalty.
- **XP + Level system**: Global across all challenges. XP awarded per completed day, weighted by difficulty.
- **Badges**: Event-driven rewards (`first_win`, `streak_7`, `streak_30`, `days_100`, category starters, `iron_will`, `comeback_kid`, `consistency_king`).

---

### 5. Social / Accountability

- **Accountability pods**: Groups of 2–4 users showing daily completion %.
- **Public challenge feed (opt-in)**: "Day X/90" shareable cards.
- **Forkable challenge templates**: Publish custom challenge presets for others to clone.

---

### 6. Analytics & Insight

- **Weekly recap card**: Auto-generated shareable image card.
- **Task-level breakdown**: Definite vs Binary completion comparison.
- **Failure Analytics**: Categorized failure reasons (Motivation, Time, Health, Difficulty, Life Events, Consistency).

---

### 7. Flexibility / Life-Proofing

- **Pause/vacation mode**: Freeze challenge for up to 3 days (no penalties, excluded from trend fitting).
- **Mid-challenge task editing**: Capped adjustments to definite task target quantities.

---

### 8. Progress Photo Features (Scrubber + Gallery)

- **Gallery View**: Camera-roll grid layout with tap-to-compare side-by-side view.
- **Sequence View**: Interactive day-by-day scrubber + timelapse video export (~2-4 fps).

---

## Part 3: Phased Roadmap

- `[x]` **Phase 1-5 Baseline**: Auth, Themes, Templates, AI Insights, Badges, Failure Analytics (Preserved).
- `[ ]` **Phase 1 (New)**: Core Mechanics (Definite/Binary, Compulsory flag, Difficulty modes, Penalty Hearts UI).
- `[ ]` **Phase 1.5 (New)**: Progress Photo Views (Gallery Grid & Scrubber).
- `[ ]` **Phase 2 (New)**: Trajectory Engine (Trend fitting & interactive slider).
- `[ ]` **Phase 3 (New)**: Gamification (XP/Levels, Shields, Badges).
- `[ ]` **Phase 4 (New)**: Flexibility (Pause mode & target editing).
- `[ ]` **Phase 5 (New)**: Analytics (Weekly recaps & time-of-day breakdown).
- `[ ]` **Phase 6 (New)**: Social (Pods & Public Feed).
- `[ ]` **Phase 7 (New)**: AI Layer (Adaptive difficulty & personalized nudges).