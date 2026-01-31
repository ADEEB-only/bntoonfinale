import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbQuery, Genre } from "@/lib/db";

export type { Genre };

export interface SeriesGenre {
  id: string;
  series_id: string;
  genre_id: string;
  created_at: string;
}

// Fetch all genres
export function useGenres() {
  return useQuery({
    queryKey: ["genres"],
    queryFn: async () => {
      const { data, error } = await dbQuery<Genre[]>("get_genres");
      if (error) throw new Error(error);
      return data || [];
    },
  });
}

// Fetch genres for a specific series
export function useSeriesGenres(seriesId: string) {
  return useQuery({
    queryKey: ["series-genres", seriesId],
    queryFn: async () => {
      const { data, error } = await dbQuery<Genre[]>("get_series_genres", {
        series_id: seriesId,
      });
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!seriesId,
  });
}

// Update genres for a series (admin only)
export function useUpdateSeriesGenres() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      seriesId,
      genreIds,
    }: {
      seriesId: string;
      genreIds: string[];
    }) => {
      const { error } = await dbQuery("update_series_genres", {
        series_id: seriesId,
        genre_ids: genreIds,
      });
      if (error) throw new Error(error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["series-genres", variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: ["series-with-chapters-and-genres"] });
    },
  });
}

// Create a new genre (admin only)
export function useCreateGenre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const { data, error } = await dbQuery<Genre>("create_genre", { name, slug });
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
    },
  });
}

// Delete a genre (admin only)
export function useDeleteGenre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await dbQuery("delete_genre", { id });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
    },
  });
}

// Update a genre (admin only)
export function useUpdateGenre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const { data, error } = await dbQuery<Genre>("update_genre", { id, name, slug });
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
    },
  });
}
