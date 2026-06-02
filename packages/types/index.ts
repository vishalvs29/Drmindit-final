export type SessionCategorySlug =
  | 'brain-heart-coherence'
  | 'meditation'
  | 'pranayama'
  | 'breathing-exercises'
  | 'sleep-recovery'
  | 'focus-improvement';

export type SessionCategory = {
  id?: string;
  name: string;
  slug: SessionCategorySlug | string;
  description?: string | null;
};

export type WellnessSession = {
  id: string;
  title: string;
  description?: string | null;
  duration_seconds: number;
  thumbnail_url?: string | null;
  audio_url: string;
  is_premium: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  tags?: string[] | null;
  category?: SessionCategory | null;
};

export type UserAnalytics = {
  total_meditation_minutes: number;
  total_breathing_minutes: number;
  current_streak: number;
  longest_streak?: number;
  updated_at?: string;
};

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id?: string;
  role: ChatRole;
  content: string;
  created_at?: string;
};

export type Program = {
  id: string;
  title: string;
  description?: string | null;
  duration_days: number;
  emotional_goal?: string | null;
  thumbnail_url?: string | null;
  is_premium: boolean;
};

export type ApiResponse<T> = {
  data: T;
};

export type ProgramTask = {
  id: string;
  program_day_id: string;
  session_id?: string | null;
  task_type: string;
  title: string;
  session?: WellnessSession | null;
};

export type ProgramDay = {
  id: string;
  program_id: string;
  day_number: number;
  title: string;
  description?: string | null;
  program_tasks?: ProgramTask[];
};

export type ProgramDetail = Program & {
  program_days?: ProgramDay[];
};

export type ProgramProgress = {
  id: string;
  program_id: string;
  current_day: number;
  completed_days: number[];
  updated_at?: string;
};

export type MoodEntry = {
  id: string;
  mood_score: number;
  emotions: string[];
  stress_level?: number | null;
  notes?: string | null;
  created_at: string;
};

