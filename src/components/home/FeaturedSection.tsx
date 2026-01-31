import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface FeaturedSeries {
  id: string;
  title: string;
  cover_url?: string | null;
  description?: string | null;
  status: string;
  type?: string;
  chaptersCount?: number;
  genres?: Genre[];
}

interface FeaturedSectionProps {
  series: FeaturedSeries[];
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ongoing: { color: "bg-emerald-500", label: "Ongoing" },
  completed: { color: "bg-blue-500", label: "Completed" },
  hiatus: { color: "bg-amber-500", label: "Hiatus" },
  cancelled: { color: "bg-red-500", label: "Cancelled" },
  dropped: { color: "bg-gray-500", label: "Dropped" },
};

export function FeaturedSection({ series }: FeaturedSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const featuredSeries = series.slice(0, 5);

  useEffect(() => {
    if (!isAutoPlaying || featuredSeries.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredSeries.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredSeries.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredSeries.length) % featuredSeries.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredSeries.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (featuredSeries.length === 0) return null;

  const current = featuredSeries[currentIndex];
  const status = statusConfig[current.status] || statusConfig.ongoing;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h2 className="font-display text-xl font-bold text-foreground">Featured</h2>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {/* Cover Image */}
          <Link 
            to={`/series/${current.id}`}
            className="shrink-0 group"
          >
            <div className="relative w-full sm:w-32 md:w-36 aspect-[3/4] overflow-hidden rounded-lg ring-1 ring-border group-hover:ring-primary/50 transition-all">
              {current.cover_url ? (
                <LazyImage
                  src={current.cover_url}
                  alt={current.title}
                  aspectRatio="aspect-[3/4]"
                  className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                  preload={true}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="font-display text-4xl font-bold text-muted-foreground/30">
                    {current.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {current.type && (
                <Badge 
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border-0 ${
                    current.type === 'manga' 
                      ? 'bg-rose-500 text-white' 
                      : current.type === 'manhua'
                      ? 'bg-amber-500 text-white'
                      : 'bg-sky-500 text-white'
                  }`}
                >
                  {current.type}
                </Badge>
              )}
              <Badge className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${status.color} text-white border-0`}>
                {status.label}
              </Badge>
              {current.chaptersCount !== undefined && current.chaptersCount > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {current.chaptersCount} Ch
                </span>
              )}
            </div>

            {/* Title */}
            <Link to={`/series/${current.id}`}>
              <h3 className="font-display text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2">
                {current.title}
              </h3>
            </Link>

            {/* Genres */}
            {current.genres && current.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {current.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre.id}
                    className="text-[10px] font-medium text-muted-foreground bg-muted rounded px-2 py-0.5"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {current.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {current.description}
              </p>
            )}

            {/* Read Button */}
            <div className="mt-auto">
              <Link to={`/series/${current.id}`}>
                <Button size="sm" className="text-xs">
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                  Read Now
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {featuredSeries.length > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {featuredSeries.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "w-6 bg-primary" 
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
