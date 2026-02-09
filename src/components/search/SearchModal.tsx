import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Loader2, BookOpen, Filter, ChevronDown } from "lucide-react";
import { useQuickSearch, useAdvancedSearch } from "@/hooks/useSearch";
import { useGenres } from "@/hooks/useGenres";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ongoing: { color: "bg-emerald-500", label: "Ongoing" },
  completed: { color: "bg-blue-500", label: "Completed" },
  hiatus: { color: "bg-amber-500", label: "Hiatus" },
  cancelled: { color: "bg-red-500", label: "Cancelled" },
  dropped: { color: "bg-gray-500", label: "Dropped" },
};

const typeConfig: Record<string, { color: string; label: string }> = {
  manga: { color: "bg-rose-500/20 text-rose-400", label: "Manga" },
  manhwa: { color: "bg-primary/20 text-primary", label: "Manhwa" },
  manhua: { color: "bg-amber-500/20 text-amber-400", label: "Manhua" },
};

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"relevance" | "latest" | "title" | "rating">("relevance");
  
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const { data: genres } = useGenres();
  
  // Use advanced search when filters are active, otherwise quick search
  const hasFilters = !!statusFilter || !!typeFilter || selectedGenres.length > 0;
  
  const { data: quickResults, isLoading: quickLoading } = useQuickSearch(
    !hasFilters ? query : ""
  );
  
  const { data: advancedResults, isLoading: advancedLoading } = useAdvancedSearch({
    query,
    status: statusFilter,
    type: typeFilter,
    genres: selectedGenres,
    sortBy,
    limit: 20,
  });
  
  const results = hasFilters ? advancedResults : quickResults;
  const isLoading = hasFilters ? advancedLoading : quickLoading;

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when closing
      setQuery("");
      setShowFilters(false);
      setStatusFilter(null);
      setTypeFilter(null);
      setSelectedGenres([]);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const toggleGenre = useCallback((genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  }, []);

  const handleResultClick = (seriesId: string) => {
    navigate(`/series/${seriesId}`);
    onOpenChange(false);
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setTypeFilter(null);
    setSelectedGenres([]);
    setSortBy("relevance");
  };

  const activeFilterCount = 
    (statusFilter ? 1 : 0) + 
    (typeFilter ? 1 : 0) + 
    selectedGenres.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-card border-border overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Comics</DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, alternative title, or description..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant={showFilters ? "secondary" : "ghost"}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-3 animate-fade-in">
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="hiatus">Hiatus</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? null : v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="manga">Manga</SelectItem>
                  <SelectItem value="manhwa">Manhwa</SelectItem>
                  <SelectItem value="manhua">Manhua</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="latest">Latest Update</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                  Clear all
                </Button>
              )}
            </div>

            {/* Genre Tags */}
            {genres && genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      selectedGenres.includes(genre.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="divide-y divide-border">
              {results.map((series) => {
                const status = statusConfig[series.status] || statusConfig.ongoing;
                const type = typeConfig[series.type] || typeConfig.manhwa;
                
                return (
                  <button
                    key={series.id}
                    onClick={() => handleResultClick(series.id)}
                    className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    {/* Cover */}
                    <div className="w-12 h-16 rounded overflow-hidden bg-muted shrink-0">
                      {series.cover_url ? (
                        <img
                          src={series.cover_url}
                          alt={series.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {series.title}
                        </h3>
                        <Badge className={`${type.color} text-[10px] shrink-0`}>
                          {type.label}
                        </Badge>
                      </div>
                      
                      {/* Alternative Titles */}
                      {series.alternative_titles && series.alternative_titles.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          Also: {series.alternative_titles.slice(0, 2).join(", ")}
                          {series.alternative_titles.length > 2 && ` +${series.alternative_titles.length - 2} more`}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={`${status.color} text-white text-[10px] px-1.5 py-0`}>
                          {status.label}
                        </Badge>
                        <span>{series.chapters_count} chapters</span>
                        {series.rating != null && (
                          <span>★ {Number(series.rating).toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.length >= 2 || hasFilters ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1">Try different keywords or filters</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">Start typing to search</p>
              <p className="text-xs mt-1">Search by title, alternative titles, or description</p>
              <div className="flex items-center gap-1 mt-4 text-xs">
                <kbd className="px-2 py-1 bg-muted rounded border border-border">⌘</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-muted rounded border border-border">K</kbd>
                <span className="ml-2">to open search</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
