"use client";

import { useThemeColor } from "@/hooks/use-theme-color";

/**
 * Component that initializes the theme color system.
 * This ensures the theme color is applied immediately on mount.
 */
export function ThemeColorInitializer() {
  useThemeColor();
  return null;
}

