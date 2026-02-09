import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  chapter_number: number;
  title: string | null;
}

interface MinimalHeaderProps {
  seriesId: string;
  seriesTitle?: string;
  currentChapter: Chapter;
  chapters: Chapter[];
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
}

export function MinimalHeader({
  seriesId,
  seriesTitle,
  currentChapter,
  chapters,
  prevChapter,
  nextChapter,
}: MinimalHeaderProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sort chapters descending (latest first)
  const sortedChapters = [...chapters].sort(
    (a, b) => b.chapter_number - a.chapter_number
  );

  // Hide/show header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrolledPastThreshold = currentScrollY > 80;

      if (scrollingDown && scrolledPastThreshold && !isDropdownOpen) {
        setIsVisible(false);
      } else if (!scrollingDown || currentScrollY < 80) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDropdownOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Scroll to current chapter when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && listRef.current) {
      const currentElement = listRef.current.querySelector('[data-current="true"]');
      if (currentElement) {
        currentElement.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }
  }, [isDropdownOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDropdownOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (chapterId: string) => {
    if (chapterId !== currentChapter.id) {
      navigate(`/read/${chapterId}`);
    }
    setIsDropdownOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 items-center h-12">
            {/* Left: Back Icon + Series Title */}
            <Link
              to={`/series/${seriesId}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[100px] sm:max-w-[160px]">
                {seriesTitle || "Back"}
              </span>
            </Link>

            {/* Center: Chapter Selector */}
            <div ref={dropdownRef} className="relative flex justify-center">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
                  "text-sm font-medium text-foreground",
                  "hover:bg-muted/50 transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
              >
                <span>Chapter {currentChapter.chapter_number}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <>
                  {/* Mobile backdrop */}
                  <div
                    className="fixed inset-0 bg-black/30 z-40 sm:hidden"
                    onClick={() => setIsDropdownOpen(false)}
                  />

                  <div
                    className={cn(
                      "z-50",
                      // Mobile: bottom sheet anchored to bottom
                      "fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-1/2 right-0 sm:right-auto",
                      "sm:-translate-x-1/2 sm:mt-2",
                      "sm:min-w-[260px] sm:max-w-[300px]",
                      "bg-card border border-border/60 rounded-t-xl sm:rounded-lg",
                      "shadow-xl shadow-black/10"
                    )}
                  >
                    {/* Chapter count */}
                    <div className="px-4 py-2.5 border-b border-border/40">
                      <span className="text-xs text-muted-foreground">
                        {chapters.length} chapters
                      </span>
                    </div>

                    {/* Chapter List */}
                    <div
                      ref={listRef}
                      className="max-h-[50vh] sm:max-h-[280px] overflow-y-auto"
                    >
                      {sortedChapters.map((chapter) => {
                        const isCurrent = chapter.id === currentChapter.id;
                        return (
                          <button
                            key={chapter.id}
                            data-current={isCurrent}
                            onClick={() => handleSelect(chapter.id)}
                            className={cn(
                              "w-full flex items-center px-4 py-2.5",
                              "text-left text-sm transition-colors",
                              "hover:bg-muted/40",
                              isCurrent && "bg-muted/60"
                            )}
                          >
                            <span
                              className={cn(
                                "font-medium",
                                isCurrent ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              Chapter {chapter.chapter_number}
                            </span>
                            {chapter.title && (
                              <span className="ml-2 text-muted-foreground truncate">
                                — {chapter.title}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile drag hint */}
                    <div className="sm:hidden p-2 border-t border-border/40">
                      <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right: Navigation */}
            <div className="flex items-center gap-1 justify-end">
              <button
                disabled={!prevChapter}
                onClick={() => prevChapter && navigate(`/read/${prevChapter.id}`)}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  "hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
                aria-label="Previous chapter"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                disabled={!nextChapter}
                onClick={() => nextChapter && navigate(`/read/${nextChapter.id}`)}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  "hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
                aria-label="Next chapter"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
