import { useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  threshold?: number;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 200,
}: UseInfiniteScrollOptions) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!loadMoreRef.current || isFetchingNextPage || !hasNextPage) return;

    const rect = loadMoreRef.current.getBoundingClientRect();
    const isNearBottom = rect.top <= window.innerHeight + threshold;

    if (isNearBottom) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check in case the page isn't scrollable yet
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return { loadMoreRef };
}
