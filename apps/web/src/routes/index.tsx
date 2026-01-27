import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/use-auth";
import { getCatalogBases } from "@/api/catalog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/network/LoadingState";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { SearchFilterDropdown } from "@/components/search/SearchFilterDropdown";
import { BaseCard } from "@/components/catalog/BaseCard";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = React.useState("");
  const [q, setQ] = React.useState("");
  const [cuisine, setCuisine] = React.useState<string | null>(null);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setQ(value.trim());
  }, { wait: 400 });

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const basesQuery = useQuery({
    queryKey: [
      "home-catalog-bases",
      {
        q,
        cuisine,
        // clave: el cache cambia según usuario (evita “me sale lo viejo”)
        userId: user?.id ?? null,
        authed: Boolean(session?.access_token),
      },
    ],
    queryFn: () =>
      getCatalogBases(
        {
          page: 1,
          limit: 12,
          q: q || undefined,
          cuisine: cuisine || undefined,
        },
        session?.access_token ?? undefined
      ),
    // clave: no pegamos al backend sin login, porque sin token no hay filtrado
    enabled: !authLoading && !!user && !!session?.access_token,
    staleTime: 0,
  });

  const data = React.useMemo(() => basesQuery.data?.items ?? [], [basesQuery.data]);

  const cuisineOptions = React.useMemo(() => {
    const unique = new Set<string>();
    data.forEach((item) => unique.add(item.cuisine_type));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [data]);

  if (authLoading) return <LoadingState />;

  // Si no estás logueado, mejor decirlo claro (para que no “confunda” la demo)
  if (!user || !session?.access_token) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("home.title", { defaultValue: "Inicio" })}</h1>
          <p className="text-muted-foreground">
            {t("home.description", { defaultValue: "Explorá las bases gastronómicas según tu perfil." })}
          </p>
        </div>

        <div className="rounded-xl border p-6 space-y-3">
          <p className="text-muted-foreground">
            {t("home.loginToSeeFiltered", {
              defaultValue:
                "Iniciá sesión para ver el catálogo filtrado según tus restricciones (ej: lactosa).",
            })}
          </p>

          <Button onClick={() => navigate({ to: "/auth/login" })}>
            {t("auth.login", { defaultValue: "Iniciar sesión" })}
          </Button>
        </div>
      </div>
    );
  }

  if (basesQuery.isLoading) return <LoadingState />;

  if (basesQuery.isError) {
    const message =
      basesQuery.error instanceof Error ? basesQuery.error.message : t("common.loadError");
    return <ErrorState message={message} onRetry={() => basesQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("home.title", { defaultValue: "Inicio" })}</h1>
        <p className="text-muted-foreground">
          {t("home.description", {
            defaultValue: "Bases recomendadas (respetando tus restricciones).",
          })}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("home.search", { defaultValue: "Buscar por nombre o tipo de cocina…" })}
            className="min-w-[220px]"
          />

          <SearchFilterDropdown
            labelKey={"home.cuisine" as any}
            options={cuisineOptions}
            selected={cuisine}
            onSelect={(value) => setCuisine(value)}
            getLabel={(option) => option}
            getValue={(option) => option}
          />

          <Button
            variant="outline"
            onClick={() => {
              setSearchInput("");
              setQ("");
              setCuisine(null);
            }}
          >
            {t("common.clear", { defaultValue: "Limpiar" })}
          </Button>
        </div>

        {data.length === 0 ? (
          <EmptyState
            message={t("home.empty", { defaultValue: "No hay bases para mostrar con esos filtros." })}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((base) => (
              <BaseCard key={base.id} base={base} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
