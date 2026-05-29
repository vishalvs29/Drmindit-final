-- Enable required extensions
create extension if not exists "uuid-ossp";

---------------------------------------------------
-- 1. USER SYSTEM
---------------------------------------------------

create table public.users (
  id uuid primary key default uuid_generate_v4(),
  clerk_id text unique not null,
  email text unique not null,
  full_name text,
  avatar_url text,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  emotional_goals text[],
  sleep_goals text[],
  focus_goals text[],
  stress_profile text,
  anonymous_mode boolean default false,
  reminder_preferences jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

---------------------------------------------------
-- 2. MOOD & WELLNESS
---------------------------------------------------

create table public.mood_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  mood_score integer check (mood_score >= 0 and mood_score <= 100) not null,
  emotions text[],
  stress_level integer check (stress_level >= 0 and stress_level <= 10),
  notes text,
  created_at timestamp with time zone default now()
);

create table public.emotional_insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  trends jsonb not null,
  ai_generated_insights text,
  weekly_analytics jsonb not null,
  created_at timestamp with time zone default now()
);

---------------------------------------------------
-- 3. SESSIONS SYSTEM
---------------------------------------------------

create table public.session_categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  slug text unique not null
);

create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  duration_seconds integer not null,
  thumbnail_url text,
  audio_url text not null,
  category_id uuid references public.session_categories(id) on delete set null,
  is_premium boolean default false,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  tags text[],
  created_at timestamp with time zone default now()
);

create table public.session_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete cascade not null,
  playback_position_seconds integer default 0,
  completion_percentage integer default 0 check (completion_percentage >= 0 and completion_percentage <= 100),
  is_completed boolean default false,
  updated_at timestamp with time zone default now(),
  unique(user_id, session_id)
);

create table public.favorites (
  user_id uuid references public.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, session_id)
);

create table public.recent_sessions (
  user_id uuid references public.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  last_played_at timestamp with time zone default now(),
  primary key (user_id, session_id)
);

---------------------------------------------------
-- 4. PROGRAMS SYSTEM
---------------------------------------------------

create table public.programs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  duration_days integer not null,
  emotional_goal text,
  thumbnail_url text,
  is_premium boolean default true,
  created_at timestamp with time zone default now()
);

create table public.program_days (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references public.programs(id) on delete cascade not null,
  day_number integer not null,
  title text not null,
  description text,
  unique(program_id, day_number)
);

create table public.program_tasks (
  id uuid primary key default uuid_generate_v4(),
  program_day_id uuid references public.program_days(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete set null,
  task_type text not null,
  title text not null
);

create table public.program_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete cascade not null,
  current_day integer default 1,
  completed_days integer[] default '{}',
  updated_at timestamp with time zone default now(),
  unique(user_id, program_id)
);

---------------------------------------------------
-- 5. AI CHAT SYSTEM
---------------------------------------------------

create table public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text,
  started_at timestamp with time zone default now(),
  last_message_at timestamp with time zone default now()
);

create table public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  chat_session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text check (role in ('user', 'assistant', 'system')) not null,
  content text not null,
  emotional_context jsonb,
  created_at timestamp with time zone default now()
);

create table public.ai_recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  recommended_session_id uuid references public.sessions(id) on delete cascade,
  reason text not null,
  created_at timestamp with time zone default now()
);

---------------------------------------------------
-- 6. ANALYTICS SYSTEM
---------------------------------------------------

create table public.user_analytics (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_meditation_minutes integer default 0,
  total_breathing_minutes integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  updated_at timestamp with time zone default now()
);

---------------------------------------------------
-- 7. SUBSCRIPTION SYSTEM
---------------------------------------------------

create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null,
  plan_tier text check (plan_tier in ('free', 'premium', 'organization')) default 'free',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

---------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
---------------------------------------------------

-- Utility to get current clerk user id from JWT
create or replace function auth.user_clerk_id() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ language sql stable;

-- We will map auth.user_clerk_id() to public.users(id) in actual policies
create or replace function public.current_user_id() returns uuid as $$
  select id from public.users where clerk_id = auth.user_clerk_id() limit 1;
$$ language sql stable security definer;

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.mood_entries enable row level security;
alter table public.emotional_insights enable row level security;
alter table public.session_categories enable row level security;
alter table public.sessions enable row level security;
alter table public.session_progress enable row level security;
alter table public.favorites enable row level security;
alter table public.recent_sessions enable row level security;
alter table public.programs enable row level security;
alter table public.program_days enable row level security;
alter table public.program_tasks enable row level security;
alter table public.program_progress enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.user_analytics enable row level security;
alter table public.subscriptions enable row level security;

-- USERS: Users can read and update their own profile. Only service role can insert (via webhook).
create policy "Users can view own profile" on public.users for select using (id = public.current_user_id());
create policy "Users can update own profile" on public.users for update using (id = public.current_user_id());

-- USER PREFERENCES
create policy "Users can view own preferences" on public.user_preferences for select using (user_id = public.current_user_id());
create policy "Users can update own preferences" on public.user_preferences for update using (user_id = public.current_user_id());
create policy "Users can insert own preferences" on public.user_preferences for insert with check (user_id = public.current_user_id());

-- MOOD ENTRIES
create policy "Users can manage own mood entries" on public.mood_entries for all using (user_id = public.current_user_id());
create policy "Users can insert own mood entries" on public.mood_entries for insert with check (user_id = public.current_user_id());

-- EMOTIONAL INSIGHTS
create policy "Users can view own insights" on public.emotional_insights for select using (user_id = public.current_user_id());

