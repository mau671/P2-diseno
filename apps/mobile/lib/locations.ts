import { apiRequest } from '@/lib/api';

export type Country = { id: string; name_es: string };
export type Region = { id: string; name: string };
export type City = { id: string; name: string };

export async function fetchCountries() {
  return apiRequest<{ countries: Country[] }>('/locations/countries', { method: 'GET' });
}

export async function fetchRegions(countryId: string) {
  return apiRequest<{ regions: Region[] }>(`/locations/regions?countryId=${countryId}`, { method: 'GET' });
}

export async function fetchCities(regionId: string) {
  return apiRequest<{ cities: City[] }>(`/locations/cities?regionId=${regionId}`, { method: 'GET' });
}
