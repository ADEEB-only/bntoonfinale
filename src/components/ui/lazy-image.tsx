import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: string;
  placeholderClassName?: string;
  preload?: boolean;
  rootMargin?: string;
  threshold?: number;
  onLoadComplete?: () => void;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  aspectRatio = "aspect-[3/4]",
  placeholderClassName,
  preload = false,
  rootMargin = "200px 0px",
  threshold = 0.01,
  onLoadComplete,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(preload);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preload || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [preload, rootMargin, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden bg-muted", aspectRatio, className)}
    >
      {/* Skeleton placeholder with shimmer */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%] transition-opacity duration-300",
          isLoaded ? "opacity-0" : "opacity-100",
          placeholderClassName
        )}
      />

      {/* Blurred low-quality placeholder effect */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm" />
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-xs">Failed to load</span>
        </div>
      )}
    </div>
  );
});

// Hook for preloading images
export function useImagePreloader(urls: string[], preloadCount: number = 2) {
  useEffect(() => {
    const preloadImages = urls.slice(0, preloadCount);
    preloadImages.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [urls, preloadCount]);
}

// Hook for observing and preloading next images in a sequence
export function useSequentialPreloader(
  urls: string[],
  currentIndex: number,
  preloadAhead: number = 2
) {
  useEffect(() => {
    const startIndex = currentIndex + 1;
    const endIndex = Math.min(startIndex + preloadAhead, urls.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      if (urls[i]) {
        const img = new Image();
        img.src = urls[i];
      }
    }
  }, [urls, currentIndex, preloadAhead]);
}
