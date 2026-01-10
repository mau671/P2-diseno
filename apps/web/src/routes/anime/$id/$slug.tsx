import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Star,
  Heart,
  Clock,
  Tv2,
  Calendar,
  BadgeInfo,
} from "lucide-react";

import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useStablePastelColor } from "@/hooks/useStablePastelColor";
import { AnimeCharactersPanel } from "@/components/anime/AnimeCharactersPanel";
import { AnimeEpisodesPanel } from "@/components/anime/AnimeEpisodesPanel";
import { AnimeRecommendationsPanel } from "@/components/anime/AnimeRecommendationsPanel";
import { fetchJikan, ApiError } from "@/api/jikan";

type JikanGenre = { mal_id: number; name: string };
type JikanStudio = { mal_id: number; name: string };
type JikanImages = {
  jpg?: { image_url?: string; large_image_url?: string };
  webp?: { image_url?: string; large_image_url?: string };
};

type AnimeDetail = {
  mal_id: number;
  title: string;
  title_english?: string | null;
  images?: JikanImages;
  score?: number | null;
  synopsis?: string | null;
  episodes?: number | null;
  year?: number | null;
  duration?: string | null; // "24 min per ep"
  status?: string | null; // "Finished Airing"
  type?: string | null; // "TV Special"
  genres?: JikanGenre[];
  studios?: JikanStudio[];
  members?: number | null;
};

async function fetchAnimeDetail(
  id: number,
  signal?: AbortSignal
): Promise<AnimeDetail | null> {
  try {
    const json = await fetchJikan<{ data?: AnimeDetail }>(
      `/anime/${id}/full`,
      undefined,
      { signal }
    );
    return json?.data ?? null;
  } catch (error) {
    // Re-throw ApiError so React Query can handle retries
    if (error instanceof ApiError) {
      throw error;
    }
    // For other errors, throw a generic ApiError
    throw new ApiError("Error al cargar datos del anime.");
  }
}

