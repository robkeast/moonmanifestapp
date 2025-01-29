import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  // If we get a "relation does not exist" error, the table doesn't exist
  if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
    return false;
  }
  
  // If we get any other error (like permissions) or data, the table exists
  return true;
}

async function extractSchema() {
  try {
    console.log('Extracting database schema...');
    let schema = '-- Database Schema Export\n\n';

    // List of tables to check for
    const tablesToCheck = [
      'users',
      'moon_phases',
      'moon_manifestations',
      'user_manifestations',
      'manifestation_categories',
      'user_preferences',
      'notifications'
    ];

    console.log('Checking for tables:', tablesToCheck);

    // Check each table
    for (const tableName of tablesToCheck) {
      const exists = await checkTableExists(tableName);
      console.log(`Table ${tableName}: ${exists ? 'exists' : 'does not exist'}`);
      
      if (exists) {
        // Add table definition based on table name
        switch (tableName) {
          case 'users':
            schema += '-- Table: users\n';
            schema += 'CREATE TABLE IF NOT EXISTS public.users (\n';
            schema += '    id UUID PRIMARY KEY REFERENCES auth.users(id),\n';
            schema += '    email TEXT NOT NULL,\n';
            schema += '    first_name TEXT,\n';
            schema += '    last_name TEXT,\n';
            schema += '    birth_date DATE,\n';
            schema += '    postcode TEXT,\n';
            schema += '    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL,\n';
            schema += '    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL\n';
            schema += ');\n\n';

            // Add RLS policies for users table
            schema += '-- RLS Policies for users table\n';
            schema += 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;\n\n';
            
            schema += 'CREATE POLICY "Users can view their own profile"\n';
            schema += '    ON public.users\n';
            schema += '    FOR SELECT\n';
            schema += '    USING (auth.uid() = id);\n\n';
            
            schema += 'CREATE POLICY "Users can update their own profile"\n';
            schema += '    ON public.users\n';
            schema += '    FOR UPDATE\n';
            schema += '    USING (auth.uid() = id);\n\n';
            
            schema += 'CREATE POLICY "Users can insert their own profile"\n';
            schema += '    ON public.users\n';
            schema += '    FOR INSERT\n';
            schema += '    WITH CHECK (auth.uid() = id);\n\n';
            
            schema += 'CREATE POLICY "Enable read access for all users"\n';
            schema += '    ON public.users\n';
            schema += '    FOR SELECT\n';
            schema += '    USING (true);\n\n';
            break;

          case 'moon_phases':
            schema += '-- Table: moon_phases\n';
            schema += 'CREATE TABLE IF NOT EXISTS public.moon_phases (\n';
            schema += '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n';
            schema += '    phase_name TEXT NOT NULL,\n';
            schema += '    phase_date TIMESTAMP WITH TIME ZONE NOT NULL,\n';
            schema += '    phase_type TEXT NOT NULL,\n';
            schema += '    description TEXT,\n';
            schema += '    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL,\n';
            schema += '    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL\n';
            schema += ');\n\n';
            break;

          case 'moon_manifestations':
            schema += '-- Table: moon_manifestations\n';
            schema += 'CREATE TABLE IF NOT EXISTS public.moon_manifestations (\n';
            schema += '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n';
            schema += '    moon_phase_id UUID REFERENCES public.moon_phases(id),\n';
            schema += '    title TEXT NOT NULL,\n';
            schema += '    description TEXT,\n';
            schema += '    category_id UUID REFERENCES public.manifestation_categories(id),\n';
            schema += '    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL,\n';
            schema += '    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL\n';
            schema += ');\n\n';
            break;

          case 'user_manifestations':
            schema += '-- Table: user_manifestations\n';
            schema += 'CREATE TABLE IF NOT EXISTS public.user_manifestations (\n';
            schema += '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n';
            schema += '    user_id UUID REFERENCES public.users(id),\n';
            schema += '    manifestation_id UUID REFERENCES public.moon_manifestations(id),\n';
            schema += '    status TEXT NOT NULL,\n';
            schema += '    notes TEXT,\n';
            schema += '    completion_date TIMESTAMP WITH TIME ZONE,\n';
            schema += '    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL,\n';
            schema += '    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL\n';
            schema += ');\n\n';
            break;

          case 'manifestation_categories':
            schema += '-- Table: manifestation_categories\n';
            schema += 'CREATE TABLE IF NOT EXISTS public.manifestation_categories (\n';
            schema += '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n';
            schema += '    name TEXT NOT NULL,\n';
            schema += '    description TEXT,\n';
            schema += '    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL,\n';
            schema += '    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL\n';
            schema += ');\n\n';
            break;

          case 'user_preferences':
            schema += '-- Table: user_preferences\n';
            schema += 'CREATE TABLE IF NOT EXISTS public.user_preferences (\n';
            schema += '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n';
            schema += '    user_id UUID REFERENCES public.users(id),\n';
            schema += '    notification_enabled BOOLEAN DEFAULT true,\n';
            schema += '    notification_frequency TEXT DEFAULT \'daily\',\n';
            schema += '    theme TEXT DEFAULT \'light\',\n';
            schema += '    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL,\n';
            schema += '    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL\n';
            schema += ');\n\n';
            break;

          case 'notifications':
            schema += '-- Table: notifications\n';
            schema += 'CREATE TABLE IF NOT EXISTS public.notifications (\n';
            schema += '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n';
            schema += '    user_id UUID REFERENCES public.users(id),\n';
            schema += '    title TEXT NOT NULL,\n';
            schema += '    message TEXT NOT NULL,\n';
            schema += '    type TEXT NOT NULL,\n';
            schema += '    read BOOLEAN DEFAULT false,\n';
            schema += '    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL,\n';
            schema += '    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL\n';
            schema += ');\n\n';
            break;
        }
      }
    }

    // Add trigger for updating updated_at timestamp (applies to all tables)
    schema += '-- Function to automatically set updated_at timestamp\n';
    schema += 'CREATE OR REPLACE FUNCTION public.set_updated_at()\n';
    schema += 'RETURNS TRIGGER AS $$\n';
    schema += 'BEGIN\n';
    schema += '    NEW.updated_at = TIMEZONE(\'utc\'::text, NOW());\n';
    schema += '    RETURN NEW;\n';
    schema += 'END;\n';
    schema += '$$ language \'plpgsql\';\n\n';

    // Add triggers for each table that exists
    for (const tableName of tablesToCheck) {
      const exists = await checkTableExists(tableName);
      if (exists) {
        schema += `-- Trigger to automatically set updated_at timestamp for ${tableName}\n`;
        schema += `CREATE TRIGGER set_${tableName}_updated_at\n`;
        schema += `    BEFORE UPDATE ON public.${tableName}\n`;
        schema += '    FOR EACH ROW\n';
        schema += '    EXECUTE FUNCTION public.set_updated_at();\n\n';
      }
    }

    // Write to file
    fs.writeFileSync('schema.sql', schema);
    console.log('Schema exported to schema.sql');

  } catch (error) {
    console.error('Error extracting schema:', error);
  }
}

extractSchema(); 