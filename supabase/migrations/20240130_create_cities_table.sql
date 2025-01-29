-- Create the cities table
CREATE TABLE IF NOT EXISTS public.cities (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    state TEXT,
    population INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_cities_country ON public.cities(country);
CREATE INDEX IF NOT EXISTS idx_cities_name_country ON public.cities(name, country);
CREATE INDEX IF NOT EXISTS idx_cities_population ON public.cities(population DESC);

-- Add text search capabilities
CREATE INDEX IF NOT EXISTS idx_cities_name_trgm ON public.cities USING gin (name gin_trgm_ops);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Create policy for reading cities (allow all authenticated users to read)
CREATE POLICY "Enable read access for all users" ON public.cities
    FOR SELECT
    USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_cities_updated_at
    BEFORE UPDATE ON public.cities
    FOR EACH ROW
    EXECUTE FUNCTION public.set_cities_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.cities TO anon, authenticated; 