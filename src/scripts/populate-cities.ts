import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CityData {
  name: string;
  country: string;
  state: string;
  population: number;
  latitude: number;
  longitude: number;
}

// GeoNames TSV format:
// 0: geonameid
// 1: name
// 2: asciiname
// 3: alternatenames
// 4: latitude
// 5: longitude
// 6: feature class
// 7: feature code
// 8: country code
// 9: cc2
// 10: admin1 code
// 11: admin2 code
// 12: admin3 code
// 13: population
// 14: elevation
// 15: timezone

const COUNTRY_CODES: { [key: string]: string } = {
  'AE': 'United Arab Emirates',
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'IN': 'India',
  'JP': 'Japan',
  'DE': 'Germany',
  'FR': 'France',
  // Add more country codes as needed
};

async function createCitiesTable() {
  const { error } = await supabase.from('cities').select('count(*)', { count: 'exact', head: true });
  
  // If table exists, return
  if (!error) return;

  // Create the table
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
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

      -- Enable Row Level Security (RLS)
      ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

      -- Create policy for reading cities (allow all authenticated users to read)
      CREATE POLICY "Enable read access for all users" ON public.cities
          FOR SELECT
          USING (true);

      -- Grant necessary permissions
      GRANT USAGE ON SCHEMA public TO anon, authenticated;
      GRANT SELECT ON public.cities TO anon, authenticated;
    `
  });

  if (createError) {
    console.error('Error creating cities table:', createError);
    process.exit(1);
  }
}

async function processCitiesFile(filePath: string, batchSize = 1000): Promise<CityData[]> {
  const cities: CityData[] = [];
  let batch: CityData[] = [];
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const fields = line.split('\t');
    // Only process if it's a populated place (P in feature class) and has population data
    if (fields[6] === 'P' && fields[13] && parseInt(fields[13]) > 0) {
      const countryCode = fields[8];
      const countryName = COUNTRY_CODES[countryCode];
      
      // Skip if country is not in our supported list
      if (!countryName) continue;

      const cityData: CityData = {
        name: fields[2] || fields[1], // Use ASCII name if available, otherwise use name
        country: countryName,
        state: fields[10] || '', // Admin1 code
        population: parseInt(fields[13]),
        latitude: parseFloat(fields[4]),
        longitude: parseFloat(fields[5])
      };
      
      batch.push(cityData);
      
      if (batch.length >= batchSize) {
        cities.push(...batch);
        batch = [];
        console.log(`Processed ${cities.length} cities...`);
      }
    }
  }
  
  if (batch.length > 0) {
    cities.push(...batch);
    console.log(`Processed ${cities.length} cities total`);
  }
  
  return cities;
}

async function insertCities(cities: CityData[]) {
  const batchSize = 1000;
  const totalBatches = Math.ceil(cities.length / batchSize);
  
  console.log(`Inserting ${cities.length} cities in ${totalBatches} batches...`);
  
  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize);
    const { error } = await supabase.from('cities').insert(batch);
    
    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
    } else {
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${totalBatches}`);
    }
  }
}

async function main() {
  try {
    console.log('Starting cities import...');

    // Create cities table if it doesn't exist
    console.log('Creating cities table...');
    await createCitiesTable();
    
    // Clear existing data
    const { error: deleteError } = await supabase
      .from('cities')
      .delete()
      .neq('id', 0);
    
    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      return;
    }
    
    console.log('Existing data cleared');
    
    // Process and insert cities
    const citiesFilePath = path.join(__dirname, '../data/cities500.txt');
    const cities = await processCitiesFile(citiesFilePath);
    await insertCities(cities);
    
    console.log('Cities import completed successfully');
  } catch (error) {
    console.error('Error importing cities:', error);
  }
}

main(); 