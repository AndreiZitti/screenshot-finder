export interface Series {
  id: string;
  name: string;
  synopsis: string | null;
  rating: string | null;
  seasons: string | null;
  genre: string | null;
  where_to_watch: string | null;
  image_url: string | null;
  created_at: string;
}

export interface AnalyzeResult {
  success: boolean;
  series?: Series;
  error?: string;
}
