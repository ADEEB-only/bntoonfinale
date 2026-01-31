import { useQuery } from "@tanstack/react-query";
import { dbQuery, SeriesWithChapters } from "@/lib/db";

export type { SeriesWithChapters };

export function useSeriesWithLatestChapters(limit: number = 12) {
  return useQuery({
    queryKey: ["series-with-latest-chapters", limit],
    queryFn: async (): Promise<SeriesWithChapters[]> => {
      const { data, error } = await dbQuery<SeriesWithChapters[]>(
        "get_series_with_latest_chapters",
        { limit }
      );
      if (error) throw new Error(error);
      return data || [];
    },
  });
}

// Hook to get featured series only with genres
export function useFeaturedSeries() {
  return useQuery({
    queryKey: ["featured-series"],
    queryFn: async () => {
      const { data, error } = await dbQuery<
        {
          id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          banner_url: string | null;
          status: string;
          type: string;
          rating: number | null;
          is_featured: boolean;
          chaptersCount: number;
          genres: { id: string; name: string; slug: string }[];
        }[]
      >("get_featured_series");

      if (error) throw new Error(error);
      return data || [];
    },
  });
}
