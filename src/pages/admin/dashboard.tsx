import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAllSeries, useDeleteSeries } from "@/hooks/useSeries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatsGrid } from "@/components/admin/StatsGrid";
import { SeriesCard } from "@/components/admin/SeriesCard";

const AdminDashboard = () => {
  const { user, loading: authLoading, signOut, isAuthenticated, isAdmin } = useAuth();
  const { data: series, isLoading: seriesLoading } = useAllSeries();
  const deleteSeries = useDeleteSeries();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        navigate("/admin/login");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/admin/login");
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteSeries.mutateAsync(id);
      toast.success(`"${title}" deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete series");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const totalSeries = series?.length || 0;
  const ongoingSeries = series?.filter((s) => s.status === "ongoing").length || 0;
  const completedSeries = series?.filter((s) => s.status === "completed").length || 0;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader userEmail={user?.email} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Stats */}
        <StatsGrid
          total={totalSeries}
          ongoing={ongoingSeries}
          completed={completedSeries}
          isLoading={seriesLoading}
        />

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <Link to="/admin/genres">
            <Button variant="outline" size="sm" className="gap-2">
              <Tag className="h-4 w-4" />
              Manage Genres
            </Button>
          </Link>
        </div>

        {/* Series Management */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
            Manage Series
          </h2>
          <Link to="/admin/series/new">
            <Button className="btn-accent" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">New Series</span>
              <span className="xs:hidden">New</span>
            </Button>
          </Link>
        </div>

        {seriesLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : series && series.length > 0 ? (
          <div className="space-y-3">
            {series.map((s) => (
              <SeriesCard
                key={s.id}
                series={s}
                onDelete={handleDelete}
                isDeleting={deleteSeries.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 bg-card rounded-xl shadow-card">
            <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No series yet</p>
            <Link to="/admin/series/new">
              <Button className="btn-accent">
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Series
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
