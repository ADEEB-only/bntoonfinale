import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { LazyImage } from "@/components/ui/lazy-image";

interface Chapter {
  id: string;
  chapter_number: number;
  title: string | null;
  created_at: string;
}

interface LatestUpdateCardProps {
  id: string;
  title: string;
  coverUrl?: string | null;
  status: string;
  type?: string;
  chapters: Chapter[];
}

const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'ongoing':
      return 'bg-green-500/20 text-green-500';
    case 'completed':
      return 'bg-blue-500/20 text-blue-500';
    case 'hiatus':
      return 'bg-yellow-500/20 text-yellow-500';
    case 'cancelled':
      return 'bg-red-500/20 text-red-500';
    case 'dropped':
      return 'bg-gray-500/20 text-gray-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function LatestUpdateCard({ id, title, coverUrl, status, type = "manhwa", chapters }: LatestUpdateCardProps) {
  const recentChapters = chapters.slice(0, 3);

  return (
    <div className="flex gap-3 p-3 hover:bg-muted/30 transition-colors">
      {/* Cover Thumbnail with Lazy Loading */}
      <Link to={`/series/${id}`} className="shrink-0">
        <div className="w-[70px] rounded-md overflow-hidden ring-1 ring-border hover:ring-primary/50 transition-all">
          {coverUrl ? (
            <LazyImage
              src={coverUrl}
              alt={title}
              aspectRatio="aspect-[3/4]"
              className="w-full"
              rootMargin="50px 0px"
            />
          ) : (
            <div className="w-full aspect-[3/4] flex items-center justify-center bg-muted text-muted-foreground/30 font-bold text-xl">
              {title.charAt(0)}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/series/${id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          <Badge 
            variant="secondary" 
            className={`shrink-0 text-[10px] px-1.5 py-0 h-5 ${getStatusStyle(status)}`}
          >
            {status.toUpperCase()}
          </Badge>
        </div>

        {/* Chapters List */}
        <div className="space-y-1">
          {recentChapters.length > 0 ? (
            recentChapters.map((chapter) => {
              const isNew = Date.now() - new Date(chapter.created_at).getTime() < 24 * 60 * 60 * 1000;
              return (
                <Link
                  key={chapter.id}
                  to={`/read/${chapter.id}`}
                  className="flex items-center justify-between text-xs group"
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors truncate">
                    {chapter.title || `Chapter ${chapter.chapter_number}`}
                    {isNew && (
                      <span className="shrink-0 px-1 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded">
                        NEW
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground/60 shrink-0 ml-2">
                    {formatDistanceToNow(new Date(chapter.created_at), { addSuffix: true }).replace(/^about /, '')}
                  </span>
                </Link>
              );
            })
          ) : (
            <span className="text-xs text-muted-foreground/50">No chapters yet</span>
          )}
        </div>
      </div>
    </div>
  );
}
