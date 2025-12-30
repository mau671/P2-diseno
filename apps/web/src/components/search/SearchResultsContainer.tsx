import { useTranslation } from "react-i18next";
import type { Genre } from "@/api/queries";
import type { Season, Format, Status } from "@/lib/search-constants";
import { SearchTags } from "./SearchTags";
import { SearchResults } from "./SearchResults";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { getTranslatedErrorMessage } from "@/lib/error-utils";

type SearchResultsContainerProps = {
  query: string;
  genres: Genre[];
  selectedGenres: number[];
  selectedYear: number | null;
  selectedSeason: Season | null;
  selectedFormats: Format[];
  selectedStatuses: Status[];
  onClearQuery: () => void;
  onClearGenre: (genreId: number) => void;
  onClearYear: () => void;
  onClearSeason: () => void;
  onClearFormats: () => void;
  onClearStatuses: () => void;
  onClearAll: () => void;
  search: ReturnType<typeof import("@/api/queries").useInfiniteSearch>;
};

function SearchResultsContainer({
  query,
  genres,
  selectedGenres,
  selectedYear,
  selectedSeason,
  selectedFormats,
  selectedStatuses,
  onClearQuery,
  onClearGenre,
  onClearYear,
  onClearSeason,
  onClearFormats,
  onClearStatuses,
  onClearAll,
  search,
}: SearchResultsContainerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <SearchTags
            query={query}
            onClear={onClearQuery}
            selectedGenres={selectedGenres}
            selectedYear={selectedYear}
            selectedSeason={selectedSeason}
            selectedFormats={selectedFormats}
            selectedStatuses={selectedStatuses}
            genres={genres}
            onClearGenre={onClearGenre}
            onClearYear={onClearYear}
            onClearSeason={onClearSeason}
            onClearFormats={onClearFormats}
            onClearStatuses={onClearStatuses}
            onClearAll={onClearAll}
          />
        </div>
        {search.isLoading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-36 md:w-44 cursor-pointer group relative">
                <div className="w-full rounded-lg mb-2 aspect-[2/3] bg-muted animate-pulse" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : search.isError ? (
          <ErrorState
            message={t(getTranslatedErrorMessage(search.error, "search.error"))}
            onRetry={() => search.refetch()}
          />
        ) : search.data?.pages.flatMap((page) => page.data ?? []).length === 0 ? (
          <EmptyState message={t("search.empty")} />
        ) : (
          <SearchResults search={search} />
        )}
      </div>
    </div>
  );
}

export { SearchResultsContainer };
