import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGenres, useCreateGenre, useDeleteGenre, useUpdateGenre } from "@/hooks/useGenres";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Trash2,
  LogOut,
  Home,
  ArrowLeft,
  Tag,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

const GenreManager = () => {
  const { user, loading: authLoading, signOut, isAuthenticated, isAdmin } = useAuth();
  const { data: genres, isLoading: genresLoading } = useGenres();
  const createGenre = useCreateGenre();
  const deleteGenre = useDeleteGenre();
  const updateGenre = useUpdateGenre();
  const navigate = useNavigate();

  const [newGenreName, setNewGenreName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/admin/login");
      } else if (!isAdmin) {
        navigate("/admin/login");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/admin/login");
  };

  const handleCreate = async () => {
    const trimmedName = newGenreName.trim();
    if (!trimmedName) {
      toast.error("Genre name cannot be empty");
      return;
    }

    if (trimmedName.length > 50) {
      toast.error("Genre name must be less than 50 characters");
      return;
    }

    try {
      await createGenre.mutateAsync({ name: trimmedName });
      toast.success(`Genre "${trimmedName}" created`);
      setNewGenreName("");
      setIsCreateOpen(false);
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast.error("A genre with this name already exists");
      } else {
        toast.error("Failed to create genre");
      }
    }
  };

  const handleEdit = async () => {
    if (!editingGenre) return;
    
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error("Genre name cannot be empty");
      return;
    }

    if (trimmedName.length > 50) {
      toast.error("Genre name must be less than 50 characters");
      return;
    }

    try {
      await updateGenre.mutateAsync({ id: editingGenre.id, name: trimmedName });
      toast.success(`Genre updated to "${trimmedName}"`);
      setEditingGenre(null);
      setEditName("");
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast.error("A genre with this name already exists");
      } else {
        toast.error("Failed to update genre");
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteGenre.mutateAsync(id);
      toast.success(`Genre "${name}" deleted`);
    } catch (error) {
      toast.error("Failed to delete genre");
    }
  };

  const openEditDialog = (genre: { id: string; name: string }) => {
    setEditingGenre(genre);
    setEditName(genre.name);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="font-display text-lg font-bold text-foreground">
                  BnToon Admin
                </span>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-1" />
                  View Site
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        {/* Genre Management Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Genre Management
              </h1>
              <p className="text-sm text-muted-foreground">
                {genres?.length || 0} genres total
              </p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent">
                <Plus className="h-4 w-4 mr-1" />
                New Genre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Genre</DialogTitle>
                <DialogDescription>
                  Add a new genre/category for your comics.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Genre name (e.g., Action, Romance)"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  maxLength={50}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createGenre.isPending}>
                  {createGenre.isPending ? "Creating..." : "Create Genre"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingGenre} onOpenChange={(open) => !open && setEditingGenre(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Genre</DialogTitle>
              <DialogDescription>
                Update the genre name.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Genre name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                maxLength={50}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingGenre(null)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updateGenre.isPending}>
                {updateGenre.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Genres List */}
        {genresLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : genres && genres.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.map((genre) => (
              <div
                key={genre.id}
                className="group relative bg-card rounded-xl shadow-card p-4 hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {genre.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Slug: {genre.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(genre)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Genre</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{genre.name}"? This will remove the genre from all series.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(genre.id, genre.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl shadow-card">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No genres yet</p>
            <Button className="btn-accent" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Your First Genre
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default GenreManager;
