import { useQuery } from "@tanstack/react-query";
import { fetchJikan } from "@/api/jikan";

export function useTopAnime() {
  return useQuery({
    queryKey: ["topAnime"],
    queryFn: () => fetchJikan<{ data: any[] }>("/top/anime"),
    retry: false,               // para que el botón “Reintentar” sea el control
    staleTime: 60_000,
  });
}
