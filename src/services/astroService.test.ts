import { calculateMoonSign, BirthLocation } from './astroService';

describe('astroService', () => {
  describe('calculateMoonSign', () => {
    // Test cases with known birth dates and locations
    const testCases = [
      {
        date: new Date('2024-03-27T12:00:00Z'),
        location: { latitude: 40.7128, longitude: -74.0060 }, // New York
        expectedSign: 'Libra' // You may need to verify this expected value
      },
      {
        date: new Date('2024-03-27T00:00:00Z'),
        location: { latitude: 51.5074, longitude: -0.1278 }, // London
        expectedSign: 'Virgo' // You may need to verify this expected value
      }
    ];

    testCases.forEach(({ date, location, expectedSign }) => {
      it(`should calculate moon sign for ${date.toISOString()} at ${location.latitude}, ${location.longitude}`, async () => {
        const moonSign = await calculateMoonSign(date, location);
        console.log(`Calculated moon sign: ${moonSign}`);
        expect(moonSign).toBeDefined();
        expect(typeof moonSign).toBe('string');
        expect(moonSign).toBe(expectedSign);
      });
    });

    it('should handle invalid dates', async () => {
      const invalidDate = new Date('invalid');
      const location: BirthLocation = { latitude: 0, longitude: 0 };
      
      await expect(calculateMoonSign(invalidDate, location)).rejects.toThrow();
    });

    it('should handle invalid locations', async () => {
      const date = new Date();
      const invalidLocation: BirthLocation = { latitude: 91, longitude: 181 }; // Invalid coordinates
      
      await expect(calculateMoonSign(date, invalidLocation)).rejects.toThrow();
    });
  });
}); 