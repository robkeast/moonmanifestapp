/*
  # Manifestation System Tables

  1. New Tables
    - `manifestation_goals`
      - Stores user goals and intentions
    - `manifestation_practices`
      - Defines available manifestation practices
    - `practice_schedules`
      - Manages user practice schedules
    - `practice_completions`
      - Tracks completed practices
      
  2. Security
    - Enables RLS on all tables
    - Adds policies for user-specific data access
*/

-- Create manifestation goals table
CREATE TABLE IF NOT EXISTS manifestation_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('abundance', 'relationships', 'health', 'career', 'spiritual', 'other')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  priority int CHECK (priority BETWEEN 1 AND 5),
  target_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  success_criteria text,
  aligned_moon_phases jsonb DEFAULT '{}'::jsonb
);

-- Create manifestation practices table
CREATE TABLE IF NOT EXISTS manifestation_practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('visualization', 'affirmation', 'scripting', 'ritual', 'meditation', 'gratitude')),
  difficulty_level text NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes int CHECK (duration_minutes > 0),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'moon_phase', 'custom')),
  instructions text NOT NULL,
  required_materials text,
  benefits text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create practice schedules table
CREATE TABLE IF NOT EXISTS practice_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice_id uuid NOT NULL REFERENCES manifestation_practices(id) ON DELETE CASCADE,
  scheduled_time time,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'moon_phase', 'custom')),
  custom_frequency jsonb DEFAULT '{}'::jsonb,
  reminder_enabled boolean DEFAULT true,
  reminder_advance_minutes int DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create practice completions table
CREATE TABLE IF NOT EXISTS practice_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice_id uuid NOT NULL REFERENCES manifestation_practices(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  duration_minutes int CHECK (duration_minutes > 0),
  effectiveness_rating int CHECK (effectiveness_rating BETWEEN 1 AND 10),
  notes text,
  moon_phase text,
  astrological_aspects jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE manifestation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifestation_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own goals"
  ON manifestation_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view practices"
  ON manifestation_practices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own schedules"
  ON practice_schedules FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own completions"
  ON practice_completions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON manifestation_goals
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON manifestation_practices
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON practice_schedules
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();