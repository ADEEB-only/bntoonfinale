import { Link } from "react-router-dom";
import { formatViewCount } from "@/hooks/useViews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Edit, Trash2, BookPlus, Eye, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface Series {
  id: string;
  title: string;
  status: string;
  cover_url: string | null;
  updated_at: string;
  total_views: number | null;
}

interface SeriesCardProps {
  series: Series;
  onDelete: (id: string, title: string) => void;
  isDeleting?: boolean;
}

export function SeriesCard({ series, onDelete, isDeleting }: SeriesCardProps) {
  const isMobile = useIsMobile();

  const ActionButtons = () => (
    <>
      <Link to={`/admin/series/${series.id}/chapters`} className="w-full sm:w-auto">
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <BookPlus className="h-4 w-4 mr-1" />
          Chapters
        </Button>
      </Link>
      <Link to={`/admin/series/${series.id}/edit`} className="w-full sm:w-auto">
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive w-full sm:w-auto"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Series</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{series.title}"? This will also delete all chapters and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(series.id, series.title)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-card rounded-lg shadow-card">
      {/* Cover + Info Row */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Cover Thumbnail */}
        <div className="h-16 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {series.cover_url ? (
            <img
              src={series.cover_url}
              alt={series.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
              <span className="font-bold text-muted-foreground/50">
                {series.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {series.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize text-xs">
              {series.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(series.updated_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Views - visible on all screens */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg flex-shrink-0">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium text-sm text-foreground">
            {formatViewCount(series.total_views || 0)}
          </span>
        </div>

        {/* Mobile: Action Drawer Trigger */}
        {isMobile && (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="truncate">{series.title}</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-2 space-y-2">
                <ActionButtons />
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {/* Desktop: Inline Actions */}
      {!isMobile && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <ActionButtons />
        </div>
      )}
    </div>
  );
}
