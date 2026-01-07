import * as React from "react";
import { useTranslation } from "react-i18next";

import { useAnimeEpisodesInfinite, type AnimeEpisode } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Button } from "@/components/ui/button";
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

export function AnimeEpisodesPanel({ animeId }: { animeId: number }) {
  const { t, i18n } = useTranslation();
  const tAny = t as unknown as (key: string, options?: any) => string;

  const isEn = (i18n.language || "").toLowerCase().startsWith("en");

  const q = useAnimeEpisodesInfinite(animeId, true);

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

  const canRevealMoreLocal = shownCount < episodes.length;
  const canFetchMoreRemote = !!q.hasNextPage;
  const canLoadMore = canRevealMoreLocal || canFetchMoreRemote;

  const onLoadMore = React.useCallback(async () => {
    if (!canLoadMore) return;
    if (q.isFetchingNextPage) return;

    // 1) si ya hay más cargados pero ocultos, solo revelamos +50
    if (canRevealMoreLocal) {
      setVisible((v) => v + CHUNK_SIZE);
      return;
    }

    // 2) si no hay más local, pedimos otra página y luego revelamos +50
    if (canFetchMoreRemote) {
      try {
        await q.fetchNextPage();
        setVisible((v) => v + CHUNK_SIZE);
      } catch {
        // el ErrorState ya lo cubre si falla, no hacemos nada extra
      }
    }
  }, [canLoadMore, canRevealMoreLocal, canFetchMoreRemote, q]);

  return (
    <div className="rounded-2xl border p-5 bg-card min-h-[380px] max-w-xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold mb-2 text-lg">
          {tAny("anime.detail.sections.episodes", {
            defaultValue: isEn ? "Episodes" : "Episodios",
          })}
        </div>

        {hasAny ? (
          <div className="text-xs text-muted-foreground tabular-nums">
            {tAny("anime.detail.episodes.countShown", {
              count: shownCount,
              defaultValue: isEn ? `${shownCount} shown` : `${shownCount} mostrados`,
            })}
          </div>
        ) : null}
      </div>

      {/* Loading */}
      {showLoadingSkeleton ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
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

      {/* Error */}
      {q.isError && !showLoadingSkeleton ? (
        <div className="mt-3">
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
        <div className="mt-3">
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
        <>
          {/* Scroll vertical: altura para ~6 items */}
          <div
            key={animeId} // ✅ resetea scroll al cambiar de anime
            className="mt-3 h-[300px] overflow-y-auto pr-2 space-y-1.5"
          >
            {shownEpisodes.map((ep, idx) => {
              const num = getEpisodeNumber(ep, idx);

              const title =
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
                      {title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {canLoadMore
                ? tAny("anime.detail.episodes.moreAvailable", {
                    defaultValue: isEn
                      ? "More episodes available."
                      : "Hay más episodios disponibles.",
                  })
                : tAny("anime.detail.episodes.end", {
                    defaultValue: isEn ? "End of list." : "Fin de la lista.",
                  })}
            </div>

            {canLoadMore ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={q.isFetchingNextPage || !canLoadMore}
              >
                {q.isFetchingNextPage
                  ? tAny("common.loading", {
                      defaultValue: isEn ? "Loading..." : "Cargando...",
                    })
                  : tAny("anime.detail.episodes.loadMore", {
                      defaultValue: isEn ? "Load more" : "Cargar más",
                    })}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
