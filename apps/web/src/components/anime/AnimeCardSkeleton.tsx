import { Skeleton } from "@/components/ui/skeleton";

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

export { AnimeCardSkeleton, AnimeListSkeleton, AnimeHorizontalSkeleton };
