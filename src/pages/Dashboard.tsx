import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Illumination, Body, MoonPhase } from 'astronomy-engine';

interface UserData {
  moon_sign: string;
  birth_date: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [moonPhase, setMoonPhase] = useState<string>('');
  const [illumination, setIllumination] = useState<number>(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sunSign, setSunSign] = useState<string>('');

  useEffect(() => {
    calculateMoonPhase();
    fetchUserData();
  }, []);

  const calculateSunSign = (birthDate: string) => {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    return 'Pisces';
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('moon_sign, birth_date')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUserData(data);
      if (data.birth_date) {
        setSunSign(calculateSunSign(data.birth_date));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const calculateMoonPhase = () => {
    const now = new Date();
    const illum = Illumination(Body.Moon, now);
    setIllumination(Math.round(illum.mag * 100));

    const phase = MoonPhase(now);

    if (phase < 45) {
      setMoonPhase('New Moon');
    } else if (phase < 90) {
      setMoonPhase('Waxing Crescent');
    } else if (phase < 135) {
      setMoonPhase('First Quarter');
    } else if (phase < 180) {
      setMoonPhase('Waxing Gibbous');
    } else if (phase < 225) {
      setMoonPhase('Full Moon');
    } else if (phase < 270) {
      setMoonPhase('Waning Gibbous');
    } else if (phase < 315) {
      setMoonPhase('Last Quarter');
    } else {
      setMoonPhase('Waning Crescent');
    }
  };

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-serif mb-4">Your Celestial Profile</h2>
            {userData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sun Sign:</span>
                  <span className="font-medium text-[rgb(67,83,143)]">{sunSign}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Moon Sign:</span>
                  <span className="font-medium text-[rgb(67,83,143)]">{userData.moon_sign}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Loading...</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-serif mb-4">Current Moon Phase</h2>
            {moonPhase ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-[rgb(67,83,143)]">{moonPhase}</p>
                <p className="text-gray-600">{illumination}% illuminated</p>
              </div>
            ) : (
              <p className="text-gray-600">Loading...</p>
            )}
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