import { useQuery } from "@tanstack/react-query";
import { dbQuery, PopularSeriesWithGenres } from "@/lib/db";
import { TimePeriod } from "./useViews";

export type { PopularSeriesWithGenres };

export function usePopularSeriesWithGenres(
  period: TimePeriod = "all",
  limit: number = 10
) {
  return useQuery({
    queryKey: ["popular-series-with-genres", period, limit],
    queryFn: async (): Promise<PopularSeriesWithGenres[]> => {
      const { data, error } = await dbQuery<PopularSeriesWithGenres[]>(
        "get_popular_series_with_genres",
        {
          time_period: period,
          result_limit: limit,
        }
      );
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
