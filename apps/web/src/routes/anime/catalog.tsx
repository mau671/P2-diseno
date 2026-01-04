import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useSeasonAnime } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Button } from "@/components/ui/button";
import {getCurrentSeason, getPreviousSeason, getNextSeason, isSeasonInFuture, type SeasonInfo} from "@/lib/season-utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQueryState, parseAsBoolean } from "nuqs";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";

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
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {Array.from({ length: 21 }).map((_, i) => (
            <AnimeCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : t("common.loadError")}
          onRetry={refetch}
        />
      ) : isEmpty ? (
        <EmptyState message={t("catalog.empty")} />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {data?.data?.map((item) => (
              <AnimeCard key={item.mal_id} anime={item} />
            ))}
          </div>

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