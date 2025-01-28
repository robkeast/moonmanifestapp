import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Moon className="h-8 w-8 text-[rgb(67,83,143)]" />
              <span className="text-2xl font-serif text-[rgb(67,83,143)]">
                Moon Manifest
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-serif mb-6">Welcome to Your Dashboard</h1>
        <p className="text-gray-600">
          Your manifestation journey begins here. Start exploring the tools and features below.
        </p>
        
        {/* Placeholder for dashboard content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-serif mb-4">Current Moon Phase</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-serif mb-4">Today's Manifestation</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-serif mb-4">Progress Tracker</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
};