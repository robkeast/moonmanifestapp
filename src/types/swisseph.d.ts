declare module '@goldenius/swisseph-api-web' {
  export class SwissEph {
    getJulianDay(year: number, month: number, day: number, hour: number): number;
    getMoonPosition(julianDay: number, latitude: number, longitude: number): Promise<{
      longitude: number;
      latitude: number;
      distance: number;
    }>;
  }
} 