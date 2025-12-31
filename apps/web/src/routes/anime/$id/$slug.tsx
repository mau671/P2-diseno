import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

import { useAnimeDetail } from "@/api/queries";
import { slugify } from "@/lib/slug";
import { useStablePastelColor } from "@/hooks/useStablePastelColor";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/anime/$id/$slug")({
  component: AnimeDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
});

function formatNumber(n?: number | null) {
  if (!n && n !== 0) return null;
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}

function formatYearFromDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}

function keyFromLabel(raw?: string | null) {
  if (!raw) return null;
  return raw.trim().toLowerCase().replace(/[^\w]+/g, "_");
}

function translateAnimeFormat(t: any, rawType?: string | null) {
  const key = keyFromLabel(rawType);
  if (!key) return null;
  return t(`search.formats.${key}`, rawType?.toUpperCase?.() ?? String(rawType));
}

function translateAnimeStatus(t: any, rawStatus?: string | null) {
  const key = keyFromLabel(rawStatus);
  if (!key) return null;
  return t(`anime.status.${key}`, rawStatus ?? "");
}

function translateDuration(t: any, raw?: string | null) {
  if (!raw) return null;
  const m = raw.match(/(\d+)\s*min/i);
  if (m?.[1]) {
    return t("anime.detail.minPerEp", { minutes: m[1] });
  }
  return raw;
}

function AnimeDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-28" />
      <div className="relative overflow-hidden rounded-2xl border">
        <Skeleton className="h-56 md:h-64 w-full" />
        <div className="p-4 md:p-6">
          <div className="flex gap-4 md:gap-6">
            <Skeleton className="w-32 md:w-44 aspect-[2/3] rounded-xl -mt-16 md:-mt-20 border" />
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl border" />
        <Skeleton className="h-40 rounded-2xl border" />
        <Skeleton className="h-40 rounded-2xl border" />
      </div>

      <Skeleton className="h-52 rounded-2xl border" />
    </div>
  );
}

function AnimeDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const params = Route.useParams() as { id?: string; slug?: string };
  const { from } = Route.useSearch();

  const rawId = params?.id ?? "";
  const routeSlug = params?.slug ?? "";

  const animeId = React.useMemo(() => Number(rawId), [rawId]);
  const enabled = Number.isFinite(animeId) && animeId > 0;

  // ✅ Hook NO puede ser condicional, entonces le pasamos un ID seguro
  const safeAnimeId = enabled ? animeId : 0;
  const pastelColor = useStablePastelColor(safeAnimeId);

  const detail = useAnimeDetail(animeId, enabled);
  const anime = detail.data?.data;

  const poster =
    anime?.images?.webp?.large_image_url ||
    anime?.images?.jpg?.large_image_url ||
    anime?.images?.webp?.image_url ||
    anime?.images?.jpg?.image_url ||
    "";

  const banner = poster;

  const goBack = React.useCallback(() => {
    if (from && from.startsWith("/")) {
      navigate({ to: from });
      return;
    }
    if (window.history.length > 1) window.history.back();
    else navigate({ to: "/anime/catalog" });
  }, [from, navigate]);

  React.useEffect(() => {
    if (!anime) return;
    const title = (anime as any)?.title_english || anime.title || "anime";
    const correct = slugify(title);

    if (routeSlug && correct && routeSlug !== correct) {
      navigate({
        to: "/anime/$id/$slug",
        params: { id: String(animeId), slug: correct },
        search: { from: from ?? undefined },
        replace: true,
      });
    }
  }, [anime, animeId, routeSlug, navigate, from]);

  if (!enabled) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("common.back")}
        </Button>
        <EmptyState message={t("common.notFound")} />
      </div>
    );
  }

  if (detail.isLoading) return <AnimeDetailSkeleton />;

  if (detail.isError) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("common.back")}
        </Button>
        <ErrorState
          message={detail.error instanceof Error ? detail.error.message : t("common.loadError")}
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
          {t("common.back")}
        </Button>
        <EmptyState message={t("common.notFound")} />
      </div>
    );
  }

  const score = anime.score ?? null;
  const year =
    anime.year ??
    (() => {
      const y = Number(formatYearFromDate(anime.aired?.from) ?? "");
      return Number.isFinite(y) && y > 0 ? y : null;
    })();

  const genres = anime.genres ?? [];
  const studios = anime.studios ?? [];
  const synopsis = (anime as any)?.synopsis ?? null;

  const typeLabel = translateAnimeFormat(t, anime.type);
  const statusLabel = translateAnimeStatus(t, anime.status);
  const durationLabel = translateDuration(t, anime.duration);

  const typeLine = [
    typeLabel ? String(typeLabel).toUpperCase() : null,
    anime.episodes != null ? `${anime.episodes} ${t("search.episodes")}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={goBack}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t("common.back")}
      </Button>

      <div className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-56 md:h-64">
          {banner ? (
            <img
              src={banner}
              alt={anime.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
          <div className="absolute inset-0 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="shrink-0 -mt-0 md:-mt-4">
              <div className="w-32 md:w-44 aspect-[2/3] rounded-xl overflow-hidden border bg-muted shadow-lg">
                {poster ? (
                  <img src={poster} alt={anime.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <Button variant="outline" className="w-full">
                  <Heart className="h-4 w-4 mr-2" />
                  {t("common.addToFavorites")}
                </Button>
              </div>
            </div>

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

                    {year ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {year}
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

                {score != null ? (
                  <div
                    className="shrink-0 rounded-xl px-3 py-2 border bg-background/60 backdrop-blur-sm"
                    style={{ borderColor: pastelColor ? String(pastelColor) : undefined }}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span className="font-semibold">{score}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("anime.detail.scoreLabel")}
                    </div>
                  </div>
                ) : null}
              </div>

              {genres.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {genres.slice(0, 6).map((g) => (
                    <span
                      key={g.mal_id}
                      className="text-xs px-3 py-1 rounded-full border bg-background/60"
                      style={{ borderColor: `${pastelColor || "#a855f7"}55` }}
                    >
                      {t(`genres.${g.mal_id}`, g.name)}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {synopsis ? <p className="line-clamp-6">{synopsis}</p> : <p>{t("anime.detail.noSynopsis")}</p>}
              </div>

              {studios.length > 0 ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  {t("anime.detail.studiosLabel")}:{" "}
                  <span className="text-foreground/90">{studios.map((s) => s.name).join(", ")}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border p-4 bg-card">
          <div className="font-semibold mb-2">{t("anime.detail.sections.characters")}</div>
          <div className="text-sm text-muted-foreground">{t("common.comingSoon")}</div>
        </div>

        <div className="rounded-2xl border p-4 bg-card">
          <div className="font-semibold mb-2">{t("anime.detail.sections.related")}</div>
          <div className="text-sm text-muted-foreground">{t("common.comingSoon")}</div>
        </div>

        <div className="rounded-2xl border p-4 bg-card">
          <div className="font-semibold mb-2">{t("anime.detail.sections.episodes")}</div>
          <div className="text-sm text-muted-foreground">{t("common.comingSoon")}</div>
        </div>
      </div>

      <div className="rounded-2xl border p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{t("anime.detail.sections.moreInfo")}</div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Users className="h-4 w-4" />
            {formatNumber((anime as any)?.members) ? formatNumber((anime as any)?.members) : t("common.na")}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">{t("common.comingSoon")}</div>
      </div>
    </div>
  );
}
