import { BirthLocation } from './astroService';

const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocodeLocation(city: string, region: string, country: string): Promise<BirthLocation> {
  try {
    const query = `${city}, ${region}, ${country}`;
    const url = `${NOMINATIM_API_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MoonManifest/1.0' // Required by Nominatim's terms of use
      }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Failed to geocode location');
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      };
    }

    throw new Error('No results found for the given location');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to get coordinates for location');
  }
} 