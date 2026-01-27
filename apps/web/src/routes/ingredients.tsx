import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/api/backend";

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

type CatalogBase = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  cuisine_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CatalogResponse = {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
  items: CatalogBase[];
};

function moneyCRC(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);
}

async function fetchCatalogBases(args: {
  page: number;
  limit: number;
  q?: string;
  cuisine?: string;
  accessToken?: string;
}) {
  const usp = new URLSearchParams();
  usp.set("page", String(args.page));
  usp.set("limit", String(args.limit));
  if (args.q?.trim()) usp.set("q", args.q.trim());
  if (args.cuisine?.trim()) usp.set("cuisine", args.cuisine.trim());

  return apiRequest<CatalogResponse>(`/catalog/bases?${usp.toString()}`, {}, args.accessToken);
}

function BaseCard({ base }: { base: CatalogBase }) {
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
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 12 });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value.trim());
  }, { wait: 400 });

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [authLoading, navigate, user]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, cuisine]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const basesQuery = useQuery({
    queryKey: ["catalog-bases", {
      search,
      cuisine,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      authed: Boolean(session?.access_token),
    }],
    queryFn: () =>
      fetchCatalogBases({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        q: search || undefined,
        cuisine: cuisine || undefined,
        accessToken: session?.access_token ?? undefined,
      }),
    enabled: !authLoading && !!user,
  });

  const data = React.useMemo(() => basesQuery.data?.items ?? [], [basesQuery.data]);
  const total = basesQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const cuisineOptions = React.useMemo(() => {
    const unique = new Set<string>();
    data.forEach((item) => unique.add(item.cuisine_type));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [data]);

  if (authLoading) return <LoadingState />;
  if (!user) return null;

  if (basesQuery.isLoading && data.length === 0) {
    return <LoadingState />;
  }

  if (basesQuery.isError) {
    const message = basesQuery.error instanceof Error
      ? basesQuery.error.message
      : t("common.loadError");
    return <ErrorState message={message} onRetry={() => basesQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {t("catalogBases.title", { defaultValue: "Bases gastronómicas" })}
        </h1>
        <p className="text-muted-foreground">
          {t("catalogBases.subtitle", { defaultValue: "Elegí un punto de partida para tu platillo." })}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={t("catalogBases.search", { defaultValue: "Buscar por nombre o tipo de cocina…" })}
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

        {data.length === 0 ? (
          <EmptyState message={t("catalogBases.empty", { defaultValue: "No hay bases para mostrar con esos filtros." })} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((base) => (
              <BaseCard key={base.id} base={base} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {t("catalogBases.pagination", {
            defaultValue: "Página {{page}} de {{total}} · {{count}} resultados",
            page: pagination.pageIndex + 1,
            total: pageCount,
            count: total,
          })}
          {basesQuery.isFetching ? ` · ${t("common.loading")}` : ""}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
            disabled={pagination.pageIndex <= 0}
          >
            {t("ingredients.prev", { defaultValue: "Anterior" })}
          </Button>

          <Button
            variant="outline"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.min(pageCount - 1, p.pageIndex + 1) }))}
            disabled={pagination.pageIndex + 1 >= pageCount}
          >
            {t("ingredients.next", { defaultValue: "Siguiente" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
