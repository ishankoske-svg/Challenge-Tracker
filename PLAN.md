# Challengr — Master Feature & Architecture Specification

Challengr is a cross-platform personal challenge tracker built with **React Native + Expo** (iOS, Android, Web) and **Supabase** as the backend.

---

## Part 1: Completed Baseline & Phase 1 Core Mechanics

### 1.1 Foundation & Infrastructure (Completed)
- Supabase Auth integration & Demo Mode fallback using `AsyncStorage`.
- Global authentication state with Zustand (`useAuthStore`).
- Theme switcher with 3 curated themes (`midnight`, `forest`, `ember`).

### 1.2 Core Data Model (Definite vs Binary & Compulsory Pools) (Completed)
- Every task is typed as either `definite` (numeric target, e.g. "5 DSA problems") or `binary` (done/not-done).
- Tasks are flagged as `is_compulsory: boolean` (Core tasks impact penalties; Bonus tasks feed separate bonus score).
- Dual completion meter rendering: **Core: XX% · Bonus: YY%**.

### 1.3 Difficulty Modes & Penalty Hearts System (Completed)
- **5 Difficulty Modes**:
  - 🔥 **Hardcore**: 0 penalties allowed (3.0x XP)
  - ⚡ **Hard**: 2 penalties per 30 days (2.0x XP)
  - 💪 **Medium**: 5 penalties per 30 days (1.5x XP)
  - 🌱 **Easy**: 10 penalties per 30 days (1.0x XP)
  - ☕ **Track Only (Relaxed)**: Unlimited penalties, no auto-fail, no XP (0.0x XP)
- **Automatic Scaling**: `calculateMaxPenalties(mode, durationDays)` scaled to 30-day baseline.
- **Penalty Engine & Unlogged Day Reconciliation**:
  - Missing core tasks on a day consumes 1 penalty heart.
  - Automatically reconciles unlogged past days after 6:00 AM grace period cutoff.
  - Auto-fails challenge when remaining penalty hearts reach 0.
- **UI Components**: Persistent `<PenaltyIndicator />` hearts counter on Challenge Cards, Daily Log, and Stats screen.

---

## Part 2: Feature Integration Specification

### 1. Core Data Model Changes

#### 1.1 Task Types
| Type | Description | Example |
|---|---|---|
| `definite` | Has a numeric daily target. Progress is logged as a quantity. | "Solve 5 DSA problems" |
| `binary` | Simple done/not-done. No quantity. | "Do skincare" |

#### 1.2 Challenge Table Additions
```ts
type ChallengeDomain = 'fitness' | 'coding' | 'learning' | 'creative' | 'other';

interface Challenge {
  ...existing fields...
  domain_tag: ChallengeDomain;
  difficulty_mode: DifficultyMode;
  max_penalties: number;
  penalties_used: number;
}
```

---

### 2. Gamification — Badge & XP Engine

#### 2.1 Difficulty Multipliers & Base XP
- **Easy**: `1.0x XP`
- **Medium**: `1.5x XP`
- **Hard**: `2.0x XP`
- **Hardcore**: `3.0x XP`
- **Track Only**: `0.0x XP`

#### 2.2 Badge Tiers & Base XP
Each badge has a `difficulty_tier` 1–5:
| Tier | Base XP |
|---|---|
| 1 | 50 XP |
| 2 | 150 XP |
| 3 | 400 XP |
| 4 | 900 XP |
| 5 | 2000 XP |

- **Hardcore Multiplier**: Badges flagged `is_hardcore_exclusive` get a `1.5x` base XP multiplier.

#### 2.3 First in Domain & Hardcore Stacking Bonuses
- First badge earned in a domain (`fitness`, `coding`, `learning`, `creative`, `other`, `consistency`, `difficulty`, `milestone`, `social`): **+100 XP Bonus**.
- First Hardcore badge earned ever: **+300 XP Bonus**.
- **Stacking Formula**:
```ts
total_xp_awarded = Math.round(base_xp * (is_hardcore_exclusive ? 1.5 : 1.0))
                  + (isFirstInDomain ? 100 : 0)
                  + (isFirstHardcore ? 300 : 0);
```

#### 2.4 Complete Badge Catalog

