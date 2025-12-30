import * as React from "react";
import { useTranslation } from "react-i18next";
import type { AnimeBase } from "@/api/queries";

function useAnimeCardData(anime: AnimeBase) {
  const { t } = useTranslation();

  const seasonInfo = React.useMemo(() => {
    if (anime.season && anime.year) {
      return t(`seasons.${anime.season}`) + " " + anime.year;
    }
    if (anime.aired?.from) {
      return new Date(anime.aired.from).getFullYear().toString();
    }
    return null;
  }, [anime.season, anime.year, anime.aired, t]);

  const scoreColor = React.useMemo(() => {
    if (!anime.score) return "#6b7280";
    if (anime.score >= 8) return "#22c55e";
    if (anime.score >= 6) return "#84cc16";
    if (anime.score >= 4) return "#f59e0b";
    return "#ef4444";
  }, [anime.score]);

  const typeInfo = React.useMemo(() => {
    if (!anime.type) return null;
    if (anime.episodes !== undefined && anime.episodes !== null) {
      return `${anime.type.toUpperCase()} • ${anime.episodes} ${t("search.episodes", "episodios")}`;
    }
    return anime.type.toUpperCase();
  }, [anime.type, anime.episodes, t]);

  return { seasonInfo, scoreColor, typeInfo };
}

export { useAnimeCardData };
