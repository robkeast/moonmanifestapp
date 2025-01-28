/*
  # Initial Schema Setup - Users and Preferences

  1. New Tables
    - `users`
      - Core user information including authentication and profile data
      - Uses UUID for primary key
      - Includes essential user details and status tracking
    - `user_preferences`
      - Stores user-specific settings and preferences
      - Uses JSONB for flexible preference storage
      
  2. Security
    - Enables RLS on both tables
    - Adds policies for authenticated users to access their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text NOT NULL,
  first_name text,
  last_name text,
  birth_date date NOT NULL,
  birth_time time,
  birth_location text,
  gender text,
  timezone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified boolean DEFAULT false,
  profile_complete boolean DEFAULT false,
  CONSTRAINT users_email_key UNIQUE (email)
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_preferences jsonb DEFAULT '{}'::jsonb,
  practice_preferences jsonb DEFAULT '{}'::jsonb,
  theme_preferences jsonb DEFAULT '{}'::jsonb,
  privacy_settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();