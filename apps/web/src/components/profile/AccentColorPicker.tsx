"use client";

import * as React from "react";
import { HexColorPicker } from "react-colorful";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAccentColor } from "@/hooks/use-accent-color";
import { RotateCcw } from "lucide-react";

export function AccentColorPicker() {
  const { t } = useTranslation();
  const { accentColor, setAccentColor, resetAccentColor } = useAccentColor();
  const [localColor, setLocalColor] = React.useState(accentColor || "#6366f1");

  React.useEffect(() => {
    if (accentColor) {
      setLocalColor(accentColor);
    }
  }, [accentColor]);

  const handleColorChange = (color: string) => {
    setLocalColor(color);
    setAccentColor(color);
  };

  const handleReset = () => {
    resetAccentColor();
    setLocalColor("#6366f1"); // Default color
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("profile.accentColor")}</p>
          <p className="text-xs text-muted-foreground">
            {t("profile.accentColorHint")}
          </p>
        </div>
        {accentColor && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            type="button"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("profile.reset")}
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center rounded-lg border bg-card p-4">
          <HexColorPicker
            color={localColor}
            onChange={handleColorChange}
            style={{ width: "100%", maxWidth: "300px" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-10 w-10 rounded-md border-2 border-border"
            style={{ backgroundColor: localColor }}
          />
          <div className="flex-1">
            <p className="text-sm font-medium">{localColor.toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">
              {t("profile.currentColor")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