##### Consistency
- T1 **First Step** — Complete Day 1 of any challenge
- T1 **Week One** — 7-day streak
- T2 **Fortnight Strong** — 14-day streak
- T2 **Halfway There** — Reach midpoint of any challenge at 80%+ avg completion
- T3 **Iron Habit** — 30-day streak
- T3 **Comeback Kid** — Recover full streak after using a penalty
- T4 **Consistency King/Queen** — Finish a challenge with 90%+ avg completion
- T5 **Unbroken** — Complete a 90+ day challenge with 0 penalties used

##### Difficulty
- T2 **Stepping It Up** — Complete a challenge on Medium mode
- T3 **No Excuses** — Complete a challenge on Hard mode
- T4 **Hardcore Initiate** [hardcore-exclusive] — Complete a 30+ day Hardcore challenge
- T5 **Zero Penalties, Zero Regrets** [hardcore-exclusive] — Complete a 90-day Hardcore challenge
- T5 **Mode Master** — Complete at least one challenge in every difficulty mode

##### Domain: Fitness
- T1 **First Rep** — First fitness-tagged task completion
- T2 **Gains Log** — Complete a 30-day fitness challenge
- T3 **Transformation** — Complete a 90-day fitness challenge at 85%+ completion
- T4 **Beast Mode** [hardcore-exclusive] — Complete a 90-day Hardcore fitness challenge

##### Domain: Coding
- T1 **Hello World** — First coding task completion
- T2 **Problem Solver** — 100+ total problems logged across a challenge
- T3 **Grinder** — Complete a 60+ day coding challenge at 85%+ completion
- T4 **Algorithm Master** [hardcore-exclusive] — Complete a 90-day Hardcore coding challenge

##### Domain: Learning
- T1 **First Lesson** — First learning task completion
- T2 **Steady Study** — 21-day streak on a learning challenge
- T3 **Deep Focus** — Complete a 60+ day learning challenge at 85%+ completion

##### Domain: Creative
- T1 **First Sketch** — First creative task completion
- T2 **Creative Flow** — 14-day streak on a creative challenge
- T3 **Portfolio Builder** — Complete a 60+ day creative challenge

##### Milestone
- T1 **Getting Started** — Complete first challenge
- T2 **Repeat Achiever** — Complete 3 challenges total
- T3 **Habit Architect** — Complete 10 challenges total
- T3 **Photo Diary** — Upload progress photos on 30 distinct days
- T4 **The Long Game** — Accumulate 365 total logged days

##### Social
- T1 **Not Alone** — Join or create an accountability pod
- T2 **Trailblazer** — Have your template forked by another user
- T3 **Community Pillar** — Template forked 10+ times

---

### 3. Trajectory Engine (Prediction Feature)
- **Curve fitting**: `y = a - b * exp(-c * day)`
- Projection card UI + interactive consistency slider.

---

### 4. Progress Photo Features (Scrubber & Gallery)
- **Gallery View**: Grid + tap-to-compare side-by-side view.
- **Sequence View**: Interactive day-by-day scrubber + timelapse video export (~2-4 fps).

---

### 5. Flexibility & Life-Proofing
- **Pause / Vacation Mode**: Freeze challenge for up to 3 days.
- **Mid-challenge task editing**: Capped adjustments to target quantities.

---

## Part 3: Roadmap

- `[x]` **Phase 1**: Core Mechanics (Definite/Binary tasks, 30-day Penalty Baseline, Heart Lives UI, Auto-Penalties)
- `[ ]` **Phase 3**: Gamification Engine (Expanded Badge Catalog, Domain Tags, Tiered XP & Bonus Stacking, Level System)
- `[ ]` **Phase 1.5**: Progress Photo Scrubber & Gallery Grid
- `[ ]` **Phase 2**: Trajectory Engine & Interactive Projection Slider
- `[ ]` **Phase 4**: Flexibility (Pause Mode & Mid-Challenge Target Edits)
- `[ ]` **Phase 5**: Analytics & Content (Weekly Recaps & Time-of-day breakdowns)
- `[ ]` **Phase 6**: Social (Pods & Public Feed)
- `[ ]` **Phase 7**: AI Layer (Adaptive Difficulty & Smart Nudges)