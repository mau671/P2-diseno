import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeCard } from "./AnimeCard";
import { AnimeCardSkeleton, AnimeHorizontalSkeleton } from "./AnimeCardSkeleton";
import { useAnimatedScroll } from "@/hooks/useAnimatedScroll";

type AnimeSectionProps = {
  title: string;
  infiniteQuery: ReturnType<typeof import("@/api/queries").useSeasonsNow> | 
                 ReturnType<typeof import("@/api/queries").useSeasonsUpcoming> | 
                 ReturnType<typeof import("@/api/queries").useTopAnimeByPopularity>;
};

function AnimeSection({ 
  title, 
  infiniteQuery 
}: AnimeSectionProps) {
  const { t } = useTranslation();
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const fetchNextPageRef = React.useRef(infiniteQuery.fetchNextPage);

  const { scrollRef, scrollElement, scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useAnimatedScroll({ axis: "x" });

  const allItems = React.useMemo(() => {
    return infiniteQuery.data?.pages.flatMap((page) => page.data ?? []) ?? [];
  }, [infiniteQuery.data]);

  const uniqueItems = React.useMemo(() => {
    return Array.from(new Map(allItems.map((anime) => [anime.mal_id, anime])).values());
  }, [allItems]);

  React.useEffect(() => {
    fetchNextPageRef.current = infiniteQuery.fetchNextPage;
  }, [infiniteQuery.fetchNextPage]);

  React.useEffect(() => {
    if (!infiniteQuery.hasNextPage || infiniteQuery.isFetchingNextPage) return;

    const checkScrollPosition = () => {
      if (!scrollElement || !loadMoreRef.current) return;
      
      const container = scrollElement;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const loadMoreElement = loadMoreRef.current;
      
      const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 200;
      const loadMoreRect = loadMoreElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const isVisible = loadMoreRect.left < containerRect.right + 200;
      
      if ((isNearEnd || isVisible) && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
        fetchNextPageRef.current();
      }
    };

    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollPosition, { passive: true });
      checkScrollPosition();
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, uniqueItems.length, scrollElement]);


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
            onClick={scrollPrev} 
            disabled={!canScrollPrev}
            className="h-8 w-8 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("common.scrollLeft")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={scrollNext} 
            disabled={!canScrollNext}
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
          {canScrollNext && (
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

export { AnimeSection };
