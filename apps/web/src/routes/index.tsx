import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("home.title")}</h1>
        <p className="text-muted-foreground">{t("home.description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <a
          href="/anime/top"
          className="rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Top Anime</h2>
          <p className="text-sm text-muted-foreground">
            Explora los animes mejor valorados por la comunidad
          </p>
        </a>

        <a
          href="/anime/search"
          className="rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Buscar Anime</h2>
          <p className="text-sm text-muted-foreground">
            Encuentra tu anime favorito en nuestra base de datos
          </p>
        </a>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
