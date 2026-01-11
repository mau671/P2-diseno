"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { Languages, Moon, Sun } from "lucide-react";
import { AccentColorPicker } from "./AccentColorPicker";

export function AppearanceSection() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language === "es-419" ? "es" : "en";

  return (
    <div className="space-y-6">
      {/* Language */}
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("profile.language")}</p>
            <p className="text-xs text-muted-foreground">
              {currentLanguage === "es"
                ? t("language.es")
                : t("language.en")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Languages className="mr-2 h-4 w-4" />
                {currentLanguage === "es" ? t("language.es") : t("language.en")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleLanguageChange("es-419")}>
                {t("language.es")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange("en-US")}>
                {t("language.en")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("profile.theme")}</p>
            <p className="text-xs text-muted-foreground">
              {theme === "light"
                ? t("theme.light")
                : theme === "dark"
                ? t("theme.dark")
                : t("theme.system")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {theme === "light" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {theme === "light"
                  ? t("theme.light")
                  : theme === "dark"
                  ? t("theme.dark")
                  : t("theme.system")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                {t("theme.light")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                {t("theme.dark")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                {t("theme.system")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <AccentColorPicker />
      </div>
    </div>
  );
}

