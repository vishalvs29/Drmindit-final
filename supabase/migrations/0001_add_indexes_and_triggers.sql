-- Enable moddatetime extension
create extension if not exists "moddatetime" with schema "extensions";

-- Set search path for trigger functions
set search_path = extensions, public;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.users
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on public.user_preferences
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on public.session_progress
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on public.program_progress
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on public.user_analytics
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on public.subscriptions
  for each row execute procedure moddatetime(updated_at);

-- Add indexes on foreign keys
create index if not exists user_preferences_user_id_idx on public.user_preferences(user_id);
create index if not exists mood_entries_user_id_idx on public.mood_entries(user_id);
create index if not exists emotional_insights_user_id_idx on public.emotional_insights(user_id);
create index if not exists sessions_category_id_idx on public.sessions(category_id);
create index if not exists session_progress_user_id_idx on public.session_progress(user_id);
create index if not exists session_progress_session_id_idx on public.session_progress(session_id);
create index if not exists program_days_program_id_idx on public.program_days(program_id);
create index if not exists program_tasks_program_day_id_idx on public.program_tasks(program_day_id);
create index if not exists program_tasks_session_id_idx on public.program_tasks(session_id);
create index if not exists program_progress_user_id_idx on public.program_progress(user_id);
create index if not exists program_progress_program_id_idx on public.program_progress(program_id);
create index if not exists chat_sessions_user_id_idx on public.chat_sessions(user_id);
create index if not exists chat_messages_chat_session_id_idx on public.chat_messages(chat_session_id);
create index if not exists ai_recommendations_user_id_idx on public.ai_recommendations(user_id);
create index if not exists ai_recommendations_recommended_session_id_idx on public.ai_recommendations(recommended_session_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- Note: favorites and recent_sessions already have primary keys spanning (user_id, session_id), 
-- which implicitly indexes user_id. We add indexes for session_id explicitly.
create index if not exists favorites_session_id_idx on public.favorites(session_id);
create index if not exists recent_sessions_session_id_idx on public.recent_sessions(session_id);

-- Fix RLS policies to enforce 'with check' for updates
drop policy if exists "Users can manage own session progress" on public.session_progress;
create policy "Users can manage own session progress" on public.session_progress
  for all using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());

drop policy if exists "Users can manage own favorites" on public.favorites;
create policy "Users can manage own favorites" on public.favorites
  for all using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());

drop policy if exists "Users can manage own recent sessions" on public.recent_sessions;
create policy "Users can manage own recent sessions" on public.recent_sessions
  for all using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());

-- Add missing UPDATE policy for user_preferences
drop policy if exists "Users can update own preferences" on public.user_preferences;
create policy "Users can update own preferences" on public.user_preferences
  for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());

-- chat_messages insert/update is handled via server (service_role) only, 
-- so no client INSERT/UPDATE policies are needed here.
