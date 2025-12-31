import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { SearchFilters } from "@/api/queries";
import {
  useInfiniteSearch,
  useGenres,
  useSeasonsNow,
  useSeasonsUpcoming,
  useTopAnimeByPopularity,
} from "@/api/queries";
import type { Genre } from "@/api/queries";
import { TYPE_TO_ENDPOINT } from "@/lib/search-constants";
import { SearchHeader } from "@/components/search/SearchHeader";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFiltersRow } from "@/components/search/SearchFiltersRow";
import { MoreFilters } from "@/components/search/MoreFilters";
import { SearchResultsContainer } from "@/components/search/SearchResultsContainer";
import { AnimeSection } from "@/components/anime/AnimeSection";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

export const Route = createFileRoute("/anime/search")({
  component: SearchAnimePage,
});

function SearchAnimePage() {
  const { t } = useTranslation();
  const genres = useGenres();

  const {
    selectedGenres,
    setSelectedGenres,
    selectedYear,
    setSelectedYear,
    selectedSeason,
    setSelectedSeason,
    selectedFormats,
    setSelectedFormats,
    selectedStatuses,
    setSelectedStatuses,
    allowNsfw,
    setAllowNsfw,
    searchType,
    setSearchType,
    hasActiveFilters,
    handleClearAll,
  } = useSearchFilters();

  const { query, input, setInput, handleClearSearch, setHasActiveFilters } = useDebouncedSearch();

  React.useEffect(() => {
    setHasActiveFilters(hasActiveFilters);
  }, [hasActiveFilters, setHasActiveFilters]);

  const searchFilters: SearchFilters = React.useMemo(() => {
    const filters: SearchFilters = {
      genres: selectedGenres,
      sfw: !allowNsfw,
    };

    if (selectedFormats.length > 0) {
      filters.type = selectedFormats[0];
    }

    if (selectedStatuses.length > 0) {
      filters.status = selectedStatuses[0];
    }

    if (selectedYear) {
      filters.year = selectedYear;
    }

    if (selectedSeason && selectedYear) {
      filters.season = selectedSeason;
    }

    return filters;
  }, [selectedGenres, selectedFormats, selectedStatuses, selectedYear, selectedSeason, allowNsfw]);

  const search = useInfiniteSearch(query, TYPE_TO_ENDPOINT[searchType], !allowNsfw, searchFilters);

  const selectedGenreObjects = React.useMemo(() => {
    const genreList = genres.data || [];
    return selectedGenres
      .map((id) => genreList.find((g) => g.mal_id === id))
      .filter((g): g is Genre => g !== undefined);
  }, [selectedGenres, genres]);

  const trending = useSeasonsNow(true, query.trim().length === 0 && !hasActiveFilters);
  const upcoming = useSeasonsUpcoming(true, query.trim().length === 0 && !hasActiveFilters);
  const allTimePopular = useTopAnimeByPopularity(20, query.trim().length === 0 && !hasActiveFilters);

  const [showMoreFilters, setShowMoreFilters] = React.useState(false);

  const handleClearGenre = (genreId: number) => {
    setSelectedGenres(selectedGenres.filter((g) => g !== genreId));
  };

  const handleClearYear = () => {
    setSelectedYear(null);
    setSelectedSeason(null);
  };

  const handleClearSeason = () => {
    setSelectedSeason(null);
  };

  const handleClearFormats = () => {
    setSelectedFormats([]);
  };

  const handleClearStatuses = () => {
    setSelectedStatuses([]);
  };

  return (
    <div className="space-y-6">
      <SearchHeader type={searchType} onTypeChange={setSearchType} />

      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <SearchBar input={input} setInput={setInput} onClear={handleClearSearch} />

        <SearchFiltersRow
          genres={genres.data || []}
          selectedGenres={selectedGenreObjects}
          setSelectedGenres={(genresSelected) => setSelectedGenres(genresSelected.map((g) => g.mal_id))}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          selectedFormats={selectedFormats}
          setSelectedFormats={setSelectedFormats}
          selectedStatuses={selectedStatuses}
          setSelectedStatuses={setSelectedStatuses}
          showMoreFilters={showMoreFilters}
          onToggleMore={() => setShowMoreFilters(!showMoreFilters)}
        />
      </div>

      {showMoreFilters && <MoreFilters allowNsfw={allowNsfw} onNsfwChange={setAllowNsfw} />}

      {query.trim().length === 0 && !hasActiveFilters ? (
        <div className="space-y-8 pb-8">
          <AnimeSection title={t("sections.trendingNow")} infiniteQuery={trending} />
          <AnimeSection title={t("sections.upcomingNextSeason")} infiniteQuery={upcoming} />
          <AnimeSection title={t("sections.allTimePopular")} infiniteQuery={allTimePopular} />
        </div>
      ) : (
        <SearchResultsContainer
          query={query}
          genres={genres.data || []}
          selectedGenres={selectedGenres}
          selectedYear={selectedYear}
          selectedSeason={selectedSeason}
          selectedFormats={selectedFormats}
          selectedStatuses={selectedStatuses}
          onClearQuery={handleClearSearch}
          onClearGenre={handleClearGenre}
          onClearYear={handleClearYear}
          onClearSeason={handleClearSeason}
          onClearFormats={handleClearFormats}
          onClearStatuses={handleClearStatuses}
          onClearAll={handleClearAll}
          search={search}
          searchType={searchType}
        />
      )}
    </div>
  );
}