-- SESSIONS (Public read for all authenticated users)
create policy "Anyone can view categories" on public.session_categories for select to authenticated using (true);
create policy "Anyone can view sessions" on public.sessions for select to authenticated using (true);

-- SESSION PROGRESS, FAVORITES, RECENT
create policy "Users can manage own session progress" on public.session_progress for all using (user_id = public.current_user_id());
create policy "Users can manage own favorites" on public.favorites for all using (user_id = public.current_user_id());
create policy "Users can manage own recent sessions" on public.recent_sessions for all using (user_id = public.current_user_id());
create policy "Users can insert own session progress" on public.session_progress for insert with check (user_id = public.current_user_id());
create policy "Users can insert own favorites" on public.favorites for insert with check (user_id = public.current_user_id());
create policy "Users can insert own recent sessions" on public.recent_sessions for insert with check (user_id = public.current_user_id());

-- PROGRAMS (Public read for all authenticated users)
create policy "Anyone can view programs" on public.programs for select to authenticated using (true);
create policy "Anyone can view program days" on public.program_days for select to authenticated using (true);
create policy "Anyone can view program tasks" on public.program_tasks for select to authenticated using (true);

-- PROGRAM PROGRESS
create policy "Users can manage own program progress" on public.program_progress for all using (user_id = public.current_user_id());
create policy "Users can insert own program progress" on public.program_progress for insert with check (user_id = public.current_user_id());

-- CHAT SESSIONS & MESSAGES
create policy "Users can manage own chat sessions" on public.chat_sessions for all using (user_id = public.current_user_id());
create policy "Users can insert own chat sessions" on public.chat_sessions for insert with check (user_id = public.current_user_id());
-- Note: chat_messages relies on the parent chat_session for RLS, but we explicitly enforce it via a join in a real complex policy. 
-- For simplicity, we assume messages are inserted by the server using service_role, and read via API. 
-- If direct Supabase client read is needed:
create policy "Users can view own messages" on public.chat_messages for select using (
  chat_session_id in (select id from public.chat_sessions where user_id = public.current_user_id())
);

-- AI RECOMMENDATIONS
create policy "Users can view own recommendations" on public.ai_recommendations for select using (user_id = public.current_user_id());

-- ANALYTICS
create policy "Users can view own analytics" on public.user_analytics for select using (user_id = public.current_user_id());

-- SUBSCRIPTIONS
create policy "Users can view own subscription" on public.subscriptions for select using (user_id = public.current_user_id());

---------------------------------------------------
-- SEED DATA
---------------------------------------------------

insert into public.session_categories (name, description, slug) values
  ('Brain-Heart Coherence', 'Breath-led sessions for nervous system regulation.', 'brain-heart-coherence'),
  ('Meditation', 'Guided awareness practices for emotional steadiness.', 'meditation'),
  ('Pranayama', 'Breathwork rooted in yogic regulation practices.', 'pranayama'),
  ('Breathing Exercises', 'Short breathing resets for daily stress support.', 'breathing-exercises'),
  ('Sleep Recovery', 'Wind-down sessions for deeper rest.', 'sleep-recovery'),
  ('Focus Improvement', 'Attention training for calm productivity.', 'focus-improvement')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.sessions (
  title,
  description,
  duration_seconds,
  audio_url,
  category_id,
  is_premium,
  difficulty,
  tags
)
select
  seed.title,
  seed.description,
  seed.duration_seconds,
  seed.audio_url,
  category.id,
  seed.is_premium,
  seed.difficulty,
  seed.tags
from (
  values
    ('Deep Blue Breathing', 'A gentle downshift for a busy nervous system.', 720, 'deep-blue-breathing.mp3', 'breathing-exercises', false, 'beginner', array['breath', 'stress', 'reset']),
    ('Heart Coherence Reset', 'Slow rhythm breathing for emotional balance.', 900, 'heart-coherence-reset.mp3', 'brain-heart-coherence', false, 'beginner', array['coherence', 'calm']),
    ('Sleep Recovery Descent', 'A soft landing into slower sleep rhythms.', 1800, 'sleep-recovery-descent.mp3', 'sleep-recovery', true, 'beginner', array['sleep', 'recovery']),
    ('Focused Morning Clarity', 'A concise attention practice for steady work.', 600, 'focused-morning-clarity.mp3', 'focus-improvement', false, 'beginner', array['focus', 'morning']),
    ('Quiet Lake Meditation', 'A spacious meditation for emotional settling.', 1200, 'quiet-lake-meditation.mp3', 'meditation', false, 'beginner', array['meditation', 'grounding']),
    ('Balanced Pranayama', 'A measured breath practice for centered energy.', 840, 'balanced-pranayama.mp3', 'pranayama', true, 'intermediate', array['pranayama', 'breath'])
) as seed(title, description, duration_seconds, audio_url, category_slug, is_premium, difficulty, tags)
join public.session_categories category on category.slug = seed.category_slug
where not exists (
  select 1 from public.sessions existing where existing.title = seed.title
);

insert into public.programs (title, description, duration_days, emotional_goal, is_premium)
values
  ('7-Day Nervous System Reset', 'A focused sequence of breath, coherence, and rest practices.', 7, 'Reduce daily stress load', false),
  ('Sleep Recovery Path', 'A gentle program for rebuilding a calmer night routine.', 14, 'Improve sleep consistency', true),
  ('Calm Focus Training', 'Short daily sessions that pair attention and emotional regulation.', 10, 'Strengthen focused calm', true)
on conflict do nothing;
