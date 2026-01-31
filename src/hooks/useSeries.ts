import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbQuery, Series, Chapter, ChapterPage } from "@/lib/db";

export type { Series, Chapter, ChapterPage };

// Fetch all series
export function useAllSeries() {
  return useQuery({
    queryKey: ["series"],
    queryFn: async () => {
      const { data, error } = await dbQuery<Series[]>("get_all_series");
      if (error) throw new Error(error);
      return data || [];
    },
  });
}

// Fetch series with chapter count
export function useSeriesWithChapterCount() {
  return useQuery({
    queryKey: ["series-with-chapters"],
    queryFn: async () => {
      const { data, error } = await dbQuery<(Series & { chapters_count: number })[]>(
        "get_series_with_chapter_count"
      );
      if (error) throw new Error(error);
      return (data || []).map((s) => ({ ...s, chaptersCount: s.chapters_count }));
    },
  });
}

// Fetch single series
export function useSeries(id: string) {
  return useQuery({
    queryKey: ["series", id],
    queryFn: async () => {
      const { data, error } = await dbQuery<Series>("get_series", { id });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!id,
  });
}

// Fetch chapters for a series
export function useChapters(seriesId: string) {
  return useQuery({
    queryKey: ["chapters", seriesId],
    queryFn: async () => {
      const { data, error } = await dbQuery<Chapter[]>("get_chapters", {
        series_id: seriesId,
      });
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!seriesId,
  });
}

// Fetch single chapter with pages
export function useChapter(chapterId: string) {
  return useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: async () => {
      const { data, error } = await dbQuery<{
        chapter: Chapter;
        pages: ChapterPage[];
      }>("get_chapter", { id: chapterId });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!chapterId,
  });
}

// Create series mutation
export function useCreateSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      alternative_titles?: string[];
      description?: string;
      cover_url?: string;
      banner_url?: string;
      status: string;
      type?: string;
      rating?: number | null;
      is_featured?: boolean;
    }) => {
      const { data: result, error } = await dbQuery<Series>("create_series", data);
      if (error) throw new Error(error);
      return result!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["series-with-chapters"] });
    },
  });
}

// Update series mutation
export function useUpdateSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      alternative_titles?: string[];
      description?: string;
      cover_url?: string;
      banner_url?: string;
      status?: string;
      type?: string;
      rating?: number | null;
      is_featured?: boolean;
    }) => {
      const { data: result, error } = await dbQuery<Series>("update_series", {
        id,
        ...data,
      });
      if (error) throw new Error(error);
      return result!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["series", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["series-with-chapters"] });
    },
  });
}

// Delete series mutation
export function useDeleteSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await dbQuery("delete_series", { id });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["series-with-chapters"] });
    },
  });
}

// Create chapter mutation
export function useCreateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      series_id: string;
      chapter_number: number;
      title?: string;
      chapter_type: string;
      pdf_url?: string;
      pages?: { page_number: number; image_url: string }[];
    }) => {
      const { data: result, error } = await dbQuery<Chapter>("create_chapter", data);
      if (error) throw new Error(error);
      return result!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.series_id] });
      queryClient.invalidateQueries({ queryKey: ["series-with-chapters"] });
    },
  });
}

// Delete chapter mutation
export function useDeleteChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, seriesId }: { id: string; seriesId: string }) => {
      const { error } = await dbQuery("delete_chapter", { id });
      if (error) throw new Error(error);
      return seriesId;
    },
    onSuccess: (seriesId) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", seriesId] });
      queryClient.invalidateQueries({ queryKey: ["series-with-chapters"] });
      queryClient.invalidateQueries({ queryKey: ["series-with-latest-chapters"] });
    },
  });
}

// Update chapter mutation
export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      seriesId,
      chapter_number,
      title,
    }: {
      id: string;
      seriesId: string;
      chapter_number?: number;
      title?: string | null;
    }) => {
      const { data, error } = await dbQuery<Chapter>("update_chapter", {
        id,
        chapter_number,
        title,
      });
      if (error) throw new Error(error);
      return { chapter: data!, seriesId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", result.seriesId] });
      queryClient.invalidateQueries({ queryKey: ["chapter", result.chapter.id] });
      queryClient.invalidateQueries({ queryKey: ["series-with-latest-chapters"] });
    },
  });
}
