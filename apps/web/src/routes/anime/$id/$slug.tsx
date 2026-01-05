import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Star,
  Users,
  Heart,
  Clock,
  Tv2,
  Calendar,
  BadgeInfo,
} from "lucide-react";

import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStablePastelColor } from "@/hooks/useStablePastelColor";

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
  const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`, { signal });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: AnimeDetail };
  return json?.data ?? null;
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

function formatNumber(n?: number | null) {
  if (n == null) return null;
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}

function keyFromLabel(raw?: string | null) {
  if (!raw) return null;
  return raw.trim().toLowerCase().replace(/[^\w]+/g, "_");
}

function translateAnimeFormat(
  tAny: (k: string, o?: any) => string,
  rawType?: string | null
) {
  const key = keyFromLabel(rawType);
  if (!key) return null;
  return tAny(`search.formats.${key}`, { defaultValue: rawType ?? "" });
}

function translateAnimeStatus(
  tAny: (k: string, o?: any) => string,
  rawStatus?: string | null
) {
  const key = keyFromLabel(rawStatus);
  if (!key) return null;
  return tAny(`anime.status.${key}`, { defaultValue: rawStatus ?? "" });
}

function translateDuration(tAny: (k: string, o?: any) => string, raw?: string | null) {
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
    const candidates = [
      p.bg,
      p.background,
      p.base,
      p.color,
      p.hex,
    ].filter(Boolean);

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

  // si ya viene en rgb/rgba, lo dejamos (con alpha simple si es rgb)
  if (/^rgba?\(/i.test(color)) {
    if (/^rgba\(/i.test(color)) return color; // ya tiene alpha
    // rgb(r,g,b) -> rgba(r,g,b,a)
    return color.replace(/^rgb\(/i, "rgba(").replace(/\)\s*$/, `, ${a})`);
  }

  // hex
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

function readableTextOn(bgHexOrRgb: string): string {
  // intentamos calcular contraste solo si es hex
  const rgb = bgHexOrRgb.startsWith("#") ? hexToRgb(bgHexOrRgb) : null;
  if (!rgb) return "rgba(255,255,255,0.92)";
  // luminancia aproximada
  const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return lum > 0.66 ? "rgba(10,10,10,0.92)" : "rgba(255,255,255,0.92)";
}

export const Route = createFileRoute("/anime/$id/$slug")({
  component: AnimeDetailPage,
});

function AnimeDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-28" />

      <div className="relative overflow-hidden rounded-2xl border bg-card">
        <Skeleton className="h-20 md:h-24 w-full" />

        <div className="p-4 md:p-6">
          <div className="flex gap-4 md:gap-6">
            <Skeleton className="w-32 md:w-44 aspect-[2/3] rounded-xl border" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
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
  const tAny = t as unknown as (key: string, options?: any) => string;

  const navigate = useNavigate();

  const params = Route.useParams() as { id?: string; slug?: string };
  const rawId = params?.id ?? "";
  const routeSlug = params?.slug ?? "";

  const animeId = React.useMemo(() => Number(rawId), [rawId]);
  const enabled = Number.isFinite(animeId) && animeId > 0;

  // color pastel estable (mismo que catálogo)
  const pastelRaw = useStablePastelColor(enabled ? animeId : 0);
  const pastel = React.useMemo(() => getPastelBaseColor(pastelRaw), [pastelRaw]);

  // variantes para UI (chips/puntaje)
  const chipBg = React.useMemo(() => toRgba(pastel, 0.18), [pastel]);
  const chipBorder = React.useMemo(() => toRgba(pastel, 0.38), [pastel]);
  const chipText = React.useMemo(() => readableTextOn(pastel), [pastel]);
  const scoreBg = React.useMemo(() => toRgba(pastel, 0.22), [pastel]);
  const scoreBorder = React.useMemo(() => toRgba(pastel, 0.42), [pastel]);

  const detail = useQuery({
    queryKey: ["animeDetail", animeId],
    enabled,
    queryFn: ({ signal }) => fetchAnimeDetail(animeId, signal),
    staleTime: 1000 * 60 * 5,
  });

  const anime = detail.data ?? null;

  const goBack = React.useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else navigate({ to: "/anime/catalog" });
  }, [navigate]);

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
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {tAny("common.back")}
        </Button>
        <EmptyState message={tAny("common.notFound")} />
      </div>
    );
  }

  if (detail.isLoading) return <AnimeDetailSkeleton />;

  if (detail.isError) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {tAny("common.back")}
        </Button>
        <ErrorState
          message={
            detail.error instanceof Error
              ? detail.error.message
              : tAny("common.loadError")
          }
          onRetry={() => detail.refetch()}
        />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {tAny("common.back")}
        </Button>
        <EmptyState message={tAny("common.notFound")} />
      </div>
    );
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
      <Button variant="outline" size="sm" onClick={goBack}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        {tAny("common.back")}
      </Button>

      {/* Card Header con tira pastel (sin banner gigante) */}
      <div className="relative overflow-hidden rounded-2xl border bg-card">
        {/* tira superior */}
        <div
          className="relative h-20 md:h-24 z-0"
          style={{
            backgroundColor: pastel,
          }}
        >
          {/* overlay suave para que no quede “plano” y combine con dark */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-background/15 to-transparent" />
        </div>

        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Poster */}
            <div className="shrink-0 -mt-10 md:-mt-12 z-10">
              <div className="w-32 md:w-44 aspect-[2/3] rounded-xl overflow-hidden border bg-muted shadow-lg">
                {poster ? (
                  <img src={poster} alt={anime.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => e.preventDefault()}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {tAny("common.addToFavorites")}
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-semibold leading-tight truncate">
                    {anime.title}
                  </h1>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {typeLine ? (
                      <span className="inline-flex items-center gap-1">
                        <Tv2 className="h-4 w-4" />
                        {typeLine}
                      </span>
                    ) : null}

                    {anime.year ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {anime.year}
                      </span>
                    ) : null}

                    {durationLabel ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {durationLabel}
                      </span>
                    ) : null}

                    {statusLabel ? (
                      <span className="inline-flex items-center gap-1">
                        <BadgeInfo className="h-4 w-4" />
                        {statusLabel}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Score con color pastel */}
                {anime.score != null ? (
                  <div
                    className="shrink-0 rounded-xl px-3 py-2 border backdrop-blur-sm"
                    style={{
                      backgroundColor: scoreBg,
                      borderColor: scoreBorder,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" style={{ color: pastel }} />
                      <span className="font-semibold">{anime.score}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{scoreLabel}</div>
                  </div>
                ) : null}
              </div>

              {/* Géneros con pastel */}
              {genres.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {genres.slice(0, 10).map((g) => (
                    <span
                      key={g.mal_id}
                      className="text-xs px-3 py-1 rounded-full border"
                      style={{
                        backgroundColor: chipBg,
                        borderColor: chipBorder,
                        color: chipText,
                      }}
                    >
                      {tAny(`genres.${g.mal_id}`, { defaultValue: g.name })}
                    </span>
                  ))}
                </div>
              ) : null}

              {synopsis ? (
                <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  <p className="line-clamp-8">{synopsis}</p>
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

      {/* Arriba: 2 columnas grandes (Characters + Episodes) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border p-5 bg-card min-h-[220px]">
          <div className="font-semibold mb-2 text-lg">
            {tAny("anime.detail.sections.characters")}
          </div>
          <div className="text-sm text-muted-foreground">{tAny("common.comingSoon")}</div>
        </div>

        <div className="rounded-2xl border p-5 bg-card min-h-[220px]">
          <div className="font-semibold mb-2 text-lg">
            {tAny("anime.detail.sections.episodes")}
          </div>
          <div className="text-sm text-muted-foreground">{tAny("common.comingSoon")}</div>
        </div>
      </div>

      {/* Abajo: Related full-width */}
      <div className="rounded-2xl border p-5 bg-card min-h-[220px]">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-lg">
            {tAny("anime.detail.sections.related")}
          </div>

          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Users className="h-4 w-4" />
            {formatNumber(anime.members) ?? tAny("common.na")}
          </div>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">{tAny("common.comingSoon")}</div>
      </div>
    </div>
  );
}
