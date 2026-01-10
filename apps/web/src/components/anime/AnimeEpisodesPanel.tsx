import * as React from "react";
import { useTranslation } from "react-i18next";

import { useAnimeEpisodesInfinite, type AnimeEpisode } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const CHUNK_SIZE = 50;

function pickEpisodeTitle(ep: {
  title?: string | null;
  title_romanji?: string | null;
  title_japanese?: string | null;
}) {
  const t = ep.title?.trim();
  if (t) return t;

  const r = ep.title_romanji?.trim();
  if (r) return r;

  const j = ep.title_japanese?.trim();
  if (j) return j;

  return null;
}

function getEpisodeNumber(ep: AnimeEpisode, fallbackIndex: number) {
  // preferimos "episode" si existe, si no "mal_id", si no un fallback
  return ep.episode ?? ep.mal_id ?? fallbackIndex + 1;
}

type Props = {
  animeId: number;
  delay?: number; // Delay in milliseconds before enabling the query
};

export function AnimeEpisodesPanel({ animeId, delay = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const tAny = t as (key: string, options?: Record<string, unknown>) => string;

  const isEn = (i18n.language || "").toLowerCase().startsWith("en");

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

  const q = useAnimeEpisodesInfinite(animeId, enabled);

  // ✅ 50 de entrada, y se resetea al cambiar de anime
  const [visible, setVisible] = React.useState(CHUNK_SIZE);
  React.useEffect(() => {
    setVisible(CHUNK_SIZE);
  }, [animeId]);

  const episodes = React.useMemo(() => {
    const flat = q.data?.pages?.flatMap((p) => p?.data ?? []) ?? [];

    // ✅ evita duplicados si por cualquier razón se repite una página
    const seen = new Set<number>();
    const unique: AnimeEpisode[] = [];

    for (let i = 0; i < flat.length; i++) {
      const ep = flat[i];
      const id = ep.episode ?? ep.mal_id;

      if (typeof id === "number") {
        if (seen.has(id)) continue;
        seen.add(id);
      }
      unique.push(ep);
    }

    // ✅ por si viene desordenado
    unique.sort((a, b) => (a.episode ?? a.mal_id ?? 0) - (b.episode ?? b.mal_id ?? 0));

    return unique;
  }, [q.data?.pages]);

  const hasAny = episodes.length > 0;
  const shownCount = Math.min(visible, episodes.length);
  const shownEpisodes = React.useMemo(
    () => episodes.slice(0, shownCount),
    [episodes, shownCount]
  );

  // ✅ evita “flash” de vacío cuando todavía está trayendo data (o al entrar por primera vez)
  const showLoadingSkeleton = q.isLoading || (q.isFetching && !hasAny && !q.isError);

  // ✅ auto-retry 1 vez si falla la primera carga (suele pasar por rate limit / primer fetch)
  const didAutoRetryRef = React.useRef(false);
  React.useEffect(() => {
    didAutoRetryRef.current = false;
  }, [animeId]);

  React.useEffect(() => {
    if (!q.isError) return;
    if (didAutoRetryRef.current) return;
    if (hasAny) return; // si ya hay data, no lo hagas

    didAutoRetryRef.current = true;
    const timer = window.setTimeout(() => {
      q.refetch();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [q.isError, hasAny, q, animeId]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const fetchNextPageRef = React.useRef(q.fetchNextPage);

  React.useEffect(() => {
    fetchNextPageRef.current = q.fetchNextPage;
  }, [q.fetchNextPage]);

  // Auto-increase visible when scrolling near the end
  React.useEffect(() => {
    if (!scrollRef.current || !hasAny || showLoadingSkeleton) return;

    const checkScrollPosition = () => {
      if (!scrollRef.current) return;

      const container = scrollRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;

      // If near the end (within 200px), reveal more episodes
      const isNearEnd = scrollTop + clientHeight >= scrollHeight - 200;

      if (isNearEnd) {
        const canRevealMoreLocal = shownCount < episodes.length;
        const canFetchMoreRemote = !!q.hasNextPage && !q.isFetchingNextPage;

        // 1) If there are more local episodes, reveal them
        if (canRevealMoreLocal) {
          setVisible((v) => Math.min(v + CHUNK_SIZE, episodes.length));
          return;
        }

        // 2) If no more local, fetch next page
        if (canFetchMoreRemote) {
          fetchNextPageRef.current().then(() => {
            // After fetching, reveal the new episodes
            setVisible((v) => v + CHUNK_SIZE);
          });
        }
      }
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition, { passive: true });
      checkScrollPosition(); // Check initial position
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollPosition);
      }
    };
  }, [hasAny, showLoadingSkeleton, shownCount, episodes.length, q.hasNextPage, q.isFetchingNextPage]);

  const title = tAny("anime.detail.sections.episodes", {
    defaultValue: isEn ? "Episodes" : "Episodios",
  });

  return (
    <div className="rounded-2xl border p-5 bg-card w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold mb-2 text-lg truncate">{title}</div>

        {/* Reserve space to avoid layout shifts when count appears/disappears */}
        {hasAny ? (
          <div className="text-xs text-muted-foreground tabular-nums">
            {tAny("anime.detail.episodes.countShown", {
              count: shownCount,
              defaultValue: isEn ? `${shownCount} shown` : `${shownCount} mostrados`,
            })}
          </div>
        ) : (
          <div className="h-4 w-16" aria-hidden />
        )}
      </div>

      {/* Content area: keep the same height in loading/empty/data to avoid jumps */}
      <div className="mt-3 h-[280px] pr-2">
        {/* Loading */}
        {showLoadingSkeleton ? (
          <div className="h-full overflow-hidden space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border px-3 py-3"
              >
                <Skeleton className="h-8 w-10 rounded-md" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : null}

        {/* Error - only show if not retrying */}
        {q.isError && !showLoadingSkeleton && !q.isFetching ? (
          <div className="h-full">
            <ErrorState
              message={
                q.error instanceof Error
                  ? q.error.message
                  : tAny("common.loadError", {
                      defaultValue: isEn ? "Failed to load data." : "Error al cargar datos.",
                    })
              }
              onRetry={() => q.refetch()}
            />
          </div>
        ) : null}

        {/* Empty */}
        {!showLoadingSkeleton && !q.isError && !hasAny ? (
          <div className="h-full">
            <EmptyState
              message={tAny("anime.detail.episodes.empty", {
                defaultValue: isEn
                  ? "No episodes available."
                  : "No hay episodios disponibles.",
              })}
            />
          </div>
        ) : null}

        {/* List */}
        {!showLoadingSkeleton && !q.isError && hasAny ? (
          <div
            key={animeId} // ✅ resetea scroll al cambiar de anime
            ref={scrollRef}
            className="h-full overflow-y-auto space-y-1.5 pr-2"
          >
            {shownEpisodes.map((ep, idx) => {
              const num = getEpisodeNumber(ep, idx);

              const epTitle =
                pickEpisodeTitle(ep) ||
                tAny("anime.detail.episodes.fallbackTitle", {
                  number: num,
                  defaultValue: isEn ? `Episode ${num}` : `Episodio ${num}`,
                });

              return (
                <div
                  key={`${num}-${idx}`}
                  className="flex items-center gap-3 rounded-xl border bg-background/40 px-3 py-3"
                >
                  <div className="shrink-0 h-8 w-10 rounded-md border bg-background/60 flex items-center justify-center text-xs font-semibold tabular-nums">
                    {num}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* ajuste leve en Y para que se vea más centrado */}
                    <div className="text-sm font-medium leading-snug line-clamp-2 relative top-[1px]">
                      {epTitle}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading skeleton for next page */}
            {q.isFetchingNextPage && (
              <div className="space-y-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`loading-${i}`}
                    className="flex items-center gap-3 rounded-xl border px-3 py-3"
                  >
                    <Skeleton className="h-8 w-10 rounded-md" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            )}

            {/* Sentinel for infinite scroll */}
            {q.hasNextPage && <div ref={loadMoreRef} className="h-1 w-full" />}
          </div>
        ) : null}
      </div>
    </div>
  );
}
