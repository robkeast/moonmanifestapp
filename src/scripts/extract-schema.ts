import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getTableSchema(tableName: string): Promise<string> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        'CREATE TABLE IF NOT EXISTS public.' || quote_ident(c.relname) || ' (' || 
        string_agg(
          quote_ident(a.attname) || ' ' || 
          pg_catalog.format_type(a.atttypid, a.atttypmod) || 
          CASE 
            WHEN a.attnotnull THEN ' NOT NULL'
            ELSE ''
          END ||
          CASE 
            WHEN a.atthasdef THEN ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid)
            ELSE ''
          END,
          E',\n    '
        ) || 
        CASE 
          WHEN c.relkind = 'r' THEN E',\n    ' || string_agg(
            'CONSTRAINT ' || quote_ident(con.conname) || ' ' || 
            pg_get_constraintdef(con.oid),
            E',\n    '
          )
          ELSE ''
        END ||
        ');' as schema_definition
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
      LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
      LEFT JOIN pg_catalog.pg_constraint con ON con.conrelid = c.oid
      WHERE n.nspname = 'public'
        AND c.relname = $1
        AND a.attnum > 0
        AND NOT a.attisdropped
      GROUP BY c.relname, c.relkind;
    `,
    params: [tableName]
  });

  if (error) {
    console.error(`Error getting schema for table ${tableName}:`, error);
    return '';
  }

  return data || '';
}

async function getTablePolicies(tableName: string): Promise<string> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        'ALTER TABLE public.' || quote_ident($1) || ' ENABLE ROW LEVEL SECURITY;' || E'\n' ||
        string_agg(
          'CREATE POLICY ' || quote_ident(polname) || ' ON public.' || quote_ident($1) || 
          ' FOR ' || polcmd || 
          CASE 
            WHEN polroles <> '{public}' THEN ' TO ' || array_to_string(polroles, ', ')
            ELSE ''
          END ||
          ' USING (' || pg_get_expr(polqual, polrelid) || ')' ||
          CASE 
            WHEN polwithcheck IS NOT NULL THEN ' WITH CHECK (' || pg_get_expr(polwithcheck, polrelid) || ')'
            ELSE ''
          END || ';',
          E'\n'
        ) as policies
      FROM pg_policy
      WHERE polrelid = ('public.' || $1)::regclass;
    `,
    params: [tableName]
  });

  if (error) {
    console.error(`Error getting policies for table ${tableName}:`, error);
    return '';
  }

  return data || '';
}

async function getTableTriggers(tableName: string): Promise<string> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        string_agg(
          'CREATE TRIGGER ' || quote_ident(t.tgname) ||
          ' ' || 
          CASE 
            WHEN t.tgtype & (1<<0) = (1<<0) THEN 'BEFORE'
            WHEN t.tgtype & (1<<1) = (1<<1) THEN 'AFTER'
            WHEN t.tgtype & (1<<6) = (1<<6) THEN 'INSTEAD OF'
          END ||
          ' ' ||
          array_to_string(array(
            SELECT unnest(array['INSERT', 'DELETE', 'UPDATE', 'TRUNCATE'])
            WHERE t.tgtype & (1<<1) = (1<<1)
          ), ' OR ') ||
          ' ON public.' || quote_ident($1) ||
          ' FOR EACH ' || 
          CASE 
            WHEN t.tgtype & (1<<4) = (1<<4) THEN 'ROW'
            ELSE 'STATEMENT'
          END ||
          ' EXECUTE FUNCTION ' || p.proname || '();',
          E'\n'
        ) as triggers
      FROM pg_trigger t
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE t.tgrelid = ('public.' || $1)::regclass
        AND NOT t.tgisinternal;
    `,
    params: [tableName]
  });

  if (error) {
    console.error(`Error getting triggers for table ${tableName}:`, error);
    return '';
  }

  return data || '';
}

async function getTableIndexes(tableName: string): Promise<string> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT string_agg(
        'CREATE INDEX IF NOT EXISTS ' || quote_ident(i.relname) || 
        ' ON public.' || quote_ident($1) || ' USING ' || am.amname || 
        ' (' || pg_get_indexdef(i.oid, 0, false) || ');',
        E'\n'
      ) as indexes
      FROM pg_index x
      JOIN pg_class i ON i.oid = x.indexrelid
      JOIN pg_class t ON t.oid = x.indrelid
      JOIN pg_am am ON i.relam = am.oid
      WHERE t.relname = $1
        AND t.relnamespace = 'public'::regnamespace
        AND NOT x.indisprimary
        AND NOT x.indisunique;
    `,
    params: [tableName]
  });

  if (error) {
    console.error(`Error getting indexes for table ${tableName}:`, error);
    return '';
  }

  return data || '';
}

async function getAllTables(): Promise<string[]> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `
  });

  if (error) {
    console.error('Error getting table list:', error);
    return [];
  }

  return data?.map((row: any) => row.tablename) || [];
}

async function extractSchema() {
  try {
    console.log('Extracting database schema...');
    let schema = '-- Database Schema Export\n\n';

    // Get all tables
    const tables = await getAllTables();
    console.log('Found tables:', tables);

    // Extract schema for each table
    for (const tableName of tables) {
      console.log(`Processing table: ${tableName}`);
      
      // Get table definition
      const tableSchema = await getTableSchema(tableName);
      if (tableSchema) {
        schema += `-- Table: ${tableName}\n${tableSchema}\n\n`;
      }

      // Get table policies
      const policies = await getTablePolicies(tableName);
      if (policies) {
        schema += `-- RLS Policies for ${tableName}\n${policies}\n\n`;
      }

      // Get table triggers
      const triggers = await getTableTriggers(tableName);
      if (triggers) {
        schema += `-- Triggers for ${tableName}\n${triggers}\n\n`;
      }

      // Get table indexes
      const indexes = await getTableIndexes(tableName);
      if (indexes) {
        schema += `-- Indexes for ${tableName}\n${indexes}\n\n`;
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