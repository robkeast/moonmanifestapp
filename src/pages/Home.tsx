import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Stars, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[rgb(44,52,88)] to-[rgb(75,37,109)]">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-white">
          <Moon className="h-8 w-8" />
          <span className="text-2xl font-serif">Moon Manifest</span>
        </div>
        <div className="space-x-4">
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link to="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16 text-center text-white">
        <h1 className="text-5xl font-serif mb-6">
          Manifest Your Dreams with Cosmic Guidance
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Combine the power of astrology with modern manifestation techniques to
          transform your life. Let the moon guide your journey to success.
        </p>
        <div className="flex justify-center space-x-6">
          <Link to="/signup">
            <Button size="lg" className="flex items-center space-x-2">
              <Stars className="h-5 w-5" />
              <span>Start Your Journey</span>
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Learn More</span>
          </Button>
        </div>
      </main>
    </div>
  );
};