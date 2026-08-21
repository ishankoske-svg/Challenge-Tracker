-- Challengr Supabase Postgres Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Profile Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'midnight',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Challenges Table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fitness', 'coding', 'academics', 'language', 'mindset', 'custom')),
  description TEXT,
  duration_days INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),
  template_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Challenge Tasks Table
CREATE TABLE IF NOT EXISTS public.challenge_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checkbox', 'numeric', 'photo', 'text_note')),
  unit TEXT,
  sort_order INT DEFAULT 0
);

-- 4. Daily Logs Table
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  tasks_completed JSONB DEFAULT '{}'::jsonb NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_challenge_log_date UNIQUE (challenge_id, user_id, log_date)
);

-- 5. Media Uploads Table
CREATE TABLE IF NOT EXISTS public.media_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- Seed Default Badges
INSERT INTO public.badges (key, name, description, icon) VALUES
  ('first_win', 'First Win', 'Completed your first challenge', 'Trophy'),
  ('streak_7', '7-Day Streak', 'Logged progress for 7 consecutive days', 'Flame'),
  ('streak_30', 'Iron Will (30-Day)', 'Logged progress for 30 consecutive days', 'Zap'),
  ('days_100', 'Century Club', 'Completed a 100-day challenge', 'Crown'),
  ('fitness_starter', 'Fitness Starter', 'Completed a fitness challenge', 'Activity'),
  ('coding_starter', 'Code Runner', 'Completed a coding challenge', 'Code'),
  ('polyglot', 'Polyglot', 'Completed a language challenge', 'Globe')
ON CONFLICT (key) DO NOTHING;

-- 7. User Badges Table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users Policy
CREATE POLICY "Users can manage own profile" ON public.users FOR ALL USING (auth.uid() = id);

-- Challenges Policy
CREATE POLICY "Users can manage own challenges" ON public.challenges FOR ALL USING (auth.uid() = user_id);

-- Tasks Policy
CREATE POLICY "Users can access tasks of own challenges" ON public.challenge_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.challenges WHERE challenges.id = challenge_tasks.challenge_id AND challenges.user_id = auth.uid()));

-- Daily Logs Policy
CREATE POLICY "Users can manage own daily logs" ON public.daily_logs FOR ALL USING (auth.uid() = user_id);

-- Media Policy
CREATE POLICY "Users can manage own media" ON public.media_uploads FOR ALL USING (auth.uid() = user_id);

-- Badges Policy
CREATE POLICY "Anyone can read badges" ON public.badges FOR SELECT USING (true);

-- User Badges Policy
CREATE POLICY "Users can manage own badges" ON public.user_badges FOR ALL USING (auth.uid() = user_id);

-- 8. Pods Table
CREATE TABLE IF NOT EXISTS public.pods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  challenge_template_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Pod Members Table
CREATE TABLE IF NOT EXISTS public.pod_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_pod_user UNIQUE (pod_id, user_id)
);

-- 10. Community Templates Table
CREATE TABLE IF NOT EXISTS public.community_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  tasks_json JSONB NOT NULL,
  fork_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Template Likes Table
CREATE TABLE IF NOT EXISTS public.template_likes (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.community_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, template_id)
);

-- Phase 6 RLS Policies
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community templates" ON public.community_templates FOR SELECT USING (true);
CREATE POLICY "Users can manage own templates" ON public.community_templates FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Anyone can read template likes" ON public.template_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON public.template_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view pods they are in" ON public.pods FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.pod_members WHERE pod_members.pod_id = pods.id AND pod_members.user_id = auth.uid()));
CREATE POLICY "Users can create pods" ON public.pods FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view pod members if they are in the pod" ON public.pod_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pod_members pm WHERE pm.pod_id = pod_members.pod_id AND pm.user_id = auth.uid()));
CREATE POLICY "Users can manage own pod membership" ON public.pod_members FOR ALL USING (auth.uid() = user_id);

