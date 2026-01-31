import { Skeleton } from "@/components/ui/skeleton";

interface StatsGridProps {
  total: number;
  ongoing: number;
  completed: number;
  isLoading?: boolean;
}

export function StatsGrid({ total, ongoing, completed, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div className="bg-card rounded-xl shadow-card p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total</p>
        <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          {total}
        </p>
      </div>
      <div className="bg-card rounded-xl shadow-card p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Ongoing</p>
        <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          {ongoing}
        </p>
      </div>
      <div className="bg-card rounded-xl shadow-card p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Completed</p>
        <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          {completed}
        </p>
      </div>
    </div>
  );
}
