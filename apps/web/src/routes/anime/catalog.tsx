import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";

import { useSeasonAnime, type Anime } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {getCurrentSeason, getPreviousSeason, getNextSeason, isSeasonInFuture, type SeasonInfo} from "@/lib/season-utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQueryState, parseAsBoolean } from "nuqs";
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
      className="rounded-xl border p-4 group"
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
              loading="lazy"
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

        <div className="min-w-0">
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

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showMax = 7; 

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getPageNumbers().map((page, index) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
              ...
            </span>
          );
        }

        const pageNum = page as number;
        return (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            disabled={isLoading}
            className="min-w-[40px]"
          >
            {pageNum}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CatalogPage() {
  const { t } = useTranslation();
  const [currentSeason, setCurrentSeason] = React.useState<SeasonInfo>(() => getCurrentSeason());
  const [page, setPage] = React.useState(1);
  const [allowNsfw, setAllowNsfw] = useQueryState("nsfw", parseAsBoolean.withDefault(false));
  
  const { data, isLoading, isError, error, refetch } = useSeasonAnime(
    currentSeason.year,
    currentSeason.season,
    page,
    !allowNsfw
  );

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, currentSeason]);

  const isEmpty = !isLoading && !isError && (data?.data?.length ?? 0) === 0;
  const totalPages = data?.pagination?.last_visible_page ?? 1;

  const nextSeason = getNextSeason(currentSeason.year, currentSeason.season);
  const hasNextSeason = !isSeasonInFuture(nextSeason.year, nextSeason.season);

  const handlePreviousSeason = () => {
    const prev = getPreviousSeason(currentSeason.year, currentSeason.season);
    setCurrentSeason(prev);
    setPage(1);
  };

  const handleNextSeason = () => {
    if (hasNextSeason) {
      setCurrentSeason(nextSeason);
      setPage(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const seasonName = t(`seasons.${currentSeason.season}`);

  

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {seasonName} {currentSeason.year}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("catalog.description")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="nsfw-toggle"
          checked={allowNsfw}
          onCheckedChange={setAllowNsfw}
        />
        <Label htmlFor="nsfw-toggle" className="text-sm">
          {t("search.allowNsfw", "Allow NSFW content")}
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePreviousSeason}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("catalog.previousSeason")}
        </Button>

        {hasNextSeason && (
          <Button variant="outline" size="sm" onClick={handleNextSeason}>
            {t("catalog.nextSeason")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <AnimeListSkeleton />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : t("common.loadError")}
          onRetry={refetch}
        />
      ) : isEmpty ? (
        <EmptyState message={t("catalog.empty")} />
      ) : (
        <>
          <AnimeList items={data?.data ?? []} />

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/anime/catalog")({
  component: CatalogPage,
});