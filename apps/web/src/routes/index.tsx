import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{t("home.title")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("home.description")}
      </p>
    </div>
  )
}

export const Route = createFileRoute("/")({
  component: HomePage,
})
