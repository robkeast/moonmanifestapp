import { Equator, Observer, AstroTime, Body } from 'astronomy-engine';

// Zodiac signs in order
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export interface BirthLocation {
  latitude: number;   // Decimal degrees (positive for North, negative for South)
  longitude: number;  // Decimal degrees (positive for East, negative for West)
}

/**
 * Gets the zodiac sign based on celestial longitude
 */
function getZodiacSign(longitude: number): string {
  const signIndex = Math.floor(longitude / 30) % 12;
  return ZODIAC_SIGNS[signIndex];
}

/**
 * Calculates the moon sign for a given birth date and location
 */
export async function calculateMoonSign(birthDate: Date, location: BirthLocation): Promise<string> {
  try {
    const observer = new Observer(location.latitude, location.longitude, 0);
    const astroTime = new AstroTime(birthDate);
    const equator = Equator(Body.Moon, astroTime, observer, true, true);

    return getZodiacSign(equator.ra);  // Use right ascension as a proxy for longitude
  } catch (error) {
    console.error('Error calculating moon sign:', error);
    throw new Error('Failed to calculate moon sign');
  }
}

/**
 * Helper function to convert city coordinates to decimal degrees
 */
export function convertCoordinates(latitude: string, longitude: string): BirthLocation {
  const parseLat = (lat: string): number => {
    const value = parseFloat(lat);
    return lat.toLowerCase().includes('s') ? -value : value;
  };

  const parseLong = (long: string): number => {
    const value = parseFloat(long);
    return long.toLowerCase().includes('w') ? -value : value;
  };

  return {
    latitude: parseLat(latitude),
    longitude: parseLong(longitude)
  };
} 
