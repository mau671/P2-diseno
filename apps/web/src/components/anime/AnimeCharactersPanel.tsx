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

  const [queryEnabled, setQueryEnabled] = React.useState(delay === 0);

  // Only handle delay logic here - don't reset on animeId changes
  // This matches AnimeRecommendationsPanel behavior and ensures cached data works
  React.useEffect(() => {
    if (delay === 0) {
      setQueryEnabled(true);
      return;
    }

    setQueryEnabled(false);

    const timer = setTimeout(() => {
      setQueryEnabled(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const charactersQuery = useAnimeCharacters(animeId, queryEnabled);

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

  const { scrollRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useAnimatedScroll({ axis: "x" });

  const title = tAny("anime.detail.sections.characters", { defaultValue: "Characters" });

  // While we're waiting for the staggered delay, keep layout stable by rendering the same
  // header structure + skeleton instead of an EmptyState.
  if (!queryEnabled) {
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

  // Only show error if query failed and is not retrying (isFetching = false)
  // If it's retrying, show loading instead
  if (charactersQuery.isError && !charactersQuery.isFetching) {
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

  if (charactersQuery.isLoading || (charactersQuery.isError && charactersQuery.isFetching)) {
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

  if (!charactersQuery.data || characters.length === 0) {
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
