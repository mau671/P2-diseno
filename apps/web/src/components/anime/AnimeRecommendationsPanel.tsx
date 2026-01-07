import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useAnimeRecommendations } from "@/api/queries";
import { AnimeCard } from "@/components/anime/AnimeCard.tsx";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type RecommendationEntry = {
  mal_id: number;
  entry: {
    mal_id: number;
    url: string;
    images: {
      jpg?: { image_url?: string; large_image_url?: string };
      webp?: { image_url?: string; large_image_url?: string };
    };
    title: string;
  };
  votes: number;
};

//Función para obtener detalles completos 
async function fetchAnimeDetails(animeId: number, signal?: AbortSignal) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`, { signal });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error(`Error fetching anime ${animeId}:`, error);
    }
    return null;
  }
}

interface LazyAnimeCardWrapperProps {
  recommendation: RecommendationEntry;
}

function LazyAnimeCardWrapper({ recommendation }: LazyAnimeCardWrapperProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);

  const { data: fullDetails } = useQuery({
    queryKey: ["animeDetails", recommendation.entry.mal_id],
    queryFn: ({ signal }) => fetchAnimeDetails(recommendation.entry.mal_id, signal),
    enabled: isHovered || hasLoadedOnce,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  React.useEffect(() => {
    if (isHovered && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [isHovered, hasLoadedOnce]);

  const animeData = fullDetails || {
    mal_id: recommendation.entry.mal_id,
    url: recommendation.entry.url,
    images: recommendation.entry.images,
    title: recommendation.entry.title,
    score: undefined,
    genres: [],
    studios: [],
    type: undefined,
    episodes: undefined,
    year: undefined,
    season: undefined,
    status: undefined,
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimeCard anime={animeData} />
    </div>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

type Props = {
  animeId: number;
  className?: string;
};

export function AnimeRecommendationsPanel({ animeId, className }: Props) {
  const { t } = useTranslation();

  const recommendationsQuery = useAnimeRecommendations(animeId, true);

  const all = recommendationsQuery.data ?? [];

  const pageSize = 9;
  const [page, setPage] = React.useState(0);

  const maxPage = React.useMemo(() => {
    const total = all.length;
    return Math.max(0, Math.ceil(total / pageSize) - 1);
  }, [all.length]);

  React.useEffect(() => {
    setPage((p) => Math.min(p, maxPage));
  }, [maxPage, animeId]);

  const canPrev = page > 0;
  const canNext = page < maxPage;

  const pageItems = React.useMemo(() => {
    const start = page * pageSize;
    return all.slice(start, start + pageSize);
  }, [all, page]);

  const title = t("anime.detail.sections.recommendations", { 
    defaultValue: "Recommendations" 
  });

  if (recommendationsQuery.isError) {
    const msg =
      recommendationsQuery.error instanceof Error
        ? recommendationsQuery.error.message
        : t("common.loadError", { defaultValue: "Error loading data." });

    return (
      <div className={cn("rounded-2xl border p-5 bg-card min-h-[280px]", className)}>
        <div className="font-semibold mb-2 text-lg">{title}</div>
        <ErrorState message={msg} onRetry={() => recommendationsQuery.refetch()} />
      </div>
    );
  }

  if (recommendationsQuery.isLoading) {
    return (
      <div className={cn("rounded-2xl border p-5 bg-card min-h-[280px]", className)}>
        <div className="font-semibold mb-2 text-lg">{title}</div>
        <RecommendationsSkeleton />
      </div>
    );
  }

  if (!recommendationsQuery.data || all.length === 0) {
    return (
      <div className={cn("rounded-2xl border p-5 bg-card min-h-[280px]", className)}>
        <div className="font-semibold mb-2 text-lg">{title}</div>
        <EmptyState
          message={t("anime.recommendations.empty", {
            defaultValue: "No recommendations available.",
          })}
        />
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border p-5 bg-card min-h-[280px]", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-lg">{title}</div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!canPrev}
            className="h-9 w-9 rounded-full border"
            aria-label={t("common.previous", { defaultValue: "Previous" })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            disabled={!canNext}
            className="h-9 w-9 rounded-full border"
            aria-label={t("common.next", { defaultValue: "Next" })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 relative overflow-hidden">
        <div className="flex gap-4 flex-wrap">
          {pageItems.map((rec) => (
            <LazyAnimeCardWrapper
              key={rec.entry.mal_id}
              recommendation={rec}
            />
          ))}
        </div>
      </div>

      {maxPage > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          {page + 1}/{maxPage + 1}
        </div>
      )}
    </div>
  );
}