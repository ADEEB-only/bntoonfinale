import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { formatViewCount, TimePeriod } from "@/hooks/useViews";
import { usePopularSeriesWithGenres } from "@/hooks/usePopularSeriesWithGenres";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";

export function PopularSidebar() {
  const [period, setPeriod] = useState<TimePeriod>("weekly");
  const { data: popularSeries, isLoading } = usePopularSeriesWithGenres(period, 10);
  const { isAdmin } = useAuth();

  const tabs: { value: TimePeriod; label: string }[] = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "all", label: "All Time" },
  ];

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h2 className="font-display text-xl font-bold text-foreground">Popular</h2>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              period === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Series List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-2">
              <Skeleton className="w-7 h-7 rounded" />
              <Skeleton className="w-12 aspect-[3/4] rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : popularSeries && popularSeries.length > 0 ? (
        <div className="space-y-1">
          {popularSeries.map((s, index) => (
            <Link
              key={s.id}
              to={`/series/${s.id}`}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all duration-200 group"
            >
              {/* Rank */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  index < 3
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                }`}
              >
                {index + 1}
              </div>

              {/* Thumbnail with Lazy Loading */}
              <div className="w-12 shrink-0 rounded-lg overflow-hidden ring-1 ring-white/5 group-hover:ring-primary/30 transition-all">
                {s.cover_url ? (
                  <LazyImage
                    src={s.cover_url}
                    alt={s.title}
                    aspectRatio="aspect-[3/4]"
                    className="w-full transition-transform duration-300 group-hover:scale-105"
                    rootMargin="50px 0px"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] flex items-center justify-center bg-muted text-muted-foreground/30 text-xs font-bold">
                    {s.title.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5">
                <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                  {s.title}
                </h4>
                {/* Genres */}
                {s.genres && s.genres.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {s.genres.slice(0, 3).map(g => g.name).join(" • ")}
                  </p>
                )}
                {isAdmin && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatViewCount(period === "all" ? s.total_views : s.period_views)} views
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>No data yet</p>
          <p className="text-xs mt-1">Views will appear as readers engage</p>
        </div>
      )}
    </section>
  );
}
