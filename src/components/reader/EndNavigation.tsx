import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  chapter_number: number;
  title: string | null;
}

interface EndNavigationProps {
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
}

export function EndNavigation({ prevChapter, nextChapter }: EndNavigationProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-center gap-6">
        <button
          disabled={!prevChapter}
          onClick={() => prevChapter && navigate(`/read/${prevChapter.id}`)}
          className={cn(
            "px-6 py-3 text-sm font-medium rounded-md transition-colors",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/50",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          )}
        >
          Previous Chapter
        </button>

        <span className="text-muted-foreground/30">•</span>

        <button
          disabled={!nextChapter}
          onClick={() => nextChapter && navigate(`/read/${nextChapter.id}`)}
          className={cn(
            "px-6 py-3 text-sm font-medium rounded-md transition-colors",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/50",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          )}
        >
          Next Chapter
        </button>
      </div>
    </div>
  );
}
