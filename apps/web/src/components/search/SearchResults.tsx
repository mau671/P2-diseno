import * as React from "react";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";

type SearchResultsProps = {
  search: ReturnType<typeof import("@/api/queries").useInfiniteSearch>;
};

function SearchResults({ search }: SearchResultsProps) {
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
        <AnimeCard key={item.mal_id} anime={item} />
      ))}
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <AnimeCardSkeleton key={`skeleton-${i}`} />
      ))}
      {search.hasNextPage && <div ref={observerTarget} />}
    </div>
  );
}

export { SearchResults };
