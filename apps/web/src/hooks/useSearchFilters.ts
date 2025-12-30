import * as React from "react";
import { useQueryState, parseAsBoolean } from "nuqs";
import type { Season, Format, Status, SearchType } from "@/lib/search-constants";

function useSearchFilters() {
  const [selectedGenres, setSelectedGenres] = useQueryState<number[]>("genres", {
    defaultValue: [],
    clearOnDefault: true,
    parse: (value) => {
      if (!value) return [];
      return value.split(',').map(Number).filter((n) => !isNaN(n));
    },
    serialize: (value) => value.join(','),
    eq: (a, b) => a.length === b.length && a.every((val, i) => val === b[i]),
  });

  const [selectedYear, setSelectedYear] = useQueryState<number | null>("year", {
    defaultValue: null,
    clearOnDefault: true,
    parse: (value) => value ? parseInt(value, 10) : null,
    serialize: (value) => value?.toString() ?? "",
  });

  const [selectedSeason, setSelectedSeason] = useQueryState<Season | null>("season", {
    defaultValue: null,
    clearOnDefault: true,
    parse: (value) => (value && ["winter", "spring", "summer", "fall"].includes(value as Season) ? (value as Season) : null),
    serialize: (value) => value || "",
  });

  const [selectedFormats, setSelectedFormats] = useQueryState<Format[]>("formats", {
    defaultValue: [],
    clearOnDefault: true,
    parse: (value) => {
      if (!value) return [];
      const parsed = value.split(',').filter((f) => ["tv", "movie", "ova", "special", "ona", "music", "cm", "pv", "tv_special"].includes(f as Format));
      return parsed as Format[];
    },
    serialize: (value) => value.join(','),
    eq: (a, b) => a.length === b.length && a.every((val, i) => val === b[i]),
  });

  const [selectedStatuses, setSelectedStatuses] = useQueryState<Status[]>("statuses", {
    defaultValue: [],
    clearOnDefault: true,
    parse: (value) => {
      if (!value) return [];
      const parsed = value.split(',').filter((s) => ["airing", "complete", "upcoming"].includes(s as Status));
      return parsed as Status[];
    },
    serialize: (value) => value.join(','),
    eq: (a, b) => a.length === b.length && a.every((val, i) => val === b[i]),
  });

  const [allowNsfw, setAllowNsfw] = useQueryState("nsfw", parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true }));

  const [searchType, setSearchType] = useQueryState<SearchType>("type", {
    defaultValue: "anime",
    parse: (value) => ["anime", "manga", "characters", "people", "studios"].includes(value as SearchType) ? (value as SearchType) : "anime",
    serialize: (value) => value,
    clearOnDefault: true,
  });

  const hasActiveFilters = React.useMemo(() => {
    return (
      selectedGenres.length > 0 ||
      selectedYear !== null ||
      selectedSeason !== null ||
      selectedFormats.length > 0 ||
      selectedStatuses.length > 0 ||
      allowNsfw === true ||
      searchType !== "anime"
    );
  }, [selectedGenres, selectedYear, selectedSeason, selectedFormats, selectedStatuses, allowNsfw, searchType]);

  const handleClearAll = () => {
    setSelectedGenres([]);
    setSelectedYear(null);
    setSelectedSeason(null);
    setSelectedFormats([]);
    setSelectedStatuses([]);
    setAllowNsfw(false);
  };

  return {
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
  };
}

export { useSearchFilters };
