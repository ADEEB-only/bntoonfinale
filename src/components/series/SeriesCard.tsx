import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";

interface SeriesCardProps {
  id: string;
  title: string;
  coverUrl?: string | null;
  status: string;
  type?: string;
  rating?: number | null;
  chaptersCount?: number;
  showStatus?: boolean;
}

const statusColors: Record<string, string> = {
  ongoing: "bg-green-500",
  completed: "bg-blue-500",
  hiatus: "bg-yellow-500",
  cancelled: "bg-red-500",
  dropped: "bg-gray-500",
};

export function SeriesCard({ id, title, coverUrl, status, type = "manhwa", rating, chaptersCount, showStatus = true }: SeriesCardProps) {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <Link to={`/series/${id}`} className="group block">
      <div className="overflow-hidden rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
        {/* Cover Image with Lazy Loading */}
        <div className="relative">
          {coverUrl ? (
            <LazyImage
              src={coverUrl}
              alt={title}
              aspectRatio="aspect-[3/4]"
              className="w-full transition-transform duration-300 group-hover:scale-105"
              rootMargin="100px 0px"
            />
          ) : (
            <div className="aspect-[3/4] flex items-center justify-center bg-muted">
              <span className="font-display text-3xl font-bold text-muted-foreground/30">
                {title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Badge overlay */}
          <div className="absolute top-2 left-2 z-10">
            <Badge 
              className={`text-[10px] px-1.5 py-0 ${
                type === 'manga' 
                  ? 'bg-red-600 text-white' 
                  : type === 'manhua'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {typeLabel.toUpperCase()}
            </Badge>
          </div>

          {/* Status badge */}
          {showStatus && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className={`text-[10px] px-1.5 py-0 text-white ${statusColors[status] || statusColors.ongoing}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
          )}

          {/* Chapter count */}
          {chaptersCount !== undefined && (
            <div className="absolute bottom-2 right-2 z-10">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">
                Ch. {chaptersCount}
              </span>
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="p-2">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          {rating !== null && rating !== undefined && (
            <div className="flex items-center gap-1 mt-1 text-yellow-500 text-[10px]">
              <Star className="h-3 w-3 fill-yellow-500" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
