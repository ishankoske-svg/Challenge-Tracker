# Challengr — App Build Plan

## What this app is
Challengr is a cross-platform personal challenge tracker built with **React Native + Expo** (iOS, Android, Web) and **Supabase** as the backend. Users set up challenges, log daily progress, upload photos/videos, track metrics (like weight), view progress graphs, earn rewards/badges, and see a full history of completed and failed challenges on their profile.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo (SDK 51+) |
| Navigation | Expo Router (file-based, tab + stack) |
| State management | Zustand |
| Backend / DB | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| File storage | Supabase Storage (photos, videos) |
| Charts | victory-native |
| AI summary | Anthropic API (claude-sonnet-4-6) |
| Notifications | Expo Notifications |
| Styling | StyleSheet + theme context |

---

## Database schema (Supabase / Postgres)

### `users` (extends Supabase auth.users)
- `id` uuid PK
- `display_name` text
- `avatar_url` text
- `theme` text default 'midnight'
- `created_at` timestamp

### `challenges`
- `id` uuid PK
- `user_id` uuid FK → users.id
- `title` text
- `category` text  (fitness | coding | academics | language | mindset | custom)
- `description` text
- `duration_days` int
- `start_date` date
- `end_date` date
- `status` text  (active | completed | failed | paused)
- `template_id` text nullable
- `created_at` timestamp

### `challenge_tasks`
- `id` uuid PK
- `challenge_id` uuid FK → challenges.id
- `label` text
- `type` text  (checkbox | numeric | photo | text_note)
- `unit` text nullable  (e.g. 'kg', 'pages', 'km')
- `sort_order` int

### `daily_logs`
- `id` uuid PK
- `challenge_id` uuid FK → challenges.id
- `user_id` uuid FK → users.id
- `log_date` date
- `tasks_completed` jsonb  (map of task_id → value/bool)
- `notes` text nullable
- `created_at` timestamp

### `media_uploads`
- `id` uuid PK
- `daily_log_id` uuid FK → daily_logs.id
- `user_id` uuid FK → users.id
- `storage_path` text  (Supabase storage path)
- `media_type` text  (image | video)
- `created_at` timestamp

### `badges`
- `id` uuid PK
- `key` text UNIQUE  (e.g. 'first_win', 'streak_7', 'streak_30', 'fitness_starter', 'days_100')
- `name` text
- `description` text
- `icon` text  (icon name string)

### `user_badges`
- `id` uuid PK
- `user_id` uuid FK → users.id
- `badge_id` uuid FK → badges.id
- `earned_at` timestamp

---

## Folder structure

```
challengr/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── index.tsx          # Home — active challenges
│   │   ├── log.tsx            # Daily log
│   │   ├── stats.tsx          # Progress & charts
│   │   ├── new.tsx            # New challenge
│   │   └── profile.tsx        # Profile + history + badges
│   └── _layout.tsx
├── components/
│   ├── ChallengeCard.tsx
│   ├── TaskRow.tsx
│   ├── ProgressBar.tsx
│   ├── StreakGrid.tsx
│   ├── MetricCard.tsx
│   ├── BadgeGrid.tsx
│   ├── TemplateCard.tsx
│   ├── UploadZone.tsx
│   ├── WeightChart.tsx
│   └── ThemeSwitcher.tsx
├── lib/
│   ├── supabase.ts            # Supabase client init
│   ├── auth.ts                # Auth helpers
│   ├── challenges.ts          # Challenge CRUD
│   ├── logs.ts                # Daily log CRUD
│   ├── badges.ts              # Badge unlock logic
│   ├── storage.ts             # Media upload helpers
│   └── ai.ts                  # Anthropic API summary call
├── stores/
│   ├── authStore.ts
│   ├── challengeStore.ts
│   └── themeStore.ts
├── theme/
│   ├── tokens.ts              # Color/spacing tokens
│   └── themes.ts              # midnight | forest | ember
├── constants/
│   └── templates.ts           # Pre-built challenge templates
└── assets/
```

---

## Challenge templates (constants/templates.ts)

