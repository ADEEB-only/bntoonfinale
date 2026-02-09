const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const DB_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/db`;

interface DbResponse<T> {
  data?: T;
  error?: string;
}

export async function dbQuery<T = unknown>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<DbResponse<T>> {
  try {
    const response = await fetch(DB_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ action, params }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Request failed" };
    }

    return { data: result.data as T };
  } catch (error) {
    console.error("Database query error:", error);
    return {
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Types
export interface Series {
  id: string;
  title: string;
  alternative_titles: string[] | null;
  description: string | null;
  cover_url: string | null;
  banner_url: string | null;
  status: string;
  type: string;
  rating: number | null;
  is_featured: boolean;
  total_views: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  series_id: string;
  chapter_number: number;
  title: string | null;
  chapter_type: string;
  pdf_url: string | null;
  created_at: string;
}

export interface ChapterPage {
  id: string;
  chapter_id: string;
  page_number: number;
  image_url: string;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface PopularSeries {
  id: string;
  title: string;
  cover_url: string | null;
  status: string;
  type: string;
  total_views: number;
  period_views: number;
}

export interface PopularSeriesWithGenres extends PopularSeries {
  genres: { id: string; name: string; slug: string }[];
}

export interface SearchResult {
  id: string;
  title: string;
  alternative_titles: string[] | null;
  description: string | null;
  cover_url: string | null;
  status: string;
  type: string;
  rating: number | null;
  is_featured: boolean;
  updated_at: string;
  chapters_count: number;
  relevance_score: number;
}

export interface SeriesWithChapters extends Series {
  latest_chapter_at: string | null;
  chapters: {
    id: string;
    chapter_number: number;
    title: string | null;
    created_at: string;
  }[];
}

export interface BrowseSeriesItem {
  id: string;
  title: string;
  cover_url: string | null;
  status: string;
  type: string;
  updated_at: string;
  chaptersCount: number;
}
