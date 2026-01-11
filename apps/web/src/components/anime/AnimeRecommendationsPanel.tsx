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
import { AnimeHorizontalSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { cn } from "@/lib/utils";
import { useAnimatedScroll } from "@/hooks/useAnimatedScroll";

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

//Función para obtener detalles de los animes recomendados
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
  return <AnimeHorizontalSkeleton />;
}

type Props = {
  animeId: number;
  className?: string;
  delay?: number; // Delay in milliseconds before enabling the query
};

export function AnimeRecommendationsPanel({ animeId, className, delay = 0 }: Props) {
  const { t } = useTranslation();

  const [enabled, setEnabled] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay === 0) {
      setEnabled(true);
      return;
    }

    const timer = setTimeout(() => {
      setEnabled(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const recommendationsQuery = useAnimeRecommendations(animeId, enabled);

  const all = React.useMemo(() => recommendationsQuery.data ?? [], [recommendationsQuery.data]);
  const hasData = all.length > 0;

  // Auto-retry on error - keeps retrying until data is loaded
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 10;
  
  React.useEffect(() => {
    setRetryCount(0);
  }, [animeId]);

  React.useEffect(() => {
    if (!recommendationsQuery.isError) return;
    if (hasData) return; // Don't retry if we already have data
    if (retryCount >= maxRetries) return;
    if (recommendationsQuery.isFetching) return;

    // Exponential backoff: 2s, 4s, 6s, 8s... up to 20s
    const delay = Math.min(2000 + retryCount * 2000, 20000);
    
    const timer = window.setTimeout(() => {
      setRetryCount(prev => prev + 1);
      recommendationsQuery.refetch();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [recommendationsQuery.isError, hasData, retryCount, recommendationsQuery.isFetching, recommendationsQuery, animeId]);

  const { scrollRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useAnimatedScroll({ axis: "x" });

  const title = t("anime.detail.sections.recommendations", { 
    defaultValue: "Recommendations" 
  });

  // Show loading skeleton while retrying
  const isRetrying = recommendationsQuery.isError && recommendationsQuery.isFetching;

  // Only show error if query failed, not retrying, and exceeded max retries
  if (recommendationsQuery.isError && !recommendationsQuery.isFetching && retryCount >= maxRetries) {
    const msg =
      recommendationsQuery.error instanceof Error
        ? recommendationsQuery.error.message
        : t("common.loadError", { defaultValue: "Error loading data." });

    return (
      <div className={cn("rounded-2xl border p-5 bg-card overflow-hidden", className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-lg">{title}</div>
          <div className="h-8 w-[68px]" aria-hidden />
        </div>
        <ErrorState message={msg} onRetry={() => recommendationsQuery.refetch()} />
      </div>
    );
  }

  if (recommendationsQuery.isLoading || isRetrying) {
    return (
      <div className={cn("rounded-2xl border p-5 bg-card overflow-hidden", className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-lg">{title}</div>
          <div className="flex items-center gap-1" aria-hidden>
            <Skeleton className="h-8 w-8 rounded-md border" />
            <Skeleton className="h-8 w-8 rounded-md border" />
          </div>
        </div>
        <RecommendationsSkeleton />
      </div>
    );
  }

  if (!recommendationsQuery.data || all.length === 0) {
    return (
      <div className={cn("rounded-2xl border p-5 bg-card overflow-hidden", className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-lg">{title}</div>
          <div className="h-8 w-[68px]" aria-hidden />
        </div>
        <EmptyState
          message={t("anime.recommendations.empty", {
            defaultValue: "No recommendations available.",
          })}
        />
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border p-5 bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-lg">{title}</div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="h-8 w-8 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("common.scrollLeft")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="h-8 w-8 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("common.scrollRight")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 relative">
        {canScrollPrev && (
          <div className="absolute left-0 top-0 bottom-4 w-16 bg-gradient-to-r from-card to-transparent pointer-events-none z-10" />
        )}
        {canScrollNext && (
          <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-card to-transparent pointer-events-none z-10" />
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        >
          {all.map((rec) => (
            <LazyAnimeCardWrapper
              key={rec.entry.mal_id}
              recommendation={rec}
            />
          ))}
        </div>
      </div>
    </div>
  );
}