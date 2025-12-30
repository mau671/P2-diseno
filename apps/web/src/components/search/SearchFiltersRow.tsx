import * as React from "react";
import { useTranslation } from "react-i18next";
import type { Genre } from "@/api/queries";
import type { Season, Format, Status } from "@/lib/search-constants";
import { SearchMultiSelectFilter } from "./SearchMultiSelectFilter";
import { SearchFilterDropdown } from "./SearchFilterDropdown";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

type SearchFiltersRowProps = {
  genres: Genre[];
  selectedGenres: Genre[];
  setSelectedGenres: (genres: Genre[]) => void;
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  selectedSeason: Season | null;
  setSelectedSeason: (season: Season | null) => void;
  selectedFormats: Format[];
  setSelectedFormats: (formats: Format[]) => void;
  selectedStatuses: Status[];
  setSelectedStatuses: (statuses: Status[]) => void;
  showMoreFilters: boolean;
  onToggleMore: () => void;
};

function SearchFiltersRow({
  genres,
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
  showMoreFilters,
  onToggleMore,
}: SearchFiltersRowProps) {
  const { t } = useTranslation();

  const yearOptions: number[] = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear; i >= 1990; i--) {
      years.push(i);
    }
    return years;
  }, []);

  return (
    <div className="flex flex-wrap gap-2 w-full md:w-auto">
      <SearchMultiSelectFilter
        label={t("search.filters.genres")}
        options={genres}
        selected={selectedGenres}
        onChange={setSelectedGenres}
        getOptionLabel={(g) => g.name}
        getOptionValue={(g) => g.mal_id}
      />

      <SearchFilterDropdown
        labelKey="search.filters.year"
        options={yearOptions}
        selected={selectedYear}
        onSelect={setSelectedYear}
        getLabel={(y) => y.toString()}
        getValue={(y) => y}
      />

      <SearchFilterDropdown
        labelKey="search.filters.season"
        options={["winter", "spring", "summer", "fall"] as Season[]}
        selected={selectedSeason}
        onSelect={setSelectedSeason}
        getLabel={(s) => t(`search.seasons.${s}`)}
        getValue={(s) => s}
      />

      <SearchFilterDropdown
        labelKey="search.filters.format"
        options={["tv", "movie", "ova", "special", "ona", "music", "cm", "pv", "tv_special"] as Format[]}
        selected={selectedFormats.length > 0 ? selectedFormats[0] : null}
        onSelect={(format) => setSelectedFormats(format ? [format] : [])}
        getLabel={(f) => t(`search.formats.${f}`)}
        getValue={(f) => f}
      />

      <SearchFilterDropdown
        labelKey="search.filters.status"
        options={["airing", "complete", "upcoming"] as Status[]}
        selected={selectedStatuses.length > 0 ? selectedStatuses[0] : null}
        onSelect={(status) => setSelectedStatuses(status ? [status] : [])}
        getLabel={(s) => t(`search.statuses.${s}`)}
        getValue={(s) => s}
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleMore}
        className={showMoreFilters ? "bg-accent" : ""}
      >
        <Settings2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export { SearchFiltersRow };
