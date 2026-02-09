import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  chapter_number: number;
  title: string | null;
}

interface ChapterSelectorProps {
  chapters: Chapter[];
  currentChapterId: string;
  seriesTitle?: string;
}

export function ChapterSelector({
  chapters,
  currentChapterId,
  seriesTitle,
}: ChapterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sort chapters in descending order (latest first)
  const sortedChapters = [...chapters].sort(
    (a, b) => b.chapter_number - a.chapter_number
  );

  const currentChapter = chapters.find((c) => c.id === currentChapterId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Scroll to current chapter when opening
  useEffect(() => {
    if (isOpen && listRef.current) {
      const currentElement = listRef.current.querySelector('[data-current="true"]');
      if (currentElement) {
        currentElement.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (chapterId: string) => {
    if (chapterId !== currentChapterId) {
      navigate(`/read/${chapterId}`);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-muted/50 hover:bg-muted border border-border/50",
          "text-sm font-medium text-foreground",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          isOpen && "bg-muted ring-2 ring-primary/50"
        )}
      >
        <span className="max-w-[150px] sm:max-w-[200px] truncate">
          Ch. {currentChapter?.chapter_number}
          {currentChapter?.title && (
            <span className="hidden sm:inline text-muted-foreground">
              {" "}
              - {currentChapter.title}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className={cn(
              "absolute z-50 mt-2",
              // Mobile: bottom sheet style
              "fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-auto right-0 sm:right-auto",
              "sm:min-w-[280px] sm:max-w-[320px]",
              "bg-card border border-border rounded-t-2xl sm:rounded-xl",
              "shadow-lg shadow-black/20",
              "animate-slide-in-bottom sm:animate-scale-in",
              "overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">
                {seriesTitle ? `${seriesTitle}` : "Select Chapter"}
              </span>
              <span className="text-xs text-muted-foreground">
                {chapters.length} chapters
              </span>
            </div>

            {/* Chapter List */}
            <div
              ref={listRef}
              className="max-h-[50vh] sm:max-h-[300px] overflow-y-auto overscroll-contain"
            >
              {sortedChapters.map((chapter) => {
                const isCurrent = chapter.id === currentChapterId;
                return (
                  <button
                    key={chapter.id}
                    data-current={isCurrent}
                    onClick={() => handleSelect(chapter.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3",
                      "text-left text-sm transition-colors",
                      "hover:bg-muted/50 active:bg-muted",
                      isCurrent && "bg-primary/10 hover:bg-primary/15"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            isCurrent ? "text-primary" : "text-foreground"
                          )}
                        >
                          Chapter {chapter.chapter_number}
                        </span>
                        {isCurrent && (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium">
                            READING
                          </span>
                        )}
                      </div>
                      {chapter.title && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {chapter.title}
                        </p>
                      )}
                    </div>
                    {isCurrent && (
                      <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile close hint */}
            <div className="sm:hidden p-3 border-t border-border bg-muted/30">
              <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
