import { useQuery } from "@tanstack/react-query";
import { dbQuery, SearchResult } from "@/lib/db";

export type { SearchResult };

export interface SearchFilters {
  query: string;
  status?: string | null;
  type?: string | null;
  genres?: string[];
  sortBy?: "relevance" | "latest" | "title" | "rating";
  limit?: number;
  offset?: number;
}

export function useAdvancedSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: async (): Promise<SearchResult[]> => {
      const { data, error } = await dbQuery<SearchResult[]>("search_series", {
        search_query: filters.query || null,
        filter_status: filters.status || null,
        filter_type: filters.type || null,
        filter_genres: filters.genres?.length ? filters.genres : null,
        sort_by: filters.sortBy || "relevance",
        result_limit: filters.limit || 20,
        result_offset: filters.offset || 0,
      });

      if (error) throw new Error(error);
      return data || [];
    },
    enabled:
      filters.query.length > 0 ||
      !!filters.status ||
      !!filters.type ||
      (filters.genres?.length || 0) > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Quick search for header (simpler, faster)
export function useQuickSearch(query: string) {
  return useQuery({
    queryKey: ["quick-search", query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query.trim()) return [];

      const { data, error } = await dbQuery<SearchResult[]>("search_series", {
        search_query: query.trim(),
        filter_status: null,
        filter_type: null,
        filter_genres: null,
        sort_by: "relevance",
        result_limit: 8,
        result_offset: 0,
      });

      if (error) throw new Error(error);
      return data || [];
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 30,
  });
}
