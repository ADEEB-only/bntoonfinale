import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Info, Bookmark } from "lucide-react";
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
  banner_url?: string | null;
  description?: string | null;
  status: string;
  type?: string;
  chaptersCount?: number;
  genres?: Genre[];
}

interface FeaturedHeroProps {
  series: FeaturedSeries[];
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ongoing: { color: "bg-emerald-500", label: "Ongoing" },
  completed: { color: "bg-blue-500", label: "Completed" },
  hiatus: { color: "bg-amber-500", label: "Hiatus" },
  cancelled: { color: "bg-red-500", label: "Cancelled" },
  dropped: { color: "bg-gray-500", label: "Dropped" },
};

export function FeaturedHero({ series }: FeaturedHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const featuredSeries = series.slice(0, 5);

  useEffect(() => {
    if (!isAutoPlaying || featuredSeries.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredSeries.length, currentIndex]);

  const handleTransition = (newIndex: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 150);
  };

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + featuredSeries.length) % featuredSeries.length;
    handleTransition(newIndex);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % featuredSeries.length;
    handleTransition(newIndex);
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    handleTransition(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (featuredSeries.length === 0) return null;

  const current = featuredSeries[currentIndex];
  const status = statusConfig[current.status] || statusConfig.ongoing;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[hsl(220,15%,6%)] via-[hsl(220,15%,8%)] to-background will-change-auto">
      {/* Cinematic Background with Banner or Cover Image */}
      <div className="absolute inset-0 overflow-hidden">
        {(current.banner_url || current.cover_url) && (
          <div
            key={current.id}
            className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            <img
              src={current.banner_url || current.cover_url || ''}
              alt=""
              className="w-full h-full object-cover object-center scale-110 blur-2xl transform-gpu"
              loading="eager"
            />
            {/* Multiple gradient overlays for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,15%,6%)] via-[hsl(220,15%,6%)/95%] to-[hsl(220,15%,6%)/70%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-[hsl(220,15%,6%)/50%]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,15%,6%)/80%] via-transparent to-transparent" />
          </div>
        )}
        
        {/* Ambient glow effect - simplified for performance */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative container mx-auto px-4 py-6 md:py-8 lg:py-10">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 lg:gap-10 items-center min-h-[280px] md:min-h-[320px]">
          
          {/* Left Content */}
          <div className={`order-2 lg:order-1 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Type Badge */}
            <div className="flex items-center gap-3 mb-4">
              {current.type && (
                <Badge 
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 border-0 ${
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
              <Badge className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 ${status.color} text-white border-0`}>
                {status.label}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.1] tracking-tight">
              {current.title}
            </h1>

            {/* Genre Tags */}
            {current.genres && current.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {current.genres.slice(0, 5).map((genre) => (
                  <span
                    key={genre.id}
                    className="text-xs font-medium text-white bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1 hover:bg-white/30 transition-colors cursor-default"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {current.description && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4 max-w-xl">
                {current.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mb-5">
              {current.chaptersCount !== undefined && current.chaptersCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-white">{current.chaptersCount} Chapters</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link to={`/series/${current.id}`}>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 text-sm rounded-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Now
                </Button>
              </Link>
              <Link to={`/series/${current.id}`}>
                <Button 
                  variant="outline"
                  className="border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white font-medium px-5 py-2.5 text-sm rounded-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Details
                </Button>
              </Link>
            </div>
          </div>

          {/* Right - Cover Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative group">
              {/* Glow effect behind cover */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent rounded-2xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              
              {/* Cover Image */}
              <Link 
                to={`/series/${current.id}`}
                className={`relative block transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
              >
                <div className="relative aspect-[3/4] w-44 md:w-52 lg:w-60 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 group-hover:ring-primary/50 transition-all duration-500">
                  {current.cover_url ? (
                    <LazyImage
                      src={current.cover_url}
                      alt={current.title}
                      aspectRatio="aspect-[3/4]"
                      className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                      preload={true}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                      <span className="font-display text-7xl font-bold text-muted-foreground/30">
                        {current.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay gradient on cover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {featuredSeries.length > 1 && (
          <div className="flex items-center justify-center lg:justify-start gap-4 mt-5">
            {/* Prev Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="h-11 w-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            {/* Progress Dots */}
            <div className="flex items-center gap-2">
              {featuredSeries.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "w-8 bg-primary" 
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Next Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { handleNext(); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 10000); }}
              className="h-11 w-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all duration-300"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
