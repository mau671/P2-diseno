import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useSearchAnime } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Hook personalizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function AnimeListSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4">
          <div className="flex gap-3">
            <Skeleton className="h-16 w-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnimeList({ items }: { items: any[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => {
        const img = a?.images?.webp?.image_url || a?.images?.jpg?.image_url;

        return (
          <div key={a.mal_id} className="rounded-xl border p-4">
            <div className="flex gap-3">
              {img ? (
                <img
                  src={img}
                  alt={a.title}
                  className="h-16 w-12 rounded object-cover"
                />
              ) : (
                <div className="h-16 w-12 rounded bg-muted" />
              )}

              <div className="min-w-0">
                <div className="truncate font-semibold">{a.title}</div>
                <div className="text-sm text-muted-foreground">
                  Score: {a.score ?? "N/A"}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SearchAnimePage() {
  const { t } = useTranslation();

  const [input, setInput] = React.useState("");
  const [shouldSearch, setShouldSearch] = React.useState(false);
  
  // Debounce automático del input (500ms)
  const debouncedInput = useDebounce(input, 500);
  
  // Término de búsqueda actual (se actualiza con debounce o al presionar Enter)
  const [searchTerm, setSearchTerm] = React.useState("");

  // Actualizar término de búsqueda cuando cambie el valor con debounce
  React.useEffect(() => {
    if (shouldSearch && debouncedInput.trim().length > 0) {
      setSearchTerm(debouncedInput);
    }
  }, [debouncedInput, shouldSearch]);

  const search = useSearchAnime(searchTerm, 1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setShouldSearch(true);
  };

  const handleSearch = () => {
    if (input.trim().length > 0) {
      setSearchTerm(input);
      setShouldSearch(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("sections.search")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("sections.searchDescription")}
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("search.placeholder")}
        />
        <Button onClick={handleSearch}>{t("search.button")}</Button>
      </div>

      {searchTerm.trim().length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {t("search.hint")}
        </div>
      ) : search.isLoading ? (
        <AnimeListSkeleton />
      ) : search.isError ? (
        <ErrorState
          message={(search.error as any)?.message ?? t("search.error")}
          onRetry={() => search.refetch()}
        />
      ) : (search.data?.data?.length ?? 0) === 0 ? (
        <EmptyState message={t("search.empty")} />
      ) : (
        <AnimeList items={search.data?.data ?? []} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/anime/search")({
  component: SearchAnimePage,
});
