import * as React from "react";
import { getPastelColorByIndex } from "@/lib/pastel-colors";

export function useStablePastelColor(animeId: number) {
  return React.useMemo(() => {
    return getPastelColorByIndex(animeId);
  }, [animeId]);
}
