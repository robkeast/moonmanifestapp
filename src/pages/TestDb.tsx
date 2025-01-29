import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const TestDb: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<any>(null);

  useEffect(() => {
    async function checkDatabase() {
      try {
        console.log('Checking database setup...');

        // First, check if we can query the users table
        const { data: tableData, error: tableError } = await supabase
          .from('users')
          .select('*')
          .limit(0);

        console.log('Table check response:', { tableData, tableError });

        if (tableError) {
          // If there's an error, try to get more information about it
          console.error('Table error details:', {
            message: tableError.message,
            details: tableError.details,
            hint: tableError.hint,
            code: tableError.code
          });
          throw new Error(`Table error: ${tableError.message}`);
        }

        // Try to get table information using raw SQL instead of RPC
        const { data: schemaInfo, error: schemaError } = await supabase
          .from('users')
          .select('id')
          .limit(1);

        console.log('Schema check response:', { schemaInfo, schemaError });

        if (schemaError) {
          console.error('Schema error details:', {
            message: schemaError.message,
            details: schemaError.details,
            hint: schemaError.hint,
            code: schemaError.code
          });
        }

        // Let's also try to describe the table structure
        const { data: describeData, error: describeError } = await supabase
          .rpc('describe_table', { table_name: 'users' });

        console.log('Table description:', { describeData, describeError });

        setTableInfo({
          schema: schemaInfo,
          description: describeData,
          errors: {
            schema: schemaError,
            describe: describeError
          }
        });

        // If we get here, try to fetch users
        const { data: users, error: fetchError } = await supabase
          .from('users')
          .select('*');

        console.log('Users fetch response:', { users, fetchError });

        if (fetchError) {
          throw new Error(`Failed to fetch users: ${fetchError.message}`);
        }

        setUsers(users || []);
      } catch (err) {
        console.error('Database check error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    checkDatabase();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Database Status:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(tableInfo, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Connection Status:</h2>
        <p>{loading ? 'Testing connection...' : error ? 'Connection failed' : 'Connected successfully'}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Users in Database:</h2>
        {users.length === 0 ? (
          <p>No users found in the database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">ID</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">First Name</th>
                  <th className="px-4 py-2 border">Last Name</th>
                  <th className="px-4 py-2 border">Birth Date</th>
                  <th className="px-4 py-2 border">Postcode</th>
                  <th className="px-4 py-2 border">Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-2 border">{user.id}</td>
                    <td className="px-4 py-2 border">{user.email}</td>
                    <td className="px-4 py-2 border">{user.first_name}</td>
                    <td className="px-4 py-2 border">{user.last_name}</td>
                    <td className="px-4 py-2 border">{user.birth_date}</td>
                    <td className="px-4 py-2 border">{user.postcode}</td>
                    <td className="px-4 py-2 border">{new Date(user.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}; 