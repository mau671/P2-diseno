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
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
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
                <img src={img} alt={a.title} className="h-16 w-12 rounded object-cover" />
              ) : (
                <div className="h-16 w-12 rounded bg-muted" />
              )}

              <div className="min-w-0">
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

/**
 * URL esperada:
 * /anime/search?q=Chainsaw
 */
export const Route = createFileRoute("/anime/search")({
  validateSearch: (search: Record<string, unknown>): { q: string | undefined } => {
    const qRaw = typeof search.q === "string" ? search.q.trim() : "";
    return { q: qRaw.length > 0 ? qRaw : undefined };
  },
  component: SearchAnimePage,
});

function SearchAnimePage() {
  const { t } = useTranslation();

  // ✅ Navegación tipada de ESTA ruta (evita broncas)
  const navigate = Route.useNavigate();

  // Leer query param desde la URL
  const { q } = Route.useSearch();
  const qValue = q ?? "";

  // Input del usuario (UI)
  const [input, setInput] = React.useState(qValue);

  // Si el usuario llega por URL (o back/forward), sincronizar input
  React.useEffect(() => {
    setInput(qValue);
  }, [qValue]);

  // Debounce automático del input (500ms)
  const debouncedInput = useDebounce(input, 500);

  // Cuando el usuario escribe, actualizamos la URL con debounce
  React.useEffect(() => {
    const next = debouncedInput.trim();

    // Si no cambió, no hagás nada
    if (next === qValue) return;

    // ✅ OJO: NUNCA mandés {}. Mandá { q: undefined }
    navigate({
      search: { q: next.length > 0 ? next : undefined },
      replace: true,
    });
  }, [debouncedInput, navigate, qValue]);

  // La búsqueda se basa 100% en la URL
  const search = useSearchAnime(qValue, 1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Botón/Enter: actualiza URL inmediatamente
  const handleSearch = () => {
    const next = input.trim();
    navigate({
      search: { q: next.length > 0 ? next : undefined },
    });
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

      {qValue.trim().length === 0 ? (
        <div className="text-sm text-muted-foreground">{t("search.hint")}</div>
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

