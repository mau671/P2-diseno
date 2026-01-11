import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageToggle() {
  const { i18n, t } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("language.toggle")}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage("es-419")}>
          {t("language.es")}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => changeLanguage("en-US")}>
          {t("language.en")}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => changeLanguage("pt-BR")}>
          {t("language.pt")}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => changeLanguage("fr-FR")}>
          {t("language.fr")}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => changeLanguage("it-IT")}>
          {t("language.it")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
