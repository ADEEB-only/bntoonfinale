import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbQuery, PopularSeries } from "@/lib/db";

export type { PopularSeries };

export type TimePeriod = "weekly" | "monthly" | "all";

// Get popular series by time period
export function usePopularSeries(period: TimePeriod = "all", limit: number = 10) {
  return useQuery({
    queryKey: ["popular-series", period, limit],
    queryFn: async (): Promise<PopularSeries[]> => {
      const { data, error } = await dbQuery<PopularSeries[]>("get_popular_series", {
        time_period: period,
        result_limit: limit,
      });
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get total views for a specific series
export function useSeriesViews(seriesId: string) {
  return useQuery({
    queryKey: ["series-views", seriesId],
    queryFn: async () => {
      const { data, error } = await dbQuery<number>("get_series_views", {
        series_id: seriesId,
      });
      if (error) throw new Error(error);
      return data || 0;
    },
    enabled: !!seriesId,
  });
}

// Generate a simple viewer hash for session-based duplicate prevention
function getViewerHash(): string {
  const existing = sessionStorage.getItem("viewer_hash");
  if (existing) return existing;

  const hash =
    Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  sessionStorage.setItem("viewer_hash", hash);
  return hash;
}

// Record a chapter view
export function useRecordView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapterId,
      seriesId,
    }: {
      chapterId: string;
      seriesId: string;
    }) => {
      const viewerHash = getViewerHash();

      // Check if already viewed this chapter in this session
      const viewedKey = `viewed_${chapterId}`;
      if (sessionStorage.getItem(viewedKey)) {
        return; // Already viewed in this session
      }

      const { error } = await dbQuery("record_chapter_view", {
        chapter_id: chapterId,
        series_id: seriesId,
        viewer_hash: viewerHash,
      });

      if (error) throw new Error(error);

      // Mark as viewed in this session
      sessionStorage.setItem(viewedKey, "true");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["series-views", variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: ["popular-series"] });
    },
  });
}

// Format view count for display
export function formatViewCount(views: number): string {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + "M";
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + "K";
  }
  return views.toString();
}
