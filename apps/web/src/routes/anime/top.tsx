import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";

import { useTopAnime, type Anime } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function AnimeListItem({ anime, t }: { anime: Anime; t: (key: string) => string }) {
  const [isGroupHovered, setIsGroupHovered] = React.useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  const img = anime?.images?.webp?.image_url || anime?.images?.jpg?.image_url;

  return (
    <div 
      className="rounded-xl border p-4 overflow-hidden group"
      onMouseEnter={() => setIsGroupHovered(true)}
      onMouseLeave={() => setIsGroupHovered(false)}
    >
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          {img ? (
            <img
              src={img}
              alt={anime.title}
              className="h-16 w-12 rounded object-cover"
            />
          ) : (
            <div className="h-16 w-12 rounded bg-muted" />
          )}
          <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
            <TooltipTrigger asChild>
              <button
                className={`absolute bottom-0 right-0 transition-all duration-200 ease-out scale-95 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 hover:bg-background/90 hover:scale-110 shadow-lg translate-x-1 translate-y-1 cursor-pointer ${
                  isGroupHovered ? 'opacity-100 scale-100' : 'opacity-0'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onMouseEnter={() => setIsTooltipOpen(true)}
                onMouseLeave={() => setIsTooltipOpen(false)}
              >
                <Heart className="h-3 w-3 text-foreground transition-colors hover:text-red-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover text-popover-foreground border border-border">
              <p>{t("common.addToFavorites")}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="truncate font-semibold">{anime.title}</div>
          <div className="text-sm text-muted-foreground">
            Score: {anime.score ?? "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimeList({ items }: { items: Anime[] }) {
  const { t } = useTranslation();
  
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <AnimeListItem key={a.mal_id} anime={a} t={t} />
      ))}
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
