import * as React from "react";
import { Vibrant } from "node-vibrant/browser";
import { colord } from "colord";

export function useAnimePastelColor(imageUrl?: string) {
  const [pastelColor, setPastelColor] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!imageUrl) return;

    setIsLoading(true);

    const extractColor = async () => {
      try {
        const vibrant = await Vibrant.from(imageUrl).getPalette();
        
        const dominantColor = vibrant.Vibrant || vibrant.Muted || vibrant.LightVibrant;

        if (dominantColor) {
          const pastel = colord(dominantColor.hex)
            .saturate(0.6)
            .lighten(0.3)
            .toHex();
          setPastelColor(pastel);
        }
      } catch (error) {
        console.error("Error extracting color:", error);
      } finally {
        setIsLoading(false);
      }
    };

    extractColor();
  }, [imageUrl]);

  return { pastelColor, isLoading };
}
