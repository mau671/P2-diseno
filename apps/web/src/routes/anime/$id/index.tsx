import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";

import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AnimeDetail = {
  mal_id: number;
  title: string;
  title_english?: string | null;
};

async function fetchAnimeDetail(id: number, signal?: AbortSignal): Promise<AnimeDetail | null> {
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

export const Route = createFileRoute("/anime/$id/" as any)({
  component: AnimeDetailRedirectPage,
});

function AnimeDetailRedirectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const params = Route.useParams() as { id?: string };
  const rawId = params?.id ?? "";
  const animeId = React.useMemo(() => Number(rawId), [rawId]);
  const enabled = Number.isFinite(animeId) && animeId > 0;

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
    if (!enabled) return;
    if (!anime) return;

    const title = (anime.title_english || anime.title || "anime").trim();
    const slug = slugifyLocal(title) || "anime";

    // 🔥 OJO: sin params tipados para evitar los errores de TS
    navigate({
      to: `/anime/${animeId}/${slug}` as any,
      replace: true,
    });
  }, [enabled, anime, animeId, navigate]);

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

  if (detail.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-56 md:h-64 w-full rounded-2xl border" />
      </div>
    );
  }

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

  // Si por alguna razón no navegó aún, dejamos skeleton
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-56 md:h-64 w-full rounded-2xl border" />
    </div>
  );
}
