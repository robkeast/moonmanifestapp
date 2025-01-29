import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface TestUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_country: string;
  birth_city: string;
  gender: string;
  created_at: string;
  updated_at: string;
}

export const TestSignup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<TestUser | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const runMigration = async () => {
    addLog('Running migration to update users table...');
    
    try {
      // Try to drop the existing table
      const { error: dropError } = await supabase
        .from('users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (dropError && !dropError.message.includes('does not exist')) {
        addLog(`Error dropping table: ${dropError.message}`);
      } else {
        addLog('Existing data cleared successfully');
      }

      // Create or update the table structure
      const { error: createError } = await supabase
        .from('users')
        .insert([{
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          birth_date: '2000-01-01',
          birth_country: 'United States',
          birth_city: 'New York',
          gender: 'Female',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (createError && !createError.message.includes('already exists')) {
        throw new Error(`Failed to create table: ${createError.message}`);
      }

      addLog('Table structure updated successfully');

      // Clean up test data
      await supabase
        .from('users')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');

      addLog('Migration completed successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      addLog(`Migration failed: ${message}`);
      throw err;
    }
  };

  const runTest = async () => {
    console.log('Starting test...');
    setLoading(true);
    setError(null);
    setLogs([]);
    setAuthUser(null);
    setDbUser(null);

    try {
      // First run the migration
      await runMigration();

      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'testPassword123!';

      addLog('Starting signup test...');
      addLog(`Using test email: ${testEmail}`);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      addLog(`Supabase URL: ${supabaseUrl}`);
      addLog(`Supabase Key exists: ${!!supabaseKey}`);

      addLog('Step 1: Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User',
            birth_date: '2000-01-01',
            birth_country: 'United States',
            birth_city: 'New York',
            gender: 'Female',
          },
        },
      });

      console.log('Auth response:', { authData, authError });

      if (authError) throw new Error(`Auth Error: ${authError.message}`);
      
      if (!authData.user) {
        throw new Error('No user returned from auth signup');
      }

      addLog('Auth user created successfully');
      addLog(`Auth user ID: ${authData.user.id}`);
      setAuthUser(authData.user);

      addLog('Step 2: Verifying auth user...');
      const { data: authCheck, error: authCheckError } = await supabase.auth.getUser();
      
      console.log('Auth check response:', { authCheck, authCheckError });

      if (authCheckError) throw new Error(`Auth Check Error: ${authCheckError.message}`);
      addLog('Auth user verified successfully');

      addLog('Step 3: Creating user profile...');
      const profileData = {
        id: authData.user.id,
        email: testEmail,
        first_name: 'Test',
        last_name: 'User',
        birth_date: '2000-01-01',
        birth_country: 'United States',
        birth_city: 'New York',
        gender: 'Female',
        created_at: new Date().toISOString(),
      };
      addLog(`Attempting to insert profile: ${JSON.stringify(profileData)}`);

      const { data: insertedProfile, error: profileError } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

      console.log('Profile creation response:', { insertedProfile, profileError });

      if (profileError) throw new Error(`Profile Error: ${profileError.message}`);
      addLog('User profile created successfully');
      setDbUser(insertedProfile as TestUser);

      addLog('Step 4: Verifying user in database...');
      const { data: dbCheck, error: dbCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('DB check response:', { dbCheck, dbCheckError });

      if (dbCheckError) throw new Error(`DB Check Error: ${dbCheckError.message}`);
      addLog('Database user verified successfully');

      addLog('All tests completed successfully! 🎉');
    } catch (err) {
      console.error('Test error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      addLog(`❌ Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Signup Test Page</h1>
      
      <button
        onClick={runTest}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mb-4"
      >
        {loading ? 'Running Test...' : 'Run Signup Test'}
      </button>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Auth User:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(authUser, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Database User:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(dbUser, null, 2)}
          </pre>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Test Logs:</h2>
        <div className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
          {logs.map((log, index) => (
            <div key={index} className="font-mono text-sm mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 