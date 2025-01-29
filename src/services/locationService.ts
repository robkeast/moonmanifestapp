import { Country, State, City } from 'country-state-city';

export interface LocationData {
  name: string;
  code: string;
}

export function getAllCountries(): LocationData[] {
  return Country.getAllCountries().map(country => ({
    name: country.name,
    code: country.isoCode
  }));
}

export function getStatesOfCountry(countryCode: string): LocationData[] {
  return State.getStatesOfCountry(countryCode).map(state => ({
    name: state.name,
    code: state.isoCode
  }));
}

export function getCitiesOfState(countryCode: string, stateCode: string): LocationData[] {
  return City.getCitiesOfState(countryCode, stateCode).map(city => ({
    name: city.name,
    code: city.name
  }));
}

export function getCountryCodeByName(countryName: string): string | undefined {
  const country = Country.getAllCountries().find(c => c.name === countryName);
  return country?.isoCode;
}

export function getStateCodeByName(stateName: string, countryCode: string): string | undefined {
  const state = State.getStatesOfCountry(countryCode).find(s => s.name === stateName);
  return state?.isoCode;
}

export function getOrderedCountries(): LocationData[] {
  const countries = getAllCountries();
  const popularCountries: LocationData[] = [];
  const otherCountries: LocationData[] = [];

  const POPULAR_COUNTRY_CODES = ['US', 'GB', 'CA', 'AU', 'NZ'];
  
  countries.forEach(country => {
    if (POPULAR_COUNTRY_CODES.includes(country.code)) {
      popularCountries.push(country);
    } else {
      otherCountries.push(country);
    }
  });

  popularCountries.sort((a, b) => a.name.localeCompare(b.name));
  otherCountries.sort((a, b) => a.name.localeCompare(b.name));

  return [...popularCountries, ...otherCountries];
} 
