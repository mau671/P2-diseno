import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeCard } from "./AnimeCard";
import { AnimeCardSkeleton, AnimeHorizontalSkeleton } from "./AnimeCardSkeleton";

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
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const fetchNextPageRef = React.useRef(infiniteQuery.fetchNextPage);

  const allItems = React.useMemo(() => {
    return infiniteQuery.data?.pages.flatMap((page) => page.data ?? []) ?? [];
  }, [infiniteQuery.data]);

  const uniqueItems = React.useMemo(() => {
    return Array.from(new Map(allItems.map((anime) => [anime.mal_id, anime])).values());
  }, [allItems]);

  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  React.useEffect(() => {
    fetchNextPageRef.current = infiniteQuery.fetchNextPage;
  }, [infiniteQuery.fetchNextPage]);

  React.useEffect(() => {
    if (!infiniteQuery.hasNextPage || infiniteQuery.isFetchingNextPage) return;

    const checkScrollPosition = () => {
      if (!scrollRef.current || !loadMoreRef.current) return;
      
      const container = scrollRef.current;
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

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition, { passive: true });
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
    const scrollAmount = scrollRef.current.clientWidth * 0.6;
    
      const startScroll = scrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? startScroll - scrollAmount 
        : startScroll + scrollAmount;
      const startTime = performance.now();
      const duration = 400;

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
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

export { AnimeSection };
