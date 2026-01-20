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

      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">{t("common.comingSoon")}</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
