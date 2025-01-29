declare module 'sweph' {
  interface Calc {
    longitude: number;
    latitude: number;
    distance: number;
    longitudeSpeed: number;
    latitudeSpeed: number;
    distanceSpeed: number;
  }

  export function set_ephe_path(path: string): void;
  export function set_topo(longitude: number, latitude: number, elevation: number): void;
  export function julday(year: number, month: number, day: number, hour: number, calendar: number): number;
  export function calc_ut(julianDay: number, body: number, flags: number): Calc;

  // Constants
  export const SE_GREG_CAL: number;
  export const SE_MOON: number;
  export const SEFLG_SPEED: number;
  export const SEFLG_MOSEPH: number;

  export default {
    set_ephe_path,
    set_topo,
    julday,
    calc_ut,
    SE_GREG_CAL,
    SE_MOON,
    SEFLG_SPEED,
    SEFLG_MOSEPH
  };
} 