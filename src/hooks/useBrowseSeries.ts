import { useInfiniteQuery } from "@tanstack/react-query";
import { dbQuery, BrowseSeriesItem } from "@/lib/db";

export type { BrowseSeriesItem };

export function useBrowseSeries() {
  return useInfiniteQuery({
    queryKey: ["browse-series"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await dbQuery<{
        series: BrowseSeriesItem[];
        nextPage: number | undefined;
      }>("get_browse_series", { page: pageParam });

      if (error) throw new Error(error);
      return data!;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
