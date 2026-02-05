import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useSeries, useChapters } from "@/hooks/useSeries";
import { useSeriesGenres } from "@/hooks/useGenres";
import { useSeriesViews, formatViewCount } from "@/hooks/useViews";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Calendar, Tag, Star, Eye, ArrowUpDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
 import { CommentSection } from "@/components/comments/CommentSection";

const SeriesPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: series, isLoading: seriesLoading } = useSeries(id || "");
  const { data: chapters, isLoading: chaptersLoading } = useChapters(id || "");
  const { data: genres } = useSeriesGenres(id || "");
  const { data: totalViews } = useSeriesViews(id || "");
  const { isAdmin } = useAuth();
  const [sortDescending, setSortDescending] = useState(true);

  const statusColors = {
    ongoing: "bg-green-500 text-white",
    completed: "bg-blue-500 text-white",
    hiatus: "bg-yellow-500 text-white",
    cancelled: "bg-red-500 text-white",
    dropped: "bg-gray-500 text-white",
  };

  if (seriesLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid md:grid-cols-[300px_1fr] gap-8">
            <Skeleton className="aspect-[3/4] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!series) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Series not found</h1>
          <Link to="/browse">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <Link to="/browse" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Link>

        {/* Series Info */}
        <div className="grid md:grid-cols-[280px_1fr] gap-8 mb-12">
          {/* Cover */}
          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-card">
            {series.cover_url ? (
              <img
                src={series.cover_url}
                alt={series.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-secondary">
                <span className="font-display text-6xl font-bold text-muted-foreground/30">
                  {series.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {series.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className={statusColors[series.status as keyof typeof statusColors] || statusColors.ongoing}>
                {series.status.charAt(0).toUpperCase() + series.status.slice(1)}
              </Badge>
              {series.rating !== null && series.rating !== undefined && (
                <span className="text-sm font-medium flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-yellow-500" />
                  {Number(series.rating).toFixed(1)} / 10
                </span>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {chapters?.length || 0} Chapters
              </span>
              {isAdmin && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatViewCount(totalViews || 0)} Views
                </span>
              )}
            </div>

            {/* Genre Tags */}
            {genres && genres.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {genres.map((genre) => (
                  <Badge
                    key={genre.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}

            {series.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {series.description}
                </p>
              </div>
            )}

            {chapters && chapters.length > 0 && (
              <Link to={`/read/${chapters[0].id}`} className="mt-6 inline-block">
                <Button size="lg" className="btn-accent">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Start Reading
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Chapters List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              Chapters
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortDescending(!sortDescending)}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="text-xs">{sortDescending ? "Latest First" : "Oldest First"}</span>
            </Button>
          </div>

          {chaptersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : chapters && chapters.length > 0 ? (
            <div className="divide-y divide-border rounded-xl bg-card shadow-card overflow-hidden">
              {[...chapters]
                .sort((a, b) => sortDescending 
                  ? b.chapter_number - a.chapter_number 
                  : a.chapter_number - b.chapter_number
                )
                .map((chapter) => {
                const isNew = Date.now() - new Date(chapter.created_at).getTime() < 24 * 60 * 60 * 1000;
                return (
                  <Link
                    key={chapter.id}
                    to={`/read/${chapter.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                          {chapter.chapter_number}
                        </div>
                        <div>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            <span>
                              Chapter {chapter.chapter_number}
                              {chapter.title && <span className="text-muted-foreground font-normal"> - {chapter.title}</span>}
                            </span>
                            {isNew && (
                              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                                NEW
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(chapter.created_at), { addSuffix: true }).replace(/^about /, '')}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <Badge variant="outline" className="capitalize text-xs">
                          {chapter.chapter_type}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl shadow-card">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No chapters available yet.</p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        {id && <CommentSection seriesId={id} />}
      </div>
    </Layout>
  );
};

export default SeriesPage;
