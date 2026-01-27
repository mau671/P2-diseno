import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/use-auth";
import { useCatalogBases } from "@/hooks/use-catalog-bases";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import { LoadingState } from "@/components/network/LoadingState";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { SearchFilterDropdown } from "@/components/search/SearchFilterDropdown";

export const Route = createFileRoute("/ingredients")({
  component: CatalogBasesPage,
});

function moneyCRC(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);
}

function BaseCard({ base }: { base: any }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[16/9] w-full bg-muted">
        {base.image_url ? (
          <img
            src={base.image_url}
            alt={base.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{base.name}</h3>
            <p className="truncate text-sm text-muted-foreground">{base.cuisine_type}</p>
          </div>

          <div className="shrink-0 text-sm font-medium">
            {moneyCRC(Number(base.base_price ?? 0))}
          </div>
        </div>

        {base.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {base.description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CatalogBasesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [cuisine, setCuisine] = React.useState<string | null>(null);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value.trim());
  }, { wait: 400 });

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [authLoading, navigate, user]);

  const basesQuery = useCatalogBases({
    q: search,
    cuisine: cuisine ?? "",
    limit: 12,
    accessToken: session?.access_token,
    enabled: !authLoading && !!user,
  });

  // 🔥 ESTE ES EL FIX REAL: pages -> items
  const pages = basesQuery.data?.pages ?? [];
  const items = React.useMemo(() => pages.flatMap((p) => p.items), [pages]);
  const total = pages[0]?.total ?? 0;

  const cuisineOptions = React.useMemo(() => {
    const unique = new Set<string>();
    items.forEach((item) => unique.add(item.cuisine_type));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  if (authLoading) return <LoadingState />;
  if (!user) return null;

  if (basesQuery.isLoading && items.length === 0) return <LoadingState />;

  if (basesQuery.isError) {
    const message = basesQuery.error instanceof Error
      ? basesQuery.error.message
      : t("common.loadError");
    return <ErrorState message={message} onRetry={() => basesQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bases gastronómicas</h1>
        <p className="text-muted-foreground">Elegí un punto de partida para tu platillo.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar por nombre o tipo de cocina…"
            className="min-w-[220px]"
          />

          <SearchFilterDropdown
            labelKey={"catalogBases.cuisine" as any}
            options={cuisineOptions}
            selected={cuisine}
            onSelect={(value) => setCuisine(value)}
            getLabel={(option) => option}
            getValue={(option) => option}
          />
        </div>

        {items.length === 0 ? (
          <EmptyState message="No hay bases para mostrar con esos filtros." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((base) => (
              <BaseCard key={base.id} base={base} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.length} / {total} resultados
          {basesQuery.isFetching ? " · cargando..." : ""}
        </div>

        <Button
          variant="outline"
          onClick={() => basesQuery.fetchNextPage()}
          disabled={!basesQuery.hasNextPage || basesQuery.isFetchingNextPage}
        >
          {basesQuery.hasNextPage ? "Cargar más" : "No hay más"}
        </Button>
      </div>
    </div>
  );
}
