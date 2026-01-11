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
import { Languages, Moon, Sun, Monitor } from "lucide-react";
import { ThemeColorSelector } from "./ThemeColorSelector";

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
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Languages className="mr-2 h-4 w-4" />
                {currentLanguage === "es" ? t("language.es") : t("language.en")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleLanguageChange("es-419")} className="cursor-pointer">
                {t("language.es")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange("en-US")} className="cursor-pointer">
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
              <Button variant="outline" size="sm" className="cursor-pointer">
                {theme === "light" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : theme === "dark" ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Monitor className="mr-2 h-4 w-4" />
                )}
                {theme === "light"
                  ? t("theme.light")
                  : theme === "dark"
                  ? t("theme.dark")
                  : t("theme.system")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4" />
                {t("theme.light")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                <Moon className="mr-2 h-4 w-4" />
                {t("theme.dark")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                <Monitor className="mr-2 h-4 w-4" />
                {t("theme.system")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Theme Color */}
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <ThemeColorSelector />
      </div>
    </div>
  );
}

