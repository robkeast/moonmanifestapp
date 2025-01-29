import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, LogOut, Trophy, Target, CheckCircle2, Sparkles, ArrowRight, Star, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Illumination, Body, MoonPhase } from 'astronomy-engine';

interface UserData {
  moon_sign: string;
  birth_date: string;
}

interface UserProgress {
  level: number;
  xp: number;
  nextLevelXp: number;
  currentStreak: number;
  longestStreak: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    achieved: string;
  }>;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  category: string;
  targetDate: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  type: string;
  completed: boolean;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [moonPhase, setMoonPhase] = useState<string>('');
  const [illumination, setIllumination] = useState<number>(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sunSign, setSunSign] = useState<string>('');
  
  // Simulated data
  const [userProgress] = useState<UserProgress>({
    level: 5,
    xp: 2340,
    nextLevelXp: 3000,
    currentStreak: 7,
    longestStreak: 14,
    badges: [
      { id: '1', name: 'Early Bird', icon: '🌅', achieved: '2024-03-20' },
      { id: '2', name: 'Goal Setter', icon: '🎯', achieved: '2024-03-15' },
      { id: '3', name: 'Moon Child', icon: '🌙', achieved: '2024-03-10' }
    ]
  });

  const [goals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Launch Creative Business',
      progress: 65,
      category: 'career',
      targetDate: '2024-06-30'
    },
    {
      id: '2',
      title: 'Daily Meditation Practice',
      progress: 80,
      category: 'spiritual',
      targetDate: '2024-04-30'
    }
  ]);

  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Write Business Plan',
      dueDate: '2024-03-30',
      type: 'goal',
      completed: false
    },
    {
      id: '2',
      title: 'Full Moon Ritual',
      dueDate: '2024-03-25',
      type: 'ritual',
      completed: false
    },
    {
      id: '3',
      title: 'Gratitude Journal',
      dueDate: '2024-03-24',
      type: 'practice',
      completed: false
    }
  ]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Astrology & Progress */}
          <div className="space-y-6">
            {/* Celestial Profile */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-serif mb-4 flex items-center">
                <Star className="h-5 w-5 text-[rgb(67,83,143)] mr-2" />
                Your Celestial Profile
              </h2>
              {userData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sun Sign:</span>
                    <span className="font-medium text-[rgb(67,83,143)]">{sunSign}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Moon Sign:</span>
                    <span className="font-medium text-[rgb(67,83,143)]">{userData.moon_sign}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Moon Phase:</span>
                    <span className="font-medium text-[rgb(67,83,143)]">{moonPhase}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-sm text-gray-500">Moon Illumination</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className="bg-[rgb(67,83,143)] h-2.5 rounded-full" 
                        style={{ width: `${illumination}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Loading...</p>
              )}
            </div>

            {/* Progress & Achievements */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-serif mb-4 flex items-center">
                <Trophy className="h-5 w-5 text-[rgb(67,83,143)] mr-2" />
                Progress & Achievements
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Level {userProgress.level}</span>
                    <span className="text-sm text-gray-500">{userProgress.xp} / {userProgress.nextLevelXp} XP</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-[rgb(67,83,143)] h-2.5 rounded-full" 
                      style={{ width: `${(userProgress.xp / userProgress.nextLevelXp) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <div className="text-sm text-gray-500">Current Streak</div>
                    <div className="text-lg font-medium text-[rgb(67,83,143)]">{userProgress.currentStreak} days</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Longest Streak</div>
                    <div className="text-lg font-medium text-[rgb(67,83,143)]">{userProgress.longestStreak} days</div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm text-gray-500 mb-2">Recent Badges</div>
                  <div className="flex space-x-4">
                    {userProgress.badges.map(badge => (
                      <div key={badge.id} className="text-center">
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <div className="text-xs text-gray-600">{badge.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Main Goal Focus */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-serif mb-4 flex items-center">
                <Target className="h-5 w-5 text-[rgb(67,83,143)] mr-2" />
                Main Goal Focus
              </h2>
              {goals.length > 0 && (
                <div className="space-y-6">
                  {goals.map(goal => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{goal.title}</h3>
                          <span className="text-sm text-gray-500">
                            Target: {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-[rgb(67,83,143)] text-white rounded-full">
                          {goal.category}
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[rgb(67,83,143)] h-2 rounded-full" 
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Tasks & Actions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-serif flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-[rgb(67,83,143)] mr-2" />
                  Next Tasks
                </h2>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={task.completed}
                        className="h-4 w-4 text-[rgb(67,83,143)] rounded border-gray-300 focus:ring-[rgb(67,83,143)]"
                        onChange={() => {}}
                        aria-label={`Mark ${task.title} as complete`}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.type === 'goal' 
                        ? 'bg-blue-100 text-blue-800'
                        : task.type === 'ritual'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {task.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-serif mb-4 flex items-center">
                <Sparkles className="h-5 w-5 text-[rgb(67,83,143)] mr-2" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Button className="w-full justify-between">
                  New Journal Entry
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Set New Goal
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  View Moon Calendar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};