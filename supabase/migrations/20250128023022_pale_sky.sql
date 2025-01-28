/*
  # Astrological System Tables

  1. New Tables
    - `birth_charts`
      - Stores user birth chart data
      - Includes sun sign, moon sign, and other astrological data
    - `moon_phases`
      - Tracks moon phases and their timing
    - `planetary_alignments`
      - Records daily planetary positions and aspects
      
  2. Security
    - Enables RLS on all tables
    - Adds appropriate access policies
*/

-- Create birth charts table
CREATE TABLE IF NOT EXISTS birth_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sun_sign text,
  moon_sign text,
  ascending_sign text,
  calculated_at timestamptz DEFAULT now(),
  raw_chart_data jsonb DEFAULT '{}'::jsonb,
  house_placements jsonb DEFAULT '{}'::jsonb,
  aspect_data jsonb DEFAULT '{}'::jsonb
);

-- Create moon phases table
CREATE TABLE IF NOT EXISTS moon_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_name text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  phase_type text NOT NULL CHECK (phase_type IN (
    'new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
    'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent'
  )),
  zodiac_sign text NOT NULL,
  degree decimal(5,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create planetary alignments table
CREATE TABLE IF NOT EXISTS planetary_alignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  planet_positions jsonb NOT NULL DEFAULT '{}'::jsonb,
  major_aspects jsonb DEFAULT '{}'::jsonb,
  retrograde_status jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE birth_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE moon_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE planetary_alignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own birth chart"
  ON birth_charts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own birth chart"
  ON birth_charts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own birth chart"
  ON birth_charts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view moon phases"
  ON moon_phases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view planetary alignments"
  ON planetary_alignments FOR SELECT
  TO authenticated
  USING (true);