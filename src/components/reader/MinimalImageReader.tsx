import { useState, useRef, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";

interface Page {
  id: string;
  page_number: number;
  image_url: string;
}

interface MinimalImageReaderProps {
  pages: Page[];
}

const PRELOAD_AHEAD = 3;
const ROOT_MARGIN = "600px 0px";

// Individual page component with lazy loading
const ReaderPage = memo(function ReaderPage({
  page,
  isPreloaded,
  onBecomeVisible,
}: {
  page: Page;
  isPreloaded: boolean;
  onBecomeVisible: (pageNumber: number) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(isPreloaded);
  const [hasError, setHasError] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            onBecomeVisible(page.page_number);
            observer.disconnect();
          }
        });
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isInView, page.page_number, onBecomeVisible]);

  // Preload when isPreloaded changes
  useEffect(() => {
    if (isPreloaded && !isInView) {
      setIsInView(true);
    }
  }, [isPreloaded, isInView]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Calculate aspect ratio for placeholder to prevent layout shift
  const aspectRatio = naturalDimensions
    ? `${naturalDimensions.width} / ${naturalDimensions.height}`
    : "2 / 3";

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      style={{ aspectRatio: isLoaded ? undefined : aspectRatio }}
    >
      {/* Minimal loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          src={page.image_url}
          alt={`Page ${page.page_number}`}
          className={cn(
            "w-full h-auto block",
            "transition-opacity duration-200 ease-out",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="w-full aspect-[2/3] flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Failed to load</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoaded(false);
              }}
              className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export function MinimalImageReader({ pages }: MinimalImageReaderProps) {
  const [visiblePage, setVisiblePage] = useState(0);
  const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number);

  const handleBecomeVisible = useCallback((pageNumber: number) => {
    setVisiblePage(pageNumber);
  }, []);

  // Determine which pages should be preloaded
  const preloadedPages = new Set<number>();
  for (let i = 0; i <= PRELOAD_AHEAD; i++) {
    preloadedPages.add(visiblePage + i);
  }
  // Always preload first few pages
  for (let i = 1; i <= 3; i++) {
    preloadedPages.add(i);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {sortedPages.map((page) => (
        <ReaderPage
          key={page.id}
          page={page}
          isPreloaded={preloadedPages.has(page.page_number)}
          onBecomeVisible={handleBecomeVisible}
        />
      ))}
    </div>
  );
}
