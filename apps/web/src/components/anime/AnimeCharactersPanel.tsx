import * as React from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAnimeCharacters } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAnimatedScroll } from "@/hooks/useAnimatedScroll";

type Props = {
  animeId: number;
  className?: string;
  delay?: number; // Delay in milliseconds before enabling the query
};

function CharactersSkeleton() {
  return (
    <div className="mt-4 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-36 md:w-44">
          <Skeleton className="aspect-[3/4] w-full rounded-xl border" />
          <Skeleton className="h-4 w-full mt-2" />
        </div>
      ))}
    </div>
  );
}

export function AnimeCharactersPanel({ animeId, className, delay = 0 }: Props) {
  const { t } = useTranslation();
  const tAny = t as (key: string, options?: Record<string, unknown>) => string;

  // Same pattern as AnimeEpisodesPanel - simple delay handling
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

  const charactersQuery = useAnimeCharacters(animeId, enabled);

  // ✅ normalizamos a { id, name, img }
  const characters = React.useMemo(() => {
    const all = charactersQuery.data ?? [];
    return all
      .map((item, index) => {
        const c = item?.character;
        const img =
          c?.images?.webp?.image_url ||
          c?.images?.jpg?.image_url ||
          "";

        return {
          id: c?.mal_id ?? -(index + 1),
          name: c?.name ?? tAny("common.na", { defaultValue: "N/A" }),
          img,
        };
      })
      .filter((x) => x.name);
  }, [charactersQuery.data, tAny]);

  const hasCharacters = characters.length > 0;

  // Auto-retry on error - keeps retrying until data is loaded
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 10;
  
  React.useEffect(() => {
    setRetryCount(0);
  }, [animeId]);

  React.useEffect(() => {
    if (!charactersQuery.isError) return;
    if (hasCharacters) return; // Don't retry if we already have data
    if (retryCount >= maxRetries) return;
    if (charactersQuery.isFetching) return;

    // Exponential backoff: 2s, 4s, 6s, 8s... up to 20s
    const delay = Math.min(2000 + retryCount * 2000, 20000);
    
    const timer = window.setTimeout(() => {
      setRetryCount(prev => prev + 1);
      charactersQuery.refetch();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [charactersQuery.isError, hasCharacters, retryCount, charactersQuery.isFetching, charactersQuery, animeId]);

  const { scrollRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useAnimatedScroll({ axis: "x" });

  const title = tAny("anime.detail.sections.characters", { defaultValue: "Characters" });

  // Show loading skeleton while retrying
  const isRetrying = charactersQuery.isError && charactersQuery.isFetching;

  // Show skeleton if loading, retrying, or if there's an error but we're still trying
  const showLoadingSkeleton = !enabled ||
    charactersQuery.isLoading || 
    isRetrying ||
    (charactersQuery.isError && retryCount < maxRetries);

  // Only show error if query failed, not retrying, and exceeded max retries
  if (charactersQuery.isError && !charactersQuery.isFetching && retryCount >= maxRetries) {
    const msg =
      charactersQuery.error instanceof Error
        ? charactersQuery.error.message
        : tAny("common.loadError", { defaultValue: "Error loading data." });

    return (
      <div className={cn("rounded-2xl border p-5 bg-card overflow-hidden", className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-lg">{title}</div>
          <div className="h-8 w-[68px]" aria-hidden />
        </div>
        <ErrorState message={msg} onRetry={() => charactersQuery.refetch()} />
      </div>
    );
  }

  if (showLoadingSkeleton) {
    return (
      <div className={cn("rounded-2xl border p-5 bg-card overflow-hidden", className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-lg">{title}</div>
          <div className="flex items-center gap-1" aria-hidden>
            <Skeleton className="h-8 w-8 rounded-md border" />
            <Skeleton className="h-8 w-8 rounded-md border" />
          </div>
        </div>
        <CharactersSkeleton />
      </div>
    );
  }

  // Only show empty state if enabled, query succeeded, and truly no data
  if (enabled && (!charactersQuery.data || characters.length === 0) && !charactersQuery.isError) {
    return (
      <div className={cn("rounded-2xl border p-5 bg-card overflow-hidden", className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-lg">{title}</div>
          <div className="h-8 w-[68px]" aria-hidden />
        </div>
        <EmptyState
          message={tAny("anime.characters.empty", {
            defaultValue: "No characters found.",
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
          {characters.map((c) => (
            <div key={c.id} className="flex-shrink-0 w-36 md:w-44 group">
              <div className="aspect-[3/4] w-full rounded-xl overflow-hidden border bg-muted">
                {c.img ? (
                  <img
                    src={c.img}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground/60" />
                  </div>
                )}
              </div>

              <div className="mt-2 text-sm font-medium truncate">{c.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
