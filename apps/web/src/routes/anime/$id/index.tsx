import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";

import { useAnimeDetail } from "@/api/queries";
import { slugify } from "@/lib/slug";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/anime/$id/")({
  component: AnimeDetailRedirectPage,
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
});

function AnimeDetailRedirectSkeleton() {
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
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimeDetailRedirectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const params = Route.useParams() as { id?: string };
  const { from } = Route.useSearch();

  const rawId = params?.id ?? "";
  const animeId = React.useMemo(() => Number(rawId), [rawId]);
  const enabled = Number.isFinite(animeId) && animeId > 0;

  const detail = useAnimeDetail(animeId, enabled);
  const anime = detail.data?.data;

  const didNav = React.useRef(false);

  const goBack = React.useCallback(() => {
    if (from && from.startsWith("/")) {
      navigate({ to: from });
      return;
    }
    if (window.history.length > 1) window.history.back();
    else navigate({ to: "/anime/catalog" });
  }, [from, navigate]);

  React.useEffect(() => {
    if (!enabled) return;
    if (!anime) return;
    if (didNav.current) return;

    const title = (anime as any)?.title_english || anime.title || "anime";
    const slug = slugify(title);

    didNav.current = true;

    navigate({
      to: "/anime/$id/$slug",
      params: { id: String(animeId), slug },
      search: { from: from ?? undefined },
      replace: true,
    });
  }, [enabled, anime, animeId, navigate, from]);

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

  if (detail.isLoading) return <AnimeDetailRedirectSkeleton />;

  if (detail.isError) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("common.back")}
        </Button>
        <ErrorState
          message={
            detail.error instanceof Error ? detail.error.message : t("common.loadError")
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
          {t("common.back")}
        </Button>
        <EmptyState message={t("common.notFound")} />
      </div>
    );
  }

  return <AnimeDetailRedirectSkeleton />;
}
