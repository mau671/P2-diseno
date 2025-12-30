export const SEARCH_TYPES = ["anime", "manga", "characters", "people", "studios"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export const SEASONS = ["winter", "spring", "summer", "fall"] as const;
export type Season = (typeof SEASONS)[number];

export const FORMATS = ["tv", "movie", "ova", "special", "ona", "music", "cm", "pv", "tv_special"] as const;
export type Format = (typeof FORMATS)[number];

export const STATUSES = ["airing", "complete", "upcoming"] as const;
export type Status = (typeof STATUSES)[number];

export const TYPE_TO_ENDPOINT: Record<SearchType, string> = {
  anime: "anime",
  manga: "manga",
  characters: "characters",
  people: "people",
  studios: "producers",
};
