import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryState, parseAsBoolean } from "nuqs";

import { useSearchAnime, type Anime } from "@/api/queries";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Custom debounce hook with flush function
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

function AnimeList({ items }: { items: Anime[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((a, index) => {
        const img = a?.images?.webp?.image_url || a?.images?.jpg?.image_url;

        return (
          <div key={`${a.mal_id}-${index}`} className="rounded-xl border p-4 overflow-hidden">
            <div className="flex gap-3">
              {img ? (
                <img src={img} alt={a.title} className="h-16 w-12 rounded object-cover" />
              ) : (
                <div className="h-16 w-12 rounded bg-muted" />
              )}

              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="truncate font-semibold">{a.title}</div>
                <div className="text-sm text-muted-foreground">Score: {a.score ?? "N/A"}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const Route = createFileRoute("/anime/search")({
  component: SearchAnimePage,
});

function SearchAnimePage() {
  const { t } = useTranslation();

  // Search query state synchronized with URL
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });

  // NSFW toggle state - false means SFW (default), true means allow NSFW
  const [allowNsfw, setAllowNsfw] = useQueryState("nsfw", parseAsBoolean.withDefault(false));

  // Local input state for immediate UI responsiveness
  const [input, setInput] = React.useState(query);

  // Sync input with URL changes (back/forward navigation)
  React.useEffect(() => {
    setInput(query);
  }, [query]);

  // Debounced search to reduce API calls
  const [debouncedInput, flushDebounce] = useDebounce(input, 500);

  // Update URL when debounced input changes
  React.useEffect(() => {
    const trimmed = debouncedInput.trim();
    if (trimmed !== query) {
      setQuery(trimmed || null); // Clear URL param if empty
    }
  }, [debouncedInput, query, setQuery]);

  // Search based on current URL query and SFW setting
  const search = useSearchAnime(query, 1, !allowNsfw);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Immediate search on button click or Enter key
  const handleSearch = () => {
    flushDebounce(); // Cancel pending debounce
    const trimmed = input.trim();
    setQuery(trimmed || null); // Clear URL param if empty
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("sections.search")}</h1>
        <p className="text-sm text-muted-foreground">{t("sections.searchDescription")}</p>
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

      <div className="flex items-center gap-2">
        <Switch
          id="nsfw-toggle"
          checked={allowNsfw}
          onCheckedChange={setAllowNsfw}
        />
        <Label htmlFor="nsfw-toggle" className="text-sm">
          {t("search.allowNsfw", "Allow NSFW content")}
        </Label>
      </div>

      {query.trim().length === 0 ? (
        <div className="text-sm text-muted-foreground">{t("search.hint")}</div>
      ) : search.isLoading ? (
        <AnimeListSkeleton />
      ) : search.isError ? (
        <ErrorState
          message={search.error instanceof Error ? search.error.message : t("search.error")}
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

