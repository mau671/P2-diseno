import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryState, parseAsBoolean } from "nuqs";
import { useDebouncedState } from "@tanstack/react-pacer";

import {
  useInfiniteSearch,
  useSeasonsNow,
  useSeasonsUpcoming,
  useTopAnimeByPopularity,
  useGenres,
  type Anime,
  type Genre,
  type SearchFilters,
  type SearchResult,
} from "@/api/queries";
import { useAnimePastelColor } from "@/hooks/useAnimePastelColor";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { getTranslatedErrorMessage } from "@/lib/error-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, Info, ChevronLeft, ChevronRight, Search, X, Tags, Settings2, Heart } from "lucide-react";

function AnimeCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-36 md:w-44 cursor-pointer group relative">
      <Skeleton className="w-full rounded-lg mb-2 aspect-[2/3]" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

function AnimeListSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: 21 }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}

function AnimeHorizontalSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {Array.from({ length: 8 }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}

const SEARCH_TYPES = ["anime", "manga", "characters", "people", "studios"] as const;
type SearchType = (typeof SEARCH_TYPES)[number];

const SEASONS = ["winter", "spring", "summer", "fall"] as const;
type Season = (typeof SEASONS)[number];

const FORMATS = ["tv", "movie", "ova", "special", "ona", "music", "cm", "pv", "tv_special"] as const;
type Format = (typeof FORMATS)[number];

const STATUSES = ["airing", "complete", "upcoming"] as const;
type Status = (typeof STATUSES)[number];

const TYPE_TO_ENDPOINT: Record<SearchType, string> = {
  anime: "anime",
  manga: "manga",
  characters: "characters",
  people: "people",
  studios: "producers",
};

function AnimeCard({ anime }: { anime: Anime }) {
  const img = anime?.images?.webp?.large_image_url || anime?.images?.jpg?.large_image_url || anime?.images?.webp?.image_url || anime?.images?.jpg?.image_url;
  const title = anime.title;
  const { t } = useTranslation();
  const { pastelColor } = useAnimePastelColor(img);
  const [placement, setPlacement] = React.useState<'left' | 'right'>('right');
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const seasonInfo = React.useMemo(() => {
    if (anime.season && anime.year) {
      return t(`seasons.${anime.season}`) + " " + anime.year;
    }
    if (anime.aired?.from) {
      return new Date(anime.aired.from).getFullYear().toString();
    }
    return null;
  }, [anime.season, anime.year, anime.aired, t]);

  const scoreColor = React.useMemo(() => {
    if (!anime.score) return "#6b7280";
    if (anime.score >= 8) return "#22c55e";
    if (anime.score >= 6) return "#84cc16";
    if (anime.score >= 4) return "#f59e0b";
    return "#ef4444";
  }, [anime.score]);

  const typeInfo = React.useMemo(() => {
    if (!anime.type) return null;
    if (anime.episodes !== undefined && anime.episodes !== null) {
      return `${anime.type.toUpperCase()} • ${anime.episodes} ${t("search.episodes", "episodios")}`;
    }
    return anime.type.toUpperCase();
  }, [anime.type, anime.episodes, t]);

  const updatePlacement = React.useCallback(() => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const cardCenterX = rect.left + rect.width / 2;
    
    setPlacement(cardCenterX < windowWidth / 2 ? 'right' : 'left');
  }, []);

  React.useEffect(() => {
    updatePlacement();
  }, [updatePlacement]);

  React.useEffect(() => {
    if (!isHovered) return;

    const handleScroll = () => {
      updatePlacement();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHovered, updatePlacement]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    updatePlacement();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div 
      className="flex-shrink-0 w-36 md:w-44 cursor-pointer group relative"
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3]">
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
          <TooltipTrigger asChild>
            <button
              className={`absolute bottom-2 right-2 transition-all duration-200 ease-out scale-95 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background/90 hover:scale-110 shadow-lg cursor-pointer ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0'
              }`}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseEnter={() => setIsTooltipOpen(true)}
              onMouseLeave={() => setIsTooltipOpen(false)}
            >
              <Heart className="h-4 w-4 text-foreground transition-colors hover:text-red-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-popover text-popover-foreground border border-border">
            <p>{t("common.addToFavorites")}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div 
        className={`absolute top-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out z-50 pointer-events-none w-72 ${placement === 'right' ? 'left-full ml-4 -translate-x-2 group-hover:translate-x-0' : 'right-full mr-4 translate-x-2 group-hover:translate-x-0'}`}
      >
        <div className="bg-card border rounded-lg p-3 shadow-2xl shadow-black/20 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            {seasonInfo && (
              <span className="text-sm font-medium">{seasonInfo}</span>
            )}
            {anime.score !== undefined && anime.score !== null && (
              <span 
                className="text-sm font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
              >
                {anime.score}
              </span>
            )}
          </div>

          {anime.studios && anime.studios.length > 0 && (
            <div className="text-xs text-muted-foreground mb-1">
              {anime.studios.map((s) => s.name).join(", ")}
            </div>
          )}

          {typeInfo && (
            <div className="text-xs text-muted-foreground mb-2">
              {typeInfo}
            </div>
          )}

          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {anime.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre.mal_id}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ 
                    backgroundColor: `${pastelColor || '#a855f7'}30`, 
                    color: pastelColor || '#a855f7' 
                  }}
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div 
        className="text-sm font-medium line-clamp-2 mt-2 transition-colors"
        style={{ 
          '--hover-color': pastelColor || '#a855f7' 
        } as React.CSSProperties}
      >
        <span className="group-hover:[color:var(--hover-color)] transition-colors">
          {title}
        </span>
      </div>
    </div>
  );
}

