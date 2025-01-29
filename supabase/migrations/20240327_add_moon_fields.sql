-- Add moon sign and birth location fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS moon_sign TEXT,
ADD COLUMN IF NOT EXISTS birth_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS birth_longditude DECIMAL(11, 8); 