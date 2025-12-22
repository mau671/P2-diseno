import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useTopAnime, useSearchAnime } from "@/api/queries";
import { LoadingState } from "@/components/network/LoadingState";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

function HomePage() {
  const { t } = useTranslation();

  // TOP
  const top = useTopAnime(1);

  // SEARCH (no spamear: solo al darle click a Buscar)
  const [input, setInput] = React.useState("");
  const [term, setTerm] = React.useState("");
  const search = useSearchAnime(term, 1);

  return (
    <div className="space-y-10">
      {/* Header original */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("home.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("home.description")}</p>
      </div>

      {/* TOP ANIME */}
      <section className="space-y-3">
        <div className="text-lg font-semibold">{t("sections.topAnime")}</div>

        {top.isLoading ? (
          <LoadingState />
        ) : top.isError ? (
          <ErrorState
            message={(top.error as any)?.message ?? t("common.loadError")}
            onRetry={() => top.refetch()}
          />
        ) : (top.data?.data?.length ?? 0) === 0 ? (
          <EmptyState message={t("topAnime.empty")} />
        ) : (
          <AnimeList items={top.data?.data ?? []} />
        )}
      </section>

      {/* BÚSQUEDA */}
      <section className="space-y-3">
        <div className="text-lg font-semibold">{t("sections.search")}</div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("search.placeholder")}
          />
          <Button onClick={() => setTerm(input)}>{t("search.button")}</Button>
        </div>

        {term.trim().length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("search.hint")}
          </div>
        ) : search.isLoading ? (
          <LoadingState />
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
      </section>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});