function AnimeResultCard({ item }: { item: SearchResult }) {
  const img = item?.images?.webp?.large_image_url || item?.images?.jpg?.large_image_url || item?.images?.webp?.image_url || item?.images?.jpg?.image_url;
  const title = item.title || item.name || item.titles?.[0]?.title;
  const { t } = useTranslation();
  const { pastelColor } = useAnimePastelColor(img);
  const [placement, setPlacement] = React.useState<'left' | 'right'>('right');
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const seasonInfo = React.useMemo(() => {
    if (item.season && item.year) {
      return t(`seasons.${item.season}`) + " " + item.year;
    }
    if (item.aired?.from) {
      return new Date(item.aired.from).getFullYear().toString();
    }
    return null;
  }, [item.season, item.year, item.aired, t]);

  const scoreColor = React.useMemo(() => {
    if (!item.score) return "#6b7280";
    if (item.score >= 8) return "#22c55e";
    if (item.score >= 6) return "#84cc16";
    if (item.score >= 4) return "#f59e0b";
    return "#ef4444";
  }, [item.score]);

  const typeInfo = React.useMemo(() => {
    if (!item.type) return null;
    if (item.episodes !== undefined && item.episodes !== null) {
      return `${item.type.toUpperCase()} • ${item.episodes} ${t("search.episodes", "episodios")}`;
    }
    return item.type.toUpperCase();
  }, [item.type, item.episodes, t]);

  const updatePlacement = React.useCallback(() => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const cardCenterX = rect.left + rect.width / 2;
    
    setPlacement(cardCenterX < windowWidth / 2 ? 'right' : 'left');
  }, []);

  React.useEffect(() => {
    updatePlacement();
  }, [updatePlacement]);

  React.useEffect(() => {
    if (!isHovered) return;

    const handleScroll = () => {
      updatePlacement();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHovered, updatePlacement]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    updatePlacement();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div 
      className="flex-shrink-0 w-36 md:w-44 cursor-pointer group relative"
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3]">
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
          <TooltipTrigger asChild>
            <button
              className={`absolute bottom-2 right-2 transition-all duration-200 ease-out scale-95 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background/90 hover:scale-110 shadow-lg cursor-pointer ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0'
              }`}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseEnter={() => setIsTooltipOpen(true)}
              onMouseLeave={() => setIsTooltipOpen(false)}
            >
              <Heart className="h-4 w-4 text-foreground transition-colors hover:text-red-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-popover text-popover-foreground border border-border">
            <p>{t("common.addToFavorites")}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div 
        className={`absolute top-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out z-50 pointer-events-none w-72 ${placement === 'right' ? 'left-full ml-4 -translate-x-2 group-hover:translate-x-0' : 'right-full mr-4 translate-x-2 group-hover:translate-x-0'}`}
      >
        <div className="bg-card border rounded-lg p-3 shadow-2xl shadow-black/20 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            {seasonInfo && (
              <span className="text-sm font-medium">{seasonInfo}</span>
            )}
            {item.score !== undefined && item.score !== null && (
              <span 
                className="text-sm font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
              >
                {item.score}
              </span>
            )}
          </div>

          {item.studios && item.studios.length > 0 && (
            <div className="text-xs text-muted-foreground mb-1">
              {item.studios.map((s) => s.name).join(", ")}
            </div>
          )}

          {typeInfo && (
            <div className="text-xs text-muted-foreground mb-2">
              {typeInfo}
            </div>
          )}

          {item.genres && item.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre.mal_id}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ 
                    backgroundColor: `${pastelColor || '#a855f7'}30`, 
                    color: pastelColor || '#a855f7' 
                  }}
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div 
        className="text-sm font-medium line-clamp-2 mt-2 transition-colors"
        style={{ 
          '--hover-color': pastelColor || '#a855f7' 
        } as React.CSSProperties}
      >
        <span className="group-hover:[color:var(--hover-color)] transition-colors">
          {title}
        </span>
      </div>
    </div>
  );
}

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
}: {
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
}) {
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

function AnimeSection({ 
  title, 
  infiniteQuery 
}: { 
  title: string; 
  infiniteQuery: ReturnType<typeof useSeasonsNow> | ReturnType<typeof useSeasonsUpcoming> | ReturnType<typeof useTopAnimeByPopularity>;
}) {
  const { t } = useTranslation();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const fetchNextPageRef = React.useRef(infiniteQuery.fetchNextPage);

  // Combine all pages into a single array
  const allItems = React.useMemo(() => {
    return infiniteQuery.data?.pages.flatMap((page) => page.data ?? []) ?? [];
  }, [infiniteQuery.data]);

  const uniqueItems = React.useMemo(() => {
    return Array.from(new Map(allItems.map((anime) => [anime.mal_id, anime])).values());
  }, [allItems]);

  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Update fetchNextPage ref when it changes
  React.useEffect(() => {
    fetchNextPageRef.current = infiniteQuery.fetchNextPage;
  }, [infiniteQuery.fetchNextPage]);

  // Infinite scroll: detect when loadMoreRef is visible or when near the end of scroll
  React.useEffect(() => {
    if (!infiniteQuery.hasNextPage || infiniteQuery.isFetchingNextPage) return;

    const checkScrollPosition = () => {
      if (!scrollRef.current || !loadMoreRef.current) return;
      
      const container = scrollRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const loadMoreElement = loadMoreRef.current;
      
      // Check if loadMore element is visible or if we're near the end (within 200px)
      const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 200;
      const loadMoreRect = loadMoreElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const isVisible = loadMoreRect.left < containerRect.right + 200;
      
      if ((isNearEnd || isVisible) && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
        fetchNextPageRef.current();
      }
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition, { passive: true });
      // Also check on initial load
      checkScrollPosition();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, uniqueItems.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    // Use a smaller scroll amount for smoother animation
    const scrollAmount = scrollRef.current.clientWidth * 0.6;
    
    // Use requestAnimationFrame for smoother scrolling
      const startScroll = scrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? startScroll - scrollAmount 
        : startScroll + scrollAmount;
      const startTime = performance.now();
      const duration = 400;

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const ease = 1 - Math.pow(1 - progress, 3);
      
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = startScroll + (targetScroll - startScroll) * ease;
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
  };

  React.useEffect(() => {
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', updateScrollButtons, { passive: true });
      updateScrollButtons();
    }
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', updateScrollButtons);
      }
    };
  }, [uniqueItems]);

  React.useEffect(() => {
    updateScrollButtons();
  }, [uniqueItems]);

  const isLoading = infiniteQuery.isLoading;
  const isFetchingNextPage = infiniteQuery.isFetchingNextPage;
  const skeletonCount = isFetchingNextPage ? 8 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => scroll('left')} 
            disabled={!canScrollLeft}
            className="h-8 w-8 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("common.scrollLeft")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => scroll('right')} 
            disabled={!canScrollRight}
            className="h-8 w-8 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("common.scrollRight")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isLoading ? (
        <AnimeHorizontalSkeleton />
      ) : (
        <div className="relative">
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          )}
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
            {uniqueItems.map((anime) => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))}
            {skeletonCount > 0 && Array.from({ length: skeletonCount }).map((_, i) => (
              <AnimeCardSkeleton key={`loading-${i}`} />
            ))}
            {infiniteQuery.hasNextPage && <div ref={loadMoreRef} className="w-1 h-full flex-shrink-0" />}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResults({ search }: { search: ReturnType<typeof useInfiniteSearch> }) {
  const observerTarget = React.useRef<HTMLDivElement>(null);
  const fetchNextPageRef = React.useRef(search.fetchNextPage);

  React.useEffect(() => {
    fetchNextPageRef.current = search.fetchNextPage;
  }, [search.fetchNextPage]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && search.hasNextPage && !search.isFetchingNextPage) {
          fetchNextPageRef.current();
        }
      },
      { rootMargin: '100px' }
    );

    const current = observerTarget.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [search.hasNextPage, search.isFetchingNextPage]);
  
  const allItems = search.data?.pages.flatMap((page) => page.data ?? []) ?? [];
  const uniqueItems = Array.from(new Map(allItems.map((item) => [item.mal_id, item])).values());
  const skeletonCount = search.isFetchingNextPage ? 21 : 0;
  
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {uniqueItems.map((item) => (
        <AnimeResultCard key={item.mal_id} item={item} />
      ))}
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <AnimeCardSkeleton key={`skeleton-${i}`} />
      ))}
      {search.hasNextPage && <div ref={observerTarget} />}
    </div>
  );
}

