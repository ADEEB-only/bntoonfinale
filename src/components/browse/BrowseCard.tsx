import { Link } from "react-router-dom";
import { LazyImage } from "@/components/ui/lazy-image";

interface BrowseCardProps {
  id: string;
  title: string;
  coverUrl?: string | null;
  status: string;
  type: string;
  chaptersCount: number;
}

export function BrowseCard({
  id,
  title,
  coverUrl,
  status,
  type,
  chaptersCount,
}: BrowseCardProps) {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Link to={`/series/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Cover Image Container */}
        <div className="relative overflow-hidden">
          {coverUrl ? (
            <LazyImage
              src={coverUrl}
              alt={title}
              aspectRatio="aspect-[2/3]"
              className="w-full transition-transform duration-500 ease-out group-hover:scale-105"
              rootMargin="100px 0px"
            />
          ) : (
            <div className="aspect-[2/3] flex items-center justify-center bg-muted">
              <span className="font-display text-4xl font-bold text-muted-foreground/20">
                {title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Subtle bottom gradient for readability */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Type badge - top left */}
          <div className="absolute top-2 left-2 z-10">
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur-sm shadow-sm">
              {typeLabel}
            </span>
          </div>

          {/* Status badge - top right */}
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur-sm shadow-sm">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 space-y-1.5">
          {/* Title */}
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>

          {/* Total Chapters */}
          <p className="text-xs text-muted-foreground">
            {chaptersCount} {chaptersCount === 1 ? 'Chapter' : 'Chapters'}
          </p>
        </div>
      </div>
    </Link>
  );
}
