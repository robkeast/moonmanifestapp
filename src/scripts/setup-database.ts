import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExecSqlFunction() {
  const { error: testError } = await supabase.from('_sql').select('*').limit(1);
  
  if (testError) {
    console.error('Error accessing database:', testError);
    return false;
  }

  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
  `;

  const { error: funcError } = await supabase.from('_sql').insert([{
    query: createFunctionSQL
  }]);

  if (funcError) {
    console.error('Error creating exec_sql function:', funcError);
    return false;
  }

  return true;
}

async function main() {
  try {
    console.log('Setting up database...');

    // Create exec_sql function
    console.log('Creating exec_sql function...');
    const success = await createExecSqlFunction();
    if (!success) {
      console.error('Failed to create exec_sql function');
      return;
    }

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../supabase/migrations/20240130_create_cities_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());

    // Execute each statement
    for (const statement of statements) {
      if (!statement.trim()) continue;

      const { error } = await supabase.rpc('exec_sql', {
        sql: statement.trim()
      });

      if (error) {
        console.error('Error executing SQL:', error);
        return;
      }
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

main(); 