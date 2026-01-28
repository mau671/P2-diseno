import { useQuery } from "@tanstack/react-query";
import { fetchCities, fetchCountries, fetchRegions } from "@/api/locations";

export const countriesQueryKey = ["locations", "countries"];
export const regionsQueryKey = (countryId?: string) => ["locations", "regions", countryId];
export const citiesQueryKey = (regionId?: string) => ["locations", "cities", regionId];

export function useCountries() {
  return useQuery({
    queryKey: countriesQueryKey,
    queryFn: () => fetchCountries(),
  });
}

export function useRegions(countryId?: string) {
  return useQuery({
    queryKey: regionsQueryKey(countryId),
    queryFn: () => fetchRegions(countryId),
    enabled: !!countryId,
  });
}

export function useCities(regionId?: string) {
  return useQuery({
    queryKey: citiesQueryKey(regionId),
    queryFn: () => fetchCities(regionId),
    enabled: !!regionId,
  });
}
