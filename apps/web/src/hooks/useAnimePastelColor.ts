import * as React from "react";
import { Vibrant } from "node-vibrant/browser";
import { colord } from "colord";

export function useAnimePastelColor(imageUrl?: string) {
  const [pastelColor, setPastelColor] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    if (!imageUrl) {
      setPastelColor(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const img = new Image();
    img.crossOrigin = "anonymous"; // ✅ aquí sí aplica crossOrigin
    img.src = imageUrl;

    img.onload = async () => {
      try {
        const palette = await Vibrant.from(img).getPalette();
        if (cancelled) return;

        const dominant =
          palette?.Vibrant ||
          palette?.Muted ||
          palette?.LightVibrant ||
          palette?.LightMuted ||
          palette?.DarkVibrant ||
          palette?.DarkMuted;

        if (dominant?.hex) {
          const pastel = colord(dominant.hex)
            .saturate(0.35)
            .lighten(0.25)
            .toHex();

          setPastelColor(pastel);
        } else {
          setPastelColor(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error extracting color:", error);
          setPastelColor(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setPastelColor(null);
        setIsLoading(false);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return { pastelColor, isLoading };
}
