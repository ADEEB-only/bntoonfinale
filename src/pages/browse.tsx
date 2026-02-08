import { Layout } from "@/components/layout/Layout";
import { BrowseCard } from "@/components/browse/BrowseCard";
import { useBrowseSeries } from "@/hooks/useBrowseSeries";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useGenres } from "@/hooks/useGenres";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BackToTop } from "@/components/ui/back-to-top";
import { BookOpen, X, Filter, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MiniBannerAd } from "@/components/ads/AdBanner";

const Browse = () => {
  const { data, isLoading: seriesLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useBrowseSeries();

  const { data: genres, isLoading: genresLoading } = useGenres();

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [seriesGenresMap, setSeriesGenresMap] = useState<Record<string, string[]>>({});
  const [loadingGenreMap, setLoadingGenreMap] = useState(true);

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  /* Flatten paginated series */
  const allSeries = useMemo(() => data?.pages.flatMap((page) => page.series) ?? [], [data]);

  /* Fetch series-genre relations */
  useEffect(() => {
    const fetchSeriesGenres = async () => {
      const { data, error } = await supabase.from("series_genres").select("series_id, genre_id");

      if (!error && data) {
        const map: Record<string, string[]> = {};
        data.forEach((sg) => {
          if (!map[sg.series_id]) map[sg.series_id] = [];
          map[sg.series_id].push(sg.genre_id);
        });
        setSeriesGenresMap(map);
      }

      setLoadingGenreMap(false);
    };

    fetchSeriesGenres();
  }, []);

  /* Genre controls */
  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => (prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]));
  };

  const clearFilters = () => setSelectedGenres([]);

  /* Filtering logic */
  const filteredSeries = useMemo(() => {
    return allSeries.filter((s) => {
      if (selectedGenres.length === 0) return true;
      return selectedGenres.every((gid) => seriesGenresMap[s.id]?.includes(gid));
    });
  }, [allSeries, selectedGenres, seriesGenresMap]);

  const isLoading = seriesLoading || genresLoading || loadingGenreMap;
  const hasActiveFilters = selectedGenres.length > 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Browse Series</h1>
          <p className="text-muted-foreground">Explore our collection of comics and manga</p>
        </div>

        {/* Top Banner Ad */}
        <div className="mb-8 flex justify-center">
          <MiniBannerAd />
        </div>

        {/* Genre Filters */}
        {!genresLoading && genres?.length > 0 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter by genre:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition
                    ${
                      selectedGenres.includes(genre.id)
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {selectedGenres.map((gid) => {
                  const genre = genres.find((g) => g.id === gid);
                  return (
                    genre && (
                      <Badge key={gid} variant="outline" className="gap-1">
                        {genre.name}
                        <button onClick={() => toggleGenre(gid)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  );
                })}
                <button onClick={clearFilters} className="text-sm underline text-muted-foreground">
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] rounded-xl" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredSeries.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredSeries.map((s) => (
                <BrowseCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  coverUrl={s.cover_url} // ✅ important fix
                  status={s.status}
                  type={s.type}
                  chaptersCount={s.chaptersCount}
                />
              ))}
            </div>

            {/* Mid-page Banner Ad */}
            <div className="my-10 flex justify-center">
              <MiniBannerAd />
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={loadMoreRef} className="mt-10 flex justify-center">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more...</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-12 w-12 opacity-40 mb-4" />
            <p>No series found.</p>
          </div>
        )}
      </div>

      <BackToTop />
    </Layout>
  );
};

export default Browse;