Each template pre-fills `title`, `category`, `duration_days`, and `tasks`.

```
TEMPLATES = [
  {
    id: '75hard',
    title: '75 Hard',
    category: 'fitness',
    duration_days: 75,
    tasks: [
      { label: '2 × 45-min workouts', type: 'checkbox' },
      { label: 'Drink 1 gallon of water', type: 'checkbox' },
      { label: 'Follow diet plan (no cheat meals)', type: 'checkbox' },
      { label: 'Read 10 pages non-fiction', type: 'checkbox' },
      { label: 'Progress photo', type: 'photo' },
      { label: 'Weight today (kg)', type: 'numeric', unit: 'kg' },
    ]
  },
  {
    id: '100code',
    title: '100 Days of Code',
    category: 'coding',
    duration_days: 100,
    tasks: [
      { label: 'Code for at least 1 hour', type: 'checkbox' },
      { label: 'What did you build/learn?', type: 'text_note' },
    ]
  },
  {
    id: 'language30',
    title: 'Learn a language — 30 days',
    category: 'language',
    duration_days: 30,
    tasks: [
      { label: 'Duolingo / lesson completed', type: 'checkbox' },
      { label: 'New words learned', type: 'numeric', unit: 'words' },
      { label: 'Practice notes', type: 'text_note' },
    ]
  },
  {
    id: 'reading30',
    title: 'Reading streak',
    category: 'academics',
    duration_days: 30,
    tasks: [
      { label: 'Pages read today', type: 'numeric', unit: 'pages' },
      { label: 'Key insight or takeaway', type: 'text_note' },
    ]
  },
]
```

---

## Themes (theme/themes.ts)

Three themes selectable from any screen's top bar. Each theme defines one accent color family.

```
midnight: { accent: '#7C6FCD', accentBg: '#EEEDFE', accentText: '#3C3489', accentBorder: '#AFA9EC' }
forest:   { accent: '#1D9E75', accentBg: '#E1F5EE', accentText: '#085041', accentBorder: '#5DCAA5' }
ember:    { accent: '#D85A30', accentBg: '#FAECE7', accentText: '#712B13', accentBorder: '#F0997B' }
```

Theme is stored in the user's Supabase profile row and persisted locally with AsyncStorage.

---

## Badge unlock logic (lib/badges.ts)

Check and award badges after every daily log save and after a challenge status changes.

| Badge key | Trigger |
|-----------|---------|
| `first_win` | First challenge with status = completed |
| `streak_7` | 7 consecutive days logged on any challenge |
| `streak_30` | 30 consecutive days logged |
| `days_100` | Any challenge completed with duration_days = 100 |
| `fitness_starter` | First challenge in category = fitness completed |
| `coding_starter` | First challenge in category = coding completed |
| `polyglot` | First challenge in category = language completed |

---

## AI progress summary (lib/ai.ts)

Called from the Stats screen. Sends the last 30 days of daily_logs for a challenge to the Anthropic API and returns a 3-sentence plain-English summary.

```
Model: claude-sonnet-4-6
Max tokens: 200
System prompt: "You are a supportive challenge coach. Given a user's challenge data, write a 2-3 sentence progress summary in second person. Be specific about numbers. Keep it motivating but honest. No markdown."
User message: JSON.stringify({ challenge, logs_last_30_days })
```

---

## Phase-wise build plan

### Phase 1 — Auth & shell (Week 1)
- Init Expo project with Expo Router
- Configure Supabase project, run schema migrations
- Build login + signup screens with Supabase Auth
- Persist session with AsyncStorage
- Build bottom tab navigation shell (5 tabs)
- Wire ThemeContext and load user theme preference

**Done when:** User can sign up, log in, stay logged in, and see the empty tab shell.

---

### Phase 2 — Challenge creation & templates (Week 1–2)
- Build `constants/templates.ts` with all 4 pre-built templates
- Build New Challenge screen: template picker → pre-fill form OR blank custom form
- Fields: title, category, duration, start date, task list (add/remove tasks)
- Save challenge + tasks to Supabase on submit
- Show active challenges list on Home screen (ChallengeCard component)

