import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageReaderProps {
  pages: { id: string; page_number: number; image_url: string }[];
}

export function ImageReader({ pages }: ImageReaderProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number);

  return (
    <div className="flex flex-col items-center bg-background">
      {sortedPages.map((page) => (
        <div key={page.id} className="w-full max-w-4xl">
          {!loadedImages.has(page.id) && (
            <Skeleton className="w-full aspect-[2/3]" />
          )}
          <img
            src={page.image_url}
            alt={`Page ${page.page_number}`}
            className={`w-full h-auto ${loadedImages.has(page.id) ? "block" : "hidden"}`}
            onLoad={() => handleImageLoad(page.id)}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
