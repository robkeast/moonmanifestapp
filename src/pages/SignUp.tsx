import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Autocomplete } from '../components/ui/Autocomplete';
import { 
  getOrderedCountries, 
  getStatesOfCountry,
  getCitiesOfState,
  getCountryCodeByName,
  getStateCodeByName,
  LocationData 
} from '../services/locationService';
import { calculateMoonSign } from '../services/astroService';
import { geocodeLocation } from '../services/geocodingService';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [countries] = useState<LocationData[]>(getOrderedCountries());
  const [regions, setRegions] = useState<LocationData[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthDate: '',
    birthCountry: '',
    birthRegion: '',
    birthCity: '',
    gender: '',
  });

  useEffect(() => {
    if (formData.birthCountry) {
      const countryCode = getCountryCodeByName(formData.birthCountry);
      if (countryCode) {
        const statesList = getStatesOfCountry(countryCode);
        setRegions(statesList);
        // Reset region and city when country changes
        setFormData(prev => ({ ...prev, birthRegion: '', birthCity: '' }));
      }
    } else {
      setRegions([]);
    }
  }, [formData.birthCountry]);

  const handleCitySearch = async (query: string) => {
    if (!formData.birthCountry || !formData.birthRegion) return [];
    
    const countryCode = getCountryCodeByName(formData.birthCountry);
    const stateCode = getStateCodeByName(formData.birthRegion, countryCode || '');
    
    if (!countryCode || !stateCode) return [];

    const cities = getCitiesOfState(countryCode, stateCode)
      .filter(city => city.name.toLowerCase().includes(query.toLowerCase()))
      .map(city => city.name);

    return cities;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      // Get coordinates for birth location
      const location = await geocodeLocation(
        formData.birthCity,
        formData.birthRegion,
        formData.birthCountry
      );

      // Calculate moon sign based on birth date and location
      const birthDate = new Date(formData.birthDate);
      const moonSign = await calculateMoonSign(birthDate, location);
      
      console.log('Birth Location:', location);
      console.log('Calculated Moon Sign:', moonSign);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            birth_date: formData.birthDate,
            birth_country: formData.birthCountry,
            birth_region: formData.birthRegion,
            birth_city: formData.birthCity,
            gender: formData.gender,
            moon_sign: moonSign,
            birth_latitude: location.latitude,
            birth_longditude: location.longitude,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please try logging in instead.');
        } else {
          throw authError;
        }
        return;
      }

      if (authData?.user) {
        // Debug logging for location data
        console.log('Location Data Debug:', {
          country: {
            name: formData.birthCountry,
            code: getCountryCodeByName(formData.birthCountry)
          },
          region: {
            name: formData.birthRegion,
            code: getStateCodeByName(formData.birthRegion, getCountryCodeByName(formData.birthCountry) || '')
          },
          city: formData.birthCity
        });

        const userData = {
          id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          birth_date: formData.birthDate,
          birth_country: formData.birthCountry,
          birth_region: formData.birthRegion,
          birth_city: formData.birthCity,
          gender: formData.gender,
          moon_sign: moonSign,
          birth_latitude: location.latitude,
          birth_longditude: location.longitude,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('User Data being written:', userData);

        const { error: userError } = await supabase
          .from('users')
          .insert([userData])
          .select()
          .single();

        if (userError) {
          console.error('Failed to create user record:', userError);
          setError('Account created but failed to set up user profile. Please contact support.');
          return;
        }

        if (!authData.session) {
          setMessage('Please check your email for a confirmation link to complete your registration.');
          return;
        }

        navigate('/dashboard');
      } else {
        setError('Failed to create user account. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[rgb(44,52,88)] to-[rgb(75,37,109)] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Moon className="h-10 w-10 text-white" />
          <span className="text-3xl font-serif text-white ml-2">Moon Manifest</span>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-serif text-center mb-6">Begin Your Journey</h2>
          
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-blue-50 text-blue-500 p-3 rounded-lg mb-4">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            
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
            
            <Input
              label="Date of Birth"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              required
            />

            <div className="flex flex-col">
              <label htmlFor="birthCountry" className="text-sm font-medium text-gray-700 mb-1">
                Birth Country
              </label>
              <select
                id="birthCountry"
                value={formData.birthCountry}
                onChange={(e) => setFormData({ ...formData, birthCountry: e.target.value, birthRegion: '', birthCity: '' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(67,83,143)] focus:border-[rgb(67,83,143)] rounded-md"
                required
              >
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="birthRegion" className="text-sm font-medium text-gray-700 mb-1">
                Region/State
              </label>
              <select
                id="birthRegion"
                value={formData.birthRegion}
                onChange={(e) => setFormData({ ...formData, birthRegion: e.target.value, birthCity: '' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(67,83,143)] focus:border-[rgb(67,83,143)] rounded-md"
                required
                disabled={!formData.birthCountry}
              >
                <option value="">Select Region/State</option>
                {regions.map(region => (
                  <option key={region.code} value={region.name}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <Autocomplete
              label="Birth City"
              value={formData.birthCity}
              onChange={(value) => setFormData({ ...formData, birthCity: value })}
              onSearch={handleCitySearch}
              placeholder={!formData.birthCountry ? "Select a country first" : !formData.birthRegion ? "Select a region first" : "Start typing city name..."}
              disabled={!formData.birthCountry || !formData.birthRegion}
              required
            />

            <div className="flex flex-col">
              <label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(67,83,143)] focus:border-[rgb(67,83,143)] rounded-md"
                required
              >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-4 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[rgb(67,83,143)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};