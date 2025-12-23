import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useTopAnime, type Anime } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

function AnimeListSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4">
          <div className="flex gap-3">
            <Skeleton className="h-16 w-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnimeList({ items }: { items: Anime[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => {
        const img = a?.images?.webp?.image_url || a?.images?.jpg?.image_url;

        return (
          <div key={a.mal_id} className="rounded-xl border p-4 overflow-hidden">
            <div className="flex gap-3">
              {img ? (
                <img
                  src={img}
                  alt={a.title}
                  className="h-16 w-12 rounded object-cover"
                />
              ) : (
                <div className="h-16 w-12 rounded bg-muted" />
              )}

 <div className="min-w-0 flex-1 overflow-hidden">
                <div className="truncate font-semibold">{a.title}</div>
                <div className="text-sm text-muted-foreground">
                  Score: {a.score ?? "N/A"}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
        <AnimeListSkeleton />
      ) : top.isError ? (
        <ErrorState
          message={top.error instanceof Error ? top.error.message : t("common.loadError")}
          onRetry={() => top.refetch()}
        />
      ) : (top.data?.data?.length ?? 0) === 0 ? (
        <EmptyState message={t("topAnime.empty")} />
      ) : (
        <AnimeList items={top.data?.data ?? []} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/anime/top")({
  component: TopAnimePage,
});
