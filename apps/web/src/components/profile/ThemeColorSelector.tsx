"use client";

import { useTranslation } from "react-i18next";
import { useThemeColor, type ThemeColor } from "@/hooks/use-theme-color";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

function getThemeColorName(colorKey: ThemeColor, t: (key: string) => string): string {
  const translationKey = `themeColors.${colorKey}`;
  const translated = t(translationKey);
  // If translation exists, use it; otherwise fallback to the key
  return translated !== translationKey ? translated : colorKey;
}

export function ThemeColorSelector() {
  const { t } = useTranslation();
  const { themeColor, setThemeColor, resetThemeColor, themeColors } = useThemeColor();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("profile.themeColor")}</p>
          <p className="text-xs text-muted-foreground">
            {t("profile.themeColorHint")}
          </p>
        </div>
        {themeColor !== "default" && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetThemeColor}
            type="button"
            className="cursor-pointer"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("profile.reset")}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {(Object.keys(themeColors) as ThemeColor[]).map((colorKey) => {
          const config = themeColors[colorKey];
          const isSelected = themeColor === colorKey;
          const currentColor = isDark ? config.dark.primary : config.light.primary;
          const translatedName = getThemeColorName(colorKey, t);
          
          return (
            <button
              key={colorKey}
              onClick={() => setThemeColor(colorKey)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all cursor-pointer",
                "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
              aria-label={translatedName}
            >
              <div
                className={cn(
                  "relative h-8 w-8 shrink-0 rounded-md border transition-all",
                  isSelected ? "border-primary ring-2 ring-primary ring-offset-1" : "border-border/50"
                )}
                style={{
                  backgroundColor: currentColor,
                }}
              >
                {isSelected && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-primary-foreground drop-shadow-sm" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {translatedName}
                </p>
                {isSelected && (
                  <p className="text-xs text-muted-foreground">
                    {t("profile.currentTheme")}
                  </p>
                )}
              </div>
              {isSelected && (
                <Check className="h-5 w-5 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