**Done when:** User can pick a template, customise it, save it, and see it on the home screen.

---

### Phase 3 — Daily logging (Week 2–3)
- Build Daily Log screen for the selected active challenge
- Render task list from `challenge_tasks` with correct input type per task:
  - `checkbox` → toggle row
  - `numeric` → number input + mini trend graph
  - `photo` → upload zone + thumbnail strip
  - `text_note` → multiline text input
- Wire photo/video upload to Supabase Storage bucket `progress-media`
- Save `daily_logs` row with `tasks_completed` jsonb on tap of "Save today's log"
- Prevent duplicate log for same date; load existing log if already saved today

**Done when:** User can log every task type, upload a photo, and save — and re-opening shows the saved state.

---

### Phase 4 — Progress & stats (Week 3–4)
- Build Stats screen
- Query all `daily_logs` for the selected challenge
- Compute: days done, completion %, streak, numeric metric trend (weight etc.)
- Render bar chart (weekly task completion %) using victory-native
- Render line/bar chart for numeric metrics over time
- Call Anthropic API (`lib/ai.ts`) for AI progress summary paragraph
- Show summary card below charts

**Done when:** Stats screen shows real charts and an AI-generated summary for any challenge.

---

### Phase 5 — Profile, history & rewards (Week 4–5)
- Build Profile screen
- Show user avatar (initials fallback), name, streak tag, completed count tag
- Query all challenges grouped by status (active / completed / failed)
- Show challenge history list with status icon, title, duration, category
- Query `user_badges` joined to `badges` — show earned vs locked grid
- Implement badge unlock logic in `lib/badges.ts`
- Trigger badge check after every log save and challenge status change
- Mark challenge as completed when `log_date = end_date` and all tasks done
- Mark challenge as failed when user triggers "Give up" or misses N consecutive days

**Done when:** Profile shows full history, earned badges unlock correctly, failed challenges show in red.

---

### Phase 6 — Theming, polish & deploy (Week 5–6)
- Build ThemeSwitcher component (3 swatches in topbar)
- Persist theme choice to Supabase `users.theme` column + AsyncStorage
- Add push notifications via Expo Notifications — daily reminder at user-set time
- Add empty states for all screens (no challenges, no logs yet, no badges)
- Add error handling for all Supabase calls and API calls
- Test on iOS simulator, Android emulator, and web (Expo Web)
- Build and deploy with EAS Build for iOS + Android
- Deploy web version via Expo Web + Vercel

**Done when:** App runs on all 3 platforms, themes switch correctly, notifications fire, and the build is on TestFlight / Play Store internal track.

---

## Key Supabase RLS policies (Row Level Security)

Every table must have RLS enabled. Core rule for all tables:

```sql
-- Users can only read/write their own rows
CREATE POLICY "own rows only" ON challenges
  FOR ALL USING (auth.uid() = user_id);
```

Apply the same pattern to `daily_logs`, `media_uploads`, `user_badges`.

Supabase Storage bucket `progress-media`: private bucket, access via signed URLs generated server-side.

---

## Environment variables (.env)

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_key  # server-side only, never expose to client
```

Note: The Anthropic API key must never be bundled into the client app. Call it from a Supabase Edge Function or a small backend proxy.

---

## Notes for the AI coding agent (Antigravity)

- Always use Expo Router file-based routing. No react-navigation manual config.
- Use Zustand for all shared state (auth session, active challenge, theme).
- Every Supabase query must handle loading, error, and empty states.
- All screens must be functional on iOS, Android, and web from the same codebase.
- Use `expo-image-picker` for photo/video selection and upload.
- Charts: use `victory-native` — import from `victory-native`, not `victory`.
- Theming: inject the active theme object via React context, consume with `useTheme()` hook.
- Media upload: upload to Supabase Storage, store the `storage_path` in `media_uploads`, generate a signed URL when displaying.
- Keep the Anthropic API call in a Supabase Edge Function (`/functions/v1/progress-summary`) — accept `{ challenge_id, user_id }`, fetch logs server-side, call the API, return the summary string.