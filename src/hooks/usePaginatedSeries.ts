import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Series } from "./useSeries";

const PAGE_SIZE = 18;

export interface SeriesWithCount extends Series {
  chaptersCount: number;
}

export function usePaginatedSeries() {
  return useInfiniteQuery({
    queryKey: ["series-paginated"],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Fetch series with pagination
      const { data: seriesData, error: seriesError } = await supabase
        .from("series")
        .select("*")
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (seriesError) throw seriesError;

      // Fetch chapter counts for these series
      const seriesWithCounts = await Promise.all(
        (seriesData as Series[]).map(async (series) => {
          const { count } = await supabase
            .from("chapters")
            .select("*", { count: "exact", head: true })
            .eq("series_id", series.id);

          return { ...series, chaptersCount: count || 0 };
        })
      );

      return {
        series: seriesWithCounts,
        nextPage: seriesData.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
