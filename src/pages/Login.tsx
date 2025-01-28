import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[rgb(44,52,88)] to-[rgb(75,37,109)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Moon className="h-10 w-10 text-white" />
          <span className="text-3xl font-serif text-white ml-2">Moon Manifest</span>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-serif text-center mb-6">Welcome Back</h2>
          
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-4 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[rgb(67,83,143)] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};