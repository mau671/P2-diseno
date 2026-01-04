import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useTopAnime } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";

function TopAnimePage() {
  const { t } = useTranslation();
  const top = useTopAnime(1);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("sections.topAnime")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("sections.topAnimeDescription")}
        </p>
      </div>

      {top.isLoading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {Array.from({ length: 21 }).map((_, i) => (
            <AnimeCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : top.isError ? (
        <ErrorState
          message={top.error instanceof Error ? top.error.message : t("common.loadError")}
          onRetry={() => top.refetch()}
        />
      ) : (top.data?.data?.length ?? 0) === 0 ? (
        <EmptyState message={t("topAnime.empty")} />
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {top.data?.data?.map((item) => (
            <AnimeCard key={item.mal_id} anime={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/anime/top")({
  component: TopAnimePage,
});