function slugifyLocal(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function keyFromLabel(raw?: string | null) {
  if (!raw) return null;
  return raw.trim().toLowerCase().replace(/[^\w]+/g, "_");
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

function translateAnimeFormat(
  tAny: TranslateFn,
  rawType?: string | null
) {
  const key = keyFromLabel(rawType);
  if (!key) return null;
  return tAny(`search.formats.${key}`, { defaultValue: rawType ?? "" });
}

function translateAnimeStatus(
  tAny: TranslateFn,
  rawStatus?: string | null
) {
  const key = keyFromLabel(rawStatus);
  if (!key) return null;
  return tAny(`anime.status.${key}`, { defaultValue: rawStatus ?? "" });
}

function translateDuration(tAny: TranslateFn, raw?: string | null) {
  if (!raw) return null;
  const m = raw.match(/(\d+)\s*min/i);
  if (m?.[1]) {
    return tAny("anime.detail.minPerEp", {
      minutes: m[1],
      defaultValue: `${m[1]} min per ep`,
    });
  }
  return raw;
}

/**
 * Soporta que el hook devuelva string (#RRGGBB) o un objeto (por si su lib lo hace).
 * Si devuelve string -> lo usamos como color base.
 */
function getPastelBaseColor(pastel: unknown): string {
  if (typeof pastel === "string" && pastel.trim()) return pastel.trim();

  if (pastel && typeof pastel === "object") {
    const p = pastel as Record<string, unknown>;
    const candidates = [p.bg, p.background, p.base, p.color, p.hex].filter(Boolean);

    const first = candidates[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }

  // fallback seguro
  return "#8BCF6F";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  return null;
}

function toRgba(color: string, alpha: number) {
  const a = clamp(alpha, 0, 1);

  if (/^rgba?\(/i.test(color)) {
    if (/^rgba\(/i.test(color)) return color;
    return color.replace(/^rgb\(/i, "rgba(").replace(/\)\s*$/, `, ${a})`);
  }

  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

export const Route = createFileRoute("/anime/$id/$slug")({
  component: AnimeDetailPage,
});

function AnimeDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="p-4 md:p-6">
          <div className="flex flex-row gap-3 md:gap-6">
            {/* Poster con botón debajo */}
            <div className="shrink-0 flex flex-col">
              <Skeleton className="w-24 md:w-44 aspect-[2/3] rounded-xl border" />
              <Skeleton className="h-8 md:h-10 w-full mt-3 rounded-md" />
            </div>
            
            {/* Contenido principal */}
            <div className="flex-1 space-y-2 md:space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 md:h-7 w-2/3" />
                <Skeleton className="h-12 md:h-14 w-12 md:w-14 rounded-lg shrink-0" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-16 md:h-24 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl border" />
        <Skeleton className="h-56 rounded-2xl border" />
      </div>

      <Skeleton className="h-56 rounded-2xl border" />
    </div>
  );
}

function AnimeDetailPage() {
  const { t } = useTranslation();
  const tAny = t as TranslateFn;

  const navigate = useNavigate();

  const params = Route.useParams() as { id?: string; slug?: string };
  const rawId = params?.id ?? "";
  const routeSlug = params?.slug ?? "";

  const animeId = React.useMemo(() => Number(rawId), [rawId]);
  const enabled = Number.isFinite(animeId) && animeId > 0;

  const pastelRaw = useStablePastelColor(enabled ? animeId : 0);
  const pastel = React.useMemo(() => getPastelBaseColor(pastelRaw), [pastelRaw]);

  const chipBg = React.useMemo(() => toRgba(pastel, 0.18), [pastel]);
  const chipBorder = React.useMemo(() => toRgba(pastel, 0.38), [pastel]);

  const detail = useQuery({
    queryKey: ["animeDetail", animeId],
    enabled,
    queryFn: ({ signal }) => fetchAnimeDetail(animeId, signal),
    staleTime: 1000 * 60 * 5,
  });

  const anime = detail.data ?? null;

  // Use the same score color logic as AnimeCard
  const scoreColor = React.useMemo(() => {
    if (!anime?.score) return "#6b7280";
    if (anime.score >= 8) return "#22c55e";
    if (anime.score >= 6) return "#84cc16";
    if (anime.score >= 4) return "#f59e0b";
    return "#ef4444";
  }, [anime?.score]);

  React.useEffect(() => {
    if (!anime) return;
    const title = (anime.title_english || anime.title || "anime").trim();
    const correct = slugifyLocal(title) || "anime";

    if (routeSlug && correct && routeSlug !== correct) {
      navigate({
        to: "/anime/$id/$slug",
        params: { id: String(animeId), slug: correct },
        replace: true,
      });
    }
  }, [anime, animeId, routeSlug, navigate]);

  if (!enabled) {
    return <EmptyState message={tAny("common.notFound")} />;
  }

  // If we have cached data, always show it (even if there's an error)
  // This ensures users see data from previous visits even if the API is temporarily unavailable
  if (anime) {
    // Continue to render the anime detail page with cached data
  } else if (detail.isLoading || (detail.isError && detail.isFetching)) {
    // Show loading state while loading or retrying
    return <AnimeDetailSkeleton />;
  } else if (detail.isError && !detail.isFetching) {
    // Only show error if query failed, is not retrying, and we have no cached data
    return (
      <ErrorState
        message={
          detail.error instanceof Error
            ? detail.error.message
            : tAny("common.loadError")
        }
        onRetry={() => detail.refetch()}
      />
    );
  } else if (!detail.isLoading && !detail.isError) {
    // Show not found only if we have no data, no error, and not loading
    return <EmptyState message={tAny("common.notFound")} />;
  } else {
    // Fallback: show skeleton if we're still waiting for initial load
    return <AnimeDetailSkeleton />;
  }

  const poster =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    anime.images?.webp?.image_url ||
    anime.images?.jpg?.image_url ||
    "";

  const genres = anime.genres ?? [];
  const studios = anime.studios ?? [];
  const synopsis = anime.synopsis ?? null;

  const formatLabel = translateAnimeFormat(tAny, anime.type);
  const statusLabel = translateAnimeStatus(tAny, anime.status);
  const durationLabel = translateDuration(tAny, anime.duration);

  const typeLine = [
    formatLabel ? String(formatLabel) : null,
    anime.episodes != null ? `${anime.episodes} ${tAny("search.episodes")}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const scoreLabel = tAny("anime.detail.scoreLabel", { defaultValue: "Score" });
  const studiosLabel = tAny("anime.detail.studiosLabel", { defaultValue: "Studios" });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="p-4 md:p-6">
          <div className="flex flex-row gap-3 md:gap-6">
            {/* Poster con botón de favoritos debajo */}
            <div className="shrink-0 flex flex-col">
              <div className="w-24 md:w-44 aspect-[2/3] rounded-xl overflow-hidden border bg-muted shadow-lg">
                {poster ? (
                  <img
                    src={poster}
                    alt={anime.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>
              
              {/* Botón de favoritos debajo del poster */}
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 md:h-10 text-xs md:text-sm"
                  onClick={(e) => e.preventDefault()}
                >
                  <Heart className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                  <span className="hidden md:inline">{tAny("common.addToFavorites")}</span>
                  <span className="md:hidden">{tAny("common.favorite")}</span>
                </Button>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 min-w-0">
              {/* Título y score en la parte superior */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-lg md:text-3xl font-semibold leading-tight line-clamp-2 flex-1">
                  {anime.title}
                </h1>

                {anime.score != null ? (
                  <div
                    className="shrink-0 rounded-lg px-2 py-1.5 md:px-3 md:py-2 border backdrop-blur-sm"
                    style={{
                      backgroundColor: `${scoreColor}20`,
                      borderColor: `${scoreColor}40`,
                    }}
                  >
                    <div className="flex items-center gap-1 md:gap-2">
                      <Star className="h-3 w-3 md:h-4 md:w-4" style={{ color: scoreColor }} />
                      <span className="font-semibold text-sm md:text-base" style={{ color: scoreColor }}>
                        {anime.score}
                      </span>
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground hidden md:block">
                      {scoreLabel}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Metadata compacta */}
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                {typeLine ? (
                  <span className="inline-flex items-center gap-1">
                    <Tv2 className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="whitespace-nowrap">{typeLine}</span>
                  </span>
                ) : null}

                {anime.year ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                    {anime.year}
                  </span>
                ) : null}

                {durationLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="whitespace-nowrap">{durationLabel}</span>
                  </span>
                ) : null}

                {statusLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <BadgeInfo className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="whitespace-nowrap">{statusLabel}</span>
                  </span>
                ) : null}
              </div>

              {/* Géneros */}
              {genres.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                  {genres.slice(0, 10).map((g) => (
                    <span
                      key={g.mal_id}
                      className="text-xs px-2.5 py-1 md:px-3 md:py-1 rounded-full border text-foreground"
                      style={{
                        backgroundColor: chipBg,
                        borderColor: chipBorder,
                      }}
                    >
                      {tAny(`genres.${g.mal_id}`, { defaultValue: g.name })}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Sinopsis y estudios - en desktop van al lado del poster */}
              {synopsis ? (
                <div className="text-xs md:text-sm leading-relaxed text-muted-foreground">
                  <p className="line-clamp-4 md:line-clamp-none">{synopsis}</p>
                </div>
              ) : null}

              {studios.length > 0 ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  {studiosLabel}:{" "}
                  <span className="text-foreground/90">
                    {studios.map((s) => s.name).join(", ")}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <AnimeCharactersPanel animeId={animeId} delay={500} />

        {/* ✅ US-15: Episodes Panel */}
        <AnimeEpisodesPanel animeId={animeId} delay={1000} />
      </div>

      {/* Abajo: Related full-width */}
      <AnimeRecommendationsPanel animeId={animeId} delay={1500} />
    </div>
  );
}
