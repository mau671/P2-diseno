import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryState, parseAsBoolean } from "nuqs";

import {
  useInfiniteSearch,
  useSeasonsNow,
  useSeasonsUpcoming,
  useTopAnimeByPopularity,
  type Anime,
} from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
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
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, Info, ChevronLeft, ChevronRight, Search, X, Tags } from "lucide-react";

function useDebounce<T>(value: T, delay: number): [T, () => void] {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    timeoutRef.current = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  const flush = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDebouncedValue(value);
  }, [value]);

  return [debouncedValue, flush];
}

function AnimeCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-36 md:w-44">
      <Skeleton className="w-full rounded-lg mb-2 aspect-[2/3]" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

function AnimeListSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
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

  return (
    <div className="flex-shrink-0 w-36 md:w-44 cursor-pointer group">
      <div className="relative overflow-hidden rounded-lg mb-2 bg-muted aspect-[2/3]">
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 animate-fade-in"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        {anime.score !== undefined && anime.score !== null && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {anime.score}
          </div>
        )}
      </div>
      <div className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </div>
    </div>
  );
}

function AnimeResultCard({ item }: { item: any }) {
  const img = item?.images?.webp?.large_image_url || item?.images?.jpg?.large_image_url || item?.images?.webp?.image_url || item?.images?.jpg?.image_url;
  const title = item.title || item.name || item.titles?.[0]?.title;

  return (
    <div className="flex-shrink-0 w-36 md:w-44 cursor-pointer group">
      <div className="relative overflow-hidden rounded-lg mb-2 bg-muted aspect-[2/3]">
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 animate-fade-in"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        {item.score !== undefined && item.score !== null && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {item.score}
          </div>
        )}
      </div>
      <div className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </div>
    </div>
  );
}

function SearchTags({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Tags className="h-5 w-5 text-muted-foreground" />
      {query && (
        <div className="group relative inline-flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-md text-sm transition-colors cursor-pointer overflow-hidden w-max">
          <div className="flex items-center gap-1">
            <Search className="h-3 w-3" />
            <span className="max-w-[200px] truncate flex items-center">{query}</span>
          </div>
          <button
            onClick={onClear}
            className="opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden transition-all ml-1 hover:text-destructive flex-shrink-0 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function AnimeSection({ title, items, isLoading }: { title: string; items: Anime[]; isLoading: boolean }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const uniqueItems = React.useMemo(() => Array.from(new Map(items.map((anime) => [anime.mal_id, anime])).values()), [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 500;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => scroll('left')} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll('right')} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isLoading ? (
        <AnimeHorizontalSkeleton />
      ) : (
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
          {uniqueItems.map((anime) => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResults({ search }: { search: ReturnType<typeof useInfiniteSearch> }) {
  const observerTarget = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && search.hasNextPage && !search.isFetchingNextPage) {
          search.fetchNextPage();
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
  }, [search.hasNextPage, search.isFetchingNextPage, search.fetchNextPage]);
  
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

function SearchAnimePage() {
  const { t } = useTranslation();

  const [query, setQuery] = useQueryState("q", { defaultValue: "" });
  const [searchType, setSearchType] = useQueryState<SearchType>("type", {
    defaultValue: "anime",
    parse: (value) => SEARCH_TYPES.includes(value as SearchType) ? (value as SearchType) : "anime",
    serialize: (value) => value,
  });
  const [allowNsfw, setAllowNsfw] = useQueryState("nsfw", parseAsBoolean.withDefault(false));

  const [input, setInput] = React.useState(query);

  const [debouncedInput, flushDebounce] = useDebounce(input, 500);
  const isClearing = React.useRef(false);

  React.useEffect(() => {
    const trimmed = debouncedInput.trim();
    if (!isClearing.current && trimmed !== query) {
      setQuery(trimmed || null);
    }
    if (isClearing.current) {
      isClearing.current = false;
    }
  }, [debouncedInput, query, setQuery]);

  const searchEndpoint = TYPE_TO_ENDPOINT[searchType];
  const search = useInfiniteSearch(query, searchEndpoint, !allowNsfw);

  const trending = useSeasonsNow(1, true, query.trim().length === 0);
  const upcoming = useSeasonsUpcoming(1, true, query.trim().length === 0);
  const allTimePopular = useTopAnimeByPopularity(1, 20, query.trim().length === 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleClearSearch = () => {
    isClearing.current = true;
    setInput("");
    setQuery(null);
    flushDebounce();
  };

  const handleClearAllTags = () => {
    isClearing.current = true;
    setInput("");
    setQuery(null);
    flushDebounce();
  };

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{t("sections.search")}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-2xl font-semibold h-9 px-2 hover:bg-accent">
              <span>{t(`search.types.${searchType}`)}</span>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SEARCH_TYPES.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => handleTypeChange(type)}
                className={searchType === type ? "bg-accent" : "text-base"}
              >
                {t(`search.types.${type}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={""}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="nsfw-toggle"
            checked={allowNsfw}
            onCheckedChange={setAllowNsfw}
          />
          <Label htmlFor="nsfw-toggle" className="text-sm">
            NSFW
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("search.allowNsfw", "Allow NSFW content")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {query.trim().length === 0 ? (
        <div className="space-y-8 pb-8">
          <AnimeSection
            title="Trending now"
            items={trending.data?.data ?? []}
            isLoading={trending.isLoading}
          />
          <AnimeSection
            title="Upcoming next season"
            items={upcoming.data?.data ?? []}
            isLoading={upcoming.isLoading}
          />
          <AnimeSection
            title="All time popular"
            items={allTimePopular.data?.data ?? []}
            isLoading={allTimePopular.isLoading}
          />
        </div>
      ) : (
        <div className="space-y-8 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4 group">
              <SearchTags query={query} onClear={handleClearSearch} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllTags}
                className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Clear all
              </Button>
            </div>
            {search.isLoading ? (
              <AnimeListSkeleton />
            ) : search.isError ? (
              <ErrorState
                message={search.error instanceof Error ? search.error.message : t("search.error")}
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
