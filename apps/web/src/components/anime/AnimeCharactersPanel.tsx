import * as React from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAnimeCharacters } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  animeId: number;
  className?: string;
};

function CharactersSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[3/4] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function AnimeCharactersPanel({ animeId, className }: Props) {
  const { t } = useTranslation();
  const tAny = t as unknown as (key: string, options?: any) => string;

  const charactersQuery = useAnimeCharacters(animeId, true);

  const all = charactersQuery.data ?? [];

  // ✅ normalizamos a { id, name, img }
  const characters = React.useMemo(() => {
    return all
      .map((item) => {
        const c = item?.character;
        const img =
          c?.images?.webp?.image_url ||
          c?.images?.jpg?.image_url ||
          "";

        return {
          id: c?.mal_id ?? Math.random(),
          name: c?.name ?? tAny("common.na", { defaultValue: "N/A" }),
          img,
        };
      })
      .filter((x) => x.name);
  }, [all, tAny]);

  const pageSize = 4;
  const [page, setPage] = React.useState(0);

  const maxPage = React.useMemo(() => {
    const total = characters.length;
    return Math.max(0, Math.ceil(total / pageSize) - 1);
  }, [characters.length]);

  React.useEffect(() => {
    // si cambia el anime o cambia el tamaño, aseguramos page válida
    setPage((p) => Math.min(p, maxPage));
  }, [maxPage, animeId]);

  const canPrev = page > 0;
  const canNext = page < maxPage;

  const pageItems = React.useMemo(() => {
    const start = page * pageSize;
    return characters.slice(start, start + pageSize);
  }, [characters, page]);

  const title = tAny("anime.detail.sections.characters", { defaultValue: "Characters" });

  if (charactersQuery.isError) {
    const msg =
      charactersQuery.error instanceof Error
        ? charactersQuery.error.message
        : tAny("common.loadError", { defaultValue: "Error loading data." });

    return (
      <div className={cn("rounded-2xl border p-5 bg-card min-h-[280px]", className)}>
        <div className="font-semibold mb-2 text-lg">{title}</div>
        <ErrorState message={msg} onRetry={() => charactersQuery.refetch()} />
      </div>
    );
  }

  if (charactersQuery.isLoading) {
    return (
      <div className={cn("rounded-2xl border p-5 bg-card min-h-[280px]", className)}>
        <div className="font-semibold mb-2 text-lg">{title}</div>
        <CharactersSkeleton />
      </div>
    );
  }

  if (!charactersQuery.data || characters.length === 0) {
    return (
      <div className={cn("rounded-2xl border p-5 bg-card min-h-[280px]", className)}>
        <div className="font-semibold mb-2 text-lg">{title}</div>
        <EmptyState
          message={tAny("anime.characters.empty", {
            defaultValue: "No characters found.",
          })}
        />
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border p-5 bg-card min-h-[280px]", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-lg">{title}</div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!canPrev}
            className="h-9 w-9 rounded-full border"
            aria-label={tAny("common.previous", { defaultValue: "Previous" })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            disabled={!canNext}
            className="h-9 w-9 rounded-full border"
            aria-label={tAny("common.next", { defaultValue: "Next" })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {pageItems.map((c) => (
          <div key={c.id} className="group">
            <div className="aspect-[3/4] w-full rounded-xl overflow-hidden border bg-muted">
              {c.img ? (
                <img
                  src={c.img}
                  alt={c.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-10 w-10 text-muted-foreground/60" />
                </div>
              )}
            </div>

            <div className="mt-2 text-sm font-medium truncate">{c.name}</div>
          </div>
        ))}
      </div>

      {maxPage > 0 ? (
        <div className="mt-3 text-xs text-muted-foreground">
          {page + 1}/{maxPage + 1}
        </div>
      ) : null}
    </div>
  );
}
