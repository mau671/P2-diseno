import { apiRequest } from "@/api/backend";

export type Country = {
  id: string;
  iso2: string;
  iso3: string;
  name_es: string;
  name_en: string;
};

export type Region = {
  id: string;
  country_id: string;
  name: string;
};

export type City = {
  id: string;
  region_id: string;
  name: string;
};

export async function fetchCountries() {
  return apiRequest<{ countries: Country[] }>("/locations/countries", { method: "GET" });
}

export async function fetchRegions(countryId?: string) {
  const query = countryId ? `?countryId=${countryId}` : "";
  return apiRequest<{ regions: Region[] }>(`/locations/regions${query}`, { method: "GET" });
}

export async function fetchCities(regionId?: string) {
  const query = regionId ? `?regionId=${regionId}` : "";
  return apiRequest<{ cities: City[] }>(`/locations/cities${query}`, { method: "GET" });
}
