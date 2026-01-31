import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeaturedSeries {
  id: string;
  title: string;
  cover_url?: string | null;
  description?: string | null;
  status: string;
  chaptersCount?: number;
}

interface FeaturedCarouselProps {
  series: FeaturedSeries[];
}

export function FeaturedCarousel({ series }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const featuredSeries = series.slice(0, 5);

  useEffect(() => {
    if (!isAutoPlaying || featuredSeries.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredSeries.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredSeries.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredSeries.length) % featuredSeries.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredSeries.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (featuredSeries.length === 0) return null;

  const current = featuredSeries[currentIndex];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.05),transparent_50%)]" />
      
      {/* Animated Background Shapes */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-12 md:py-20 relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[400px] md:min-h-[450px]">
          {/* Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 mb-6 border border-white/10">
              <Flame className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-primary-foreground">
                Featured Series
              </span>
            </div>
            
            <h2 
              key={current.id}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 animate-fade-in leading-tight"
            >
              {current.title}
            </h2>
            
            {current.description && (
              <p 
                key={`desc-${current.id}`}
                className="text-primary-foreground/70 text-base md:text-lg mb-6 line-clamp-3 animate-fade-in max-w-lg mx-auto lg:mx-0"
              >
                {current.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-8 justify-center lg:justify-start">
              <Badge className="bg-accent text-accent-foreground px-3 py-1">
                {current.status}
              </Badge>
              {current.chaptersCount !== undefined && (
                <span className="text-sm text-primary-foreground/60 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {current.chaptersCount} Chapters
                </span>
              )}
            </div>

            <Link to={`/series/${current.id}`}>
              <Button size="lg" className="btn-accent text-base px-8 py-6 rounded-xl shadow-hero">
                <BookOpen className="mr-2 h-5 w-5" />
                Read Now
              </Button>
            </Link>
          </div>

          {/* Cover Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-br from-accent/30 via-accent/10 to-transparent rounded-2xl blur-2xl" />
              
              <Link 
                to={`/series/${current.id}`}
                className="relative block aspect-[3/4] w-48 md:w-64 lg:w-72 overflow-hidden rounded-2xl shadow-hero ring-1 ring-white/10 transform transition-transform duration-500 hover:scale-105"
              >
                {current.cover_url ? (
                  <img
                    key={`img-${current.id}`}
                    src={current.cover_url}
                    alt={current.title}
                    className="h-full w-full object-cover animate-scale-in"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
                    <span className="font-display text-6xl font-bold text-muted-foreground/30">
                      {current.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {featuredSeries.length > 1 && (
          <div className="flex items-center justify-center lg:justify-start gap-4 mt-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrev}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-primary-foreground border border-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            {/* Dots */}
            <div className="flex gap-2">
              {featuredSeries.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "w-8 bg-accent" 
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-primary-foreground border border-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
