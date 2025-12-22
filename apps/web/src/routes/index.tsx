import { createFileRoute, Link } from "@tanstack/react-router";
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
        <Link
          to="/anime/top"
          className="rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">{t("sections.topAnime")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("sections.topAnimeDescription")}
          </p>
        </Link>

        <Link
          to="/anime/search"
          search={{ q: undefined }}
          className="rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">{t("sections.search")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("sections.searchDescription")}
          </p>
        </Link>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
