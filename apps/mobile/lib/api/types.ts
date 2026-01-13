export interface JikanResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
    };
    webp: {
      image_url: string;
      large_image_url?: string;
    };
  };
  synopsis?: string;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  status: string;
  rating?: string;
  type?: string;
  source?: string;
  episodes?: number;
  aired?: {
    string: string;
  };
  duration?: string;
  season?: string;
  year?: number;
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
    string?: string;
  };
  producers?: Array<{ mal_id: number; name: string; type: string }>;
  licensors?: Array<{ mal_id: number; name: string; type: string }>;
  studios?: Array<{ mal_id: number; name: string; type: string }>;
  genres?: Array<{ mal_id: number; name: string; type: string }>;
  themes?: Array<{ mal_id: number; name: string; type: string }>;
  demographics?: Array<{ mal_id: number; name: string; type: string }>;
}

export interface JikanAnimeResponse extends JikanResponse<JikanAnime[]> {}

export interface JikanAnimeDetailResponse extends JikanResponse<JikanAnime> {}

export interface JikanGenre {
  mal_id: number;
  name: string;
  type: string;
  count: number;
}

export interface JikanGenreResponse extends JikanResponse<JikanGenre[]> {}

export interface JikanSchedule {
  mal_id: number;
  url: string;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
    webp: {
      image_url: string;
    };
  };
  synopsis: string;
  type: string;
  rank: number;
  score: number;
  aired: {
    string: string;
  };
  broadcast: {
    day: string;
    time: string;
    timezone: string;
    string: string;
  };
  producers: Array<{ mal_id: number; name: string }>;
  genres: Array<{ mal_id: number; name: string }>;
}

export interface ScheduleDay {
  [key: string]: JikanSchedule[];
}

export interface JikanError {
  status: number;
  type: string;
  messages: {
    error: string;
  };
}

export type ScheduleWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ScheduleItem {
  malId: number;
  title: string;
  imageUrl?: string | null;
  type?: string | null;
  totalEpisodes?: number | null;
  timeLabel?: string | null;
  broadcastTime?: string | null;
  broadcastTimezone?: string | null;
  weekday: ScheduleWeekday;
  timeLabelCR?: string | null;
}
