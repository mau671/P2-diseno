import * as React from "react";
import { useTranslation } from "react-i18next";
import type { Genre } from "@/api/queries";
import type { Season, Format, Status } from "@/lib/search-constants";
import { X, Tags } from "lucide-react";

type SearchTagsProps = {
  query: string;
  onClear: () => void;
  selectedGenres: number[];
  selectedYear: number | null;
  selectedSeason: Season | null;
  selectedFormats: Format[];
  selectedStatuses: Status[];
  genres: Genre[];
  onClearGenre: (genreId: number) => void;
  onClearYear: () => void;
  onClearSeason: () => void;
  onClearFormats: () => void;
  onClearStatuses: () => void;
  onClearAll: () => void;
};

function SearchTags({
  query,
  onClear,
  selectedGenres,
  selectedYear,
  selectedSeason,
  selectedFormats,
  selectedStatuses,
  genres,
  onClearGenre,
  onClearYear,
  onClearSeason,
  onClearFormats,
  onClearStatuses,
  onClearAll,
}: SearchTagsProps) {
  const { t } = useTranslation();

  const genreObjects = React.useMemo(() => {
    return selectedGenres.map(id => genres.find(g => g.mal_id === id)).filter((g): g is Genre => g !== undefined);
  }, [selectedGenres, genres]);

  const hasAnyFilters = query || selectedGenres.length > 0 || selectedYear !== null || selectedSeason !== null || selectedFormats.length > 0 || selectedStatuses.length > 0;

  return (
    <div className="group flex items-center gap-2 flex-wrap">
      <Tags className="h-5 w-5 text-muted-foreground" />

      {query && (
        <div className="group/tag relative inline-flex items-center gap-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-md text-sm transition-colors cursor-pointer overflow-hidden">
          <span className="max-w-[200px] truncate">{query}</span>
          <button
            onClick={onClear}
            className="opacity-0 group-hover/tag:opacity-100 w-0 group-hover/tag:w-auto group-hover/tag:ml-2 overflow-hidden transition-all hover:text-destructive flex-shrink-0 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {genreObjects.map((genre) => (
        <div
          key={genre.mal_id}
          className="group/tag relative inline-flex items-center gap-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-md text-sm transition-colors cursor-pointer overflow-hidden"
        >
          <span className="max-w-[200px] truncate">{genre.name}</span>
          <button
            onClick={() => onClearGenre(genre.mal_id)}
            className="opacity-0 group-hover/tag:opacity-100 w-0 group-hover/tag:w-auto group-hover/tag:ml-2 overflow-hidden transition-all hover:text-destructive flex-shrink-0 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {selectedYear && (
        <div className="group/tag relative inline-flex items-center gap-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-md text-sm transition-colors cursor-pointer overflow-hidden">
          <span>{t("search.filters.year")}: {selectedYear}</span>
          <button
            onClick={onClearYear}
            className="opacity-0 group-hover/tag:opacity-100 w-0 group-hover/tag:w-auto group-hover/tag:ml-2 overflow-hidden transition-all hover:text-destructive flex-shrink-0 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {selectedSeason && selectedYear && (
        <div className="group/tag relative inline-flex items-center gap-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-md text-sm transition-colors cursor-pointer overflow-hidden">
          <span>{t(`search.seasons.${selectedSeason}`)}</span>
          <button
            onClick={onClearSeason}
            className="opacity-0 group-hover/tag:opacity-100 w-0 group-hover/tag:w-auto group-hover/tag:ml-2 overflow-hidden transition-all hover:text-destructive flex-shrink-0 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {selectedFormats.map((format) => (
        <div
          key={format}
          className="group/tag relative inline-flex items-center gap-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-md text-sm transition-colors cursor-pointer overflow-hidden"
        >
          <span>{t(`search.formats.${format}`)}</span>
          <button
            onClick={onClearFormats}
            className="opacity-0 group-hover/tag:opacity-100 w-0 group-hover/tag:w-auto group-hover/tag:ml-2 overflow-hidden transition-all hover:text-destructive flex-shrink-0 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {selectedStatuses.map((status) => (
        <div
          key={status}
          className="group/tag relative inline-flex items-center gap-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-md text-sm transition-colors cursor-pointer overflow-hidden"
        >
          <span>{t(`search.statuses.${status}`)}</span>
          <button
            onClick={onClearStatuses}
            className="opacity-0 group-hover/tag:opacity-100 w-0 group-hover/tag:w-auto group-hover/tag:ml-2 overflow-hidden transition-all hover:text-destructive flex-shrink-0 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {hasAnyFilters && (
        <button
          onClick={onClearAll}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-md text-sm transition-colors cursor-pointer"
        >
          {t("search.clearAll")}
        </button>
      )}
    </div>
  );
}

export { SearchTags };
