export type MediaType = 'movie' | 'series' | 'anime';

export type MediaStatus = 'watching' | 'plan_to_watch' | 'completed' | 'on_hold' | 'dropped';

export interface EpisodeDetail {
  episode_number: number;
  title?: string;
  watched: boolean;
  watched_at?: string;
}

export interface SeasonProgress {
  season_number: number;
  name: string;
  episodes_count: number;
  episodes_watched: number;
  episodes?: EpisodeDetail[];
}

export interface MediaItem {
  id: string;
  title: string;
  original_title?: string;
  type: MediaType;
  status: MediaStatus;
  poster_url?: string;
  banner_url?: string;
  rating: number; // 0 to 10
  genres: string[];
  year?: number;
  episodes_total: number;
  episodes_watched: number;
  episode_duration_minutes: number; // e.g. 24 for anime, 50 for series, 120 for movies
  total_seasons?: number;
  current_season?: number;
  synopsis?: string;
  personal_notes?: string;
  favorite: boolean;
  start_date?: string;
  finish_date?: string;
  seasons?: SeasonProgress[];
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSync?: string;
}
