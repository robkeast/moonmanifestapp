/*
  # Progress Tracking and Journal System Tables

  1. New Tables
    - `user_progress`
      - Tracks user levels and achievements
    - `achievements`
      - Defines available achievements
    - `user_achievements`
      - Links users to their earned achievements
    - `level_definitions`
      - Defines level requirements and benefits
    - `journal_entries`
      - Stores user journal entries
      
  2. Security
    - Enables RLS on all tables
    - Adds appropriate access policies
*/

-- Create user progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_level int DEFAULT 1,
  total_xp int DEFAULT 0,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  practices_completed int DEFAULT 0,
  goals_achieved int DEFAULT 0,
  last_practice_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('practice', 'manifestation', 'streak', 'community')),
  requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  xp_reward int DEFAULT 0,
  badge_image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  progress jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_id)
);

-- Create level definitions table
CREATE TABLE IF NOT EXISTS level_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number int UNIQUE NOT NULL CHECK (level_number > 0),
  required_xp int NOT NULL CHECK (required_xp >= 0),
  title text NOT NULL,
  benefits jsonb DEFAULT '{}'::jsonb,
  badge_image_url text
);

-- Create journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('manifestation', 'gratitude', 'reflection', 'breakthrough')),
  content text NOT NULL,
  mood_rating int CHECK (mood_rating BETWEEN 1 AND 10),
  energy_level int CHECK (energy_level BETWEEN 1 AND 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  associated_goals jsonb DEFAULT '{}'::jsonb,
  moon_phase text,
  astrological_aspects jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own progress"
  ON user_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own achievement records"
  ON user_achievements FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view level definitions"
  ON level_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own journal entries"
  ON journal_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();