import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { slugify } from "@/lib/slug";
import type { SearchResult } from "@/api/queries";
import type { SearchType } from "@/lib/search-constants";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";

type SearchResultsProps = {
  search: ReturnType<typeof import("@/api/queries").useInfiniteSearch>;
  searchType: SearchType;
};

function getFromHref(location: any) {
  return (location as any)?.href ?? `${window.location.pathname}${window.location.search}`;
}

function getTitle(item: any) {
  return (item?.title || item?.name || item?.titles?.[0]?.title || "Untitled") as string;
}

function getSlugTitle(item: any) {
  return ((item?.title_english || item?.title || item?.name || "anime") as string).trim();
}

function getImg(item: any) {
  return (
    item?.images?.webp?.large_image_url ||
    item?.images?.jpg?.large_image_url ||
    item?.images?.webp?.image_url ||
    item?.images?.jpg?.image_url ||
    ""
  );
}

function SearchResults({ search, searchType }: SearchResultsProps) {
  const location = useLocation();
  const from = getFromHref(location);

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
      { rootMargin: "100px" }
    );

    const current = observerTarget.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [search.hasNextPage, search.isFetchingNextPage]);

  const allItems = (search.data?.pages.flatMap((page: any) => page.data ?? []) ?? []) as SearchResult[];
  const uniqueItems = Array.from(new Map(allItems.map((item: any) => [item.mal_id, item])).values());

  const skeletonCount = search.isFetchingNextPage ? 21 : 0;

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {uniqueItems.map((item: any) => {
        const id = item?.mal_id;
        const title = getTitle(item);
        const img = getImg(item);

        // ✅ Solo anime navega a detalle
        if (searchType === "anime" && id) {
          const slug = slugify(getSlugTitle(item));

          return (
            <Link
              key={id}
              to="/anime/$id/$slug"
              params={{ id: String(id), slug }}
              search={{ from }}
              className="block"
            >
              <div className="flex-shrink-0 w-36 md:w-44 cursor-pointer group relative">
                <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3]">
                  {img ? (
                    <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>

                <div className="text-sm font-medium line-clamp-2 mt-2">{title}</div>
              </div>
            </Link>
          );
        }

        // Otros tipos: no navegan a detalle (para no romper)
        const externalUrl = item?.url as string | undefined;
        return (
          <div
            key={id ?? title}
            className="flex-shrink-0 w-36 md:w-44 cursor-pointer group relative"
            role={externalUrl ? "link" : undefined}
            tabIndex={externalUrl ? 0 : undefined}
            onClick={externalUrl ? () => window.open(externalUrl, "_blank", "noopener,noreferrer") : undefined}
            onKeyDown={
              externalUrl
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      window.open(externalUrl, "_blank", "noopener,noreferrer");
                    }
                  }
                : undefined
            }
          >
            <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3]">
              {img ? (
                <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </div>

            <div className="text-sm font-medium line-clamp-2 mt-2">{title}</div>
          </div>
        );
      })}

      {Array.from({ length: skeletonCount }).map((_, i) => (
        <AnimeCardSkeleton key={`skeleton-${i}`} />
      ))}

      {search.hasNextPage && <div ref={observerTarget} />}
    </div>
  );
}

export { SearchResults };