export const Route = createFileRoute("/anime/search")({
  component: SearchAnimePage,
});

function MultiSelectFilter<T>({
  label,
  options,
  selected,
  onChange,
  getOptionLabel,
  getOptionValue,
}: {
  label: string;
  options: T[];
  selected: T[];
  onChange: (value: T[]) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string | number;
}) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
    // Keep dropdown open after selection
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[150px] h-9">
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto min-w-[200px]">
        <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={getOptionValue(option)}
              checked={selected.includes(option)}
              onCheckedChange={() => handleToggle(option)}
              onSelect={(e) => e.preventDefault()}
              className="pr-8"
            >
              <span className="truncate block max-w-[180px]">{getOptionLabel(option)}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchAnimePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [query, setQuery] = useQueryState("q", {
    defaultValue: "",
    clearOnDefault: true,
  });
  const [searchType, setSearchType] = useQueryState<SearchType>("type", {
    defaultValue: "anime",
    parse: (value) => SEARCH_TYPES.includes(value as SearchType) ? (value as SearchType) : "anime",
    serialize: (value) => value,
    clearOnDefault: true,
  });

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
    parse: (value) => (value && SEASONS.includes(value as Season) ? (value as Season) : null),
    serialize: (value) => value || "",
  });

  const [selectedFormats, setSelectedFormats] = useQueryState<Format[]>("formats", {
    defaultValue: [],
    clearOnDefault: true,
    parse: (value) => {
      if (!value) return [];
      const parsed = value.split(',').filter((f) => FORMATS.includes(f as Format));
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
      const parsed = value.split(',').filter((s) => STATUSES.includes(s as Status));
      return parsed as Status[];
    },
    serialize: (value) => value.join(','),
    eq: (a, b) => a.length === b.length && a.every((val, i) => val === b[i]),
  });

  const [allowNsfw, setAllowNsfw] = useQueryState("nsfw", parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true }));

  const [showMoreFilters, setShowMoreFilters] = React.useState(false);

  const [input, setInput] = React.useState(query);
  const [debouncedInput, setDebouncedInput, debouncer] = useDebouncedState(input, {
    wait: 500,
  });

  const isClearing = React.useRef(false);

  // Sync input with query from URL (for browser navigation)
  React.useEffect(() => {
    if (!isClearing.current) {
      setInput(query || "");
    }
  }, [query]);

  React.useEffect(() => {
    setDebouncedInput(input);
  }, [input, setDebouncedInput]);

  React.useEffect(() => {
    const trimmed = debouncedInput.trim();
    // Only update query if:
    // 1. Not currently clearing
    // 2. The trimmed value differs from current query
    // 3. Either the trimmed value is empty (to clear) or has more than 2 characters (to search)
    if (!isClearing.current && trimmed !== query && (trimmed.length === 0 || trimmed.length > 2)) {
      setQuery(trimmed || null);
    }
    if (isClearing.current) {
      isClearing.current = false;
    }
  }, [debouncedInput, query, setQuery]);

  const searchEndpoint = TYPE_TO_ENDPOINT[searchType];

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

  const search = useInfiniteSearch(query, searchEndpoint, !allowNsfw, searchFilters);

  const genres = useGenres();

  const selectedGenreObjects = React.useMemo(() => {
    const genreList = genres.data || [];
    return selectedGenres.map(id => genreList.find(g => g.mal_id === id)).filter((g): g is Genre => g !== undefined);
  }, [selectedGenres, genres]);

  const trending = useSeasonsNow(true, query.trim().length === 0);
  const upcoming = useSeasonsUpcoming(true, query.trim().length === 0);
  const allTimePopular = useTopAnimeByPopularity(20, query.trim().length === 0);

  // Check if there are any active filters
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleClearSearch = () => {
    // Cancel any pending debounced updates to prevent race conditions
    debouncer.cancel();
    
    isClearing.current = true;
    setInput("");

    // If there are no active filters, navigate to clean URL (no query params)
    // Otherwise, just clear the query parameter but keep other filters
    if (!hasActiveFilters) {
      // Clear the query parameter and navigate to clean URL
      setQuery(null);
      // Use navigate to ensure URL is completely clean (nuqs will handle clearing params with clearOnDefault)
      navigate({
        to: "/anime/search",
        search: {},
        replace: true,
      });
    } else {
      // Keep filters but clear query
      setQuery(null);
    }
  };

  const handleClearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedYear(null);
    setSelectedSeason(null);
    setSelectedFormats([]);
    setSelectedStatuses([]);
    setAllowNsfw(false);
  };

  const handleClearGenre = (genreId: number) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genreId));
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

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type);
  };

  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear; i >= 1990; i--) {
      years.push(i);
    }
    return years;
  }, []);

  const [yearDropdownOpen, setYearDropdownOpen] = React.useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = React.useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = React.useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{t("sections.search")}</h1>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-2xl font-semibold h-9 px-2 hover:bg-accent">
              <span>{t(`search.types.${searchType}`)}</span>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[150px]">
            {SEARCH_TYPES.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => handleTypeChange(type)}
                className={searchType === type ? "bg-accent" : "text-base"}
              >
                <span className="truncate block max-w-[130px]">{t(`search.types.${type}`)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={t("search.placeholder")}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <MultiSelectFilter
            label={t("search.filters.genres")}
            options={genres.data || []}
            selected={selectedGenreObjects}
            onChange={(genres) => setSelectedGenres(genres.map(g => g.mal_id))}
            getOptionLabel={(g) => g.name}
            getOptionValue={(g) => g.mal_id}
          />

          <DropdownMenu modal={false} open={yearDropdownOpen} onOpenChange={setYearDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px] justify-between h-9">
                <span className="truncate">
                  {selectedYear ? selectedYear : t("search.filters.year")}
                </span>
                <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto min-w-[150px]">
              <DropdownMenuLabel className="truncate max-w-[140px]">{t("search.filters.year")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {yearOptions.map((year) => (
                  <DropdownMenuCheckboxItem
                    key={year}
                    checked={selectedYear === year}
                    onCheckedChange={(checked) => setSelectedYear(checked ? year : null)}
                    onSelect={(e) => e.preventDefault()}
                    className="pr-8"
                  >
                    <span className="truncate block max-w-[120px]">{year}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu modal={false} open={seasonDropdownOpen} onOpenChange={setSeasonDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px] justify-between h-9">
                <span className="truncate">
                  {selectedSeason ? t(`search.seasons.${selectedSeason}`) : t("search.filters.season")}
                </span>
                <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[150px]">
              <DropdownMenuLabel className="truncate max-w-[140px]">{t("search.filters.season")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {SEASONS.map((season) => (
                  <DropdownMenuCheckboxItem
                    key={season}
                    checked={selectedSeason === season}
                    onCheckedChange={(checked) => setSelectedSeason(checked ? season : null)}
                    onSelect={(e) => e.preventDefault()}
                    className="pr-8"
                  >
                    <span className="truncate block max-w-[120px]">{t(`search.seasons.${season}`)}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu modal={false} open={formatDropdownOpen} onOpenChange={setFormatDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px] justify-between h-9">
                <span className="truncate">
                  {selectedFormats.length > 0
                    ? t(`search.formats.${selectedFormats[0]}`)
                    : t("search.filters.format")}
                </span>
                <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[150px]">
              <DropdownMenuLabel className="truncate max-w-[140px]">{t("search.filters.format")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {FORMATS.map((format) => (
                  <DropdownMenuCheckboxItem
                    key={format}
                    checked={selectedFormats.includes(format)}
                    onCheckedChange={(checked) => setSelectedFormats(checked ? [format] : [])}
                    onSelect={(e) => e.preventDefault()}
                    className="pr-8"
                  >
                    <span className="truncate block max-w-[120px]">{t(`search.formats.${format}`)}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu modal={false} open={statusDropdownOpen} onOpenChange={setStatusDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px] justify-between h-9">
                <span className="truncate">
                  {selectedStatuses.length > 0
                    ? t(`search.statuses.${selectedStatuses[0]}`)
                    : t("search.filters.status")}
                </span>
                <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[150px]">
              <DropdownMenuLabel className="truncate max-w-[140px]">{t("search.filters.status")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {STATUSES.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={(checked) => setSelectedStatuses(checked ? [status] : [])}
                    onSelect={(e) => e.preventDefault()}
                    className="pr-8"
                  >
                    <span className="truncate block max-w-[120px]">{t(`search.statuses.${status}`)}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={showMoreFilters ? "bg-accent" : ""}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showMoreFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Switch
              id="nsfw-toggle"
              checked={allowNsfw}
              onCheckedChange={setAllowNsfw}
            />
            <Label htmlFor="nsfw-toggle" className="text-sm">
              {t("search.filters.nsfw")}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("search.allowNsfw")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {query.trim().length === 0 && !hasActiveFilters ? (
        <div className="space-y-8 pb-8">
          <AnimeSection
            title={t("sections.trendingNow")}
            infiniteQuery={trending}
          />
          <AnimeSection
            title={t("sections.upcomingNextSeason")}
            infiniteQuery={upcoming}
          />
          <AnimeSection
            title={t("sections.allTimePopular")}
            infiniteQuery={allTimePopular}
          />
        </div>
      ) : (
        <div className="space-y-8 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <SearchTags
                query={query}
                onClear={handleClearSearch}
                selectedGenres={selectedGenres}
                selectedYear={selectedYear}
                selectedSeason={selectedSeason}
                selectedFormats={selectedFormats}
                selectedStatuses={selectedStatuses}
                genres={genres.data || []}
                onClearGenre={handleClearGenre}
                onClearYear={handleClearYear}
                onClearSeason={handleClearSeason}
                onClearFormats={handleClearFormats}
                onClearStatuses={handleClearStatuses}
                onClearAll={handleClearAllFilters}
              />
            </div>
            {search.isLoading ? (
              <AnimeListSkeleton />
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
      )}
    </div>
  );
}
