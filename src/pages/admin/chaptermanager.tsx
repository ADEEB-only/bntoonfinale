import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSeries, useChapters, useCreateChapter, useDeleteChapter, useUpdateChapter } from "@/hooks/useSeries";
import { uploadFile, generateFilePath, generateChapterPagePath } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Loader2,
  FileText,
  Image,
  Calendar,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ChapterManager = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const { data: series, isLoading: seriesLoading } = useSeries(seriesId || "");
  const { data: chapters, isLoading: chaptersLoading } = useChapters(seriesId || "");
  const createChapter = useCreateChapter();
  const deleteChapter = useDeleteChapter();
  const updateChapter = useUpdateChapter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<{ id: string; chapter_number: number; title: string | null } | null>(null);
  const [editChapterNumber, setEditChapterNumber] = useState("");
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterType, setChapterType] = useState<"images" | "pdf">("images");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        navigate("/admin/login");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const resetForm = () => {
    setChapterNumber("");
    setChapterTitle("");
    setChapterType("images");
    setImageFiles([]);
    setPdfFile(null);
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterNumber || !seriesId) {
      toast.error("Chapter number is required");
      return;
    }

    if (chapterType === "images" && imageFiles.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    if (chapterType === "pdf" && !pdfFile) {
      toast.error("Please upload a PDF file");
      return;
    }

    setUploading(true);

    try {
      let pdfUrl: string | undefined;
      let pages: { page_number: number; image_url: string }[] | undefined;

      if (chapterType === "pdf" && pdfFile) {
        const path = generateFilePath("chapters", pdfFile.name, seriesId);
        const { url, error } = await uploadFile(pdfFile, path);
        if (error) throw new Error(error);
        pdfUrl = url;
      } else if (chapterType === "images" && imageFiles.length > 0) {
        const chapterNum = parseFloat(chapterNumber);
        const uploadedPages = await Promise.all(
          imageFiles.map(async (file, index) => {
            const ext = file.name.split('.').pop() || 'jpg';
            const path = generateChapterPagePath(seriesId, chapterNum, index + 1, ext);
            const { url, error } = await uploadFile(file, path);
            if (error) throw new Error(error);
            return {
              page_number: index + 1,
              image_url: url!,
            };
          })
        );
        pages = uploadedPages;
      }

      await createChapter.mutateAsync({
        series_id: seriesId,
        chapter_number: parseFloat(chapterNumber),
        title: chapterTitle.trim() || undefined,
        chapter_type: chapterType,
        pdf_url: pdfUrl,
        pages,
      });

      toast.success("Chapter uploaded successfully");
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to upload chapter");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      await deleteChapter.mutateAsync({ id, seriesId: seriesId! });
      toast.success("Chapter deleted successfully");
    } catch (error) {
      toast.error("Failed to delete chapter");
    }
  };

  const openEditDialog = (chapter: { id: string; chapter_number: number; title: string | null }) => {
    setEditingChapter(chapter);
    setEditChapterNumber(String(chapter.chapter_number));
    setEditChapterTitle(chapter.title || "");
    setEditDialogOpen(true);
  };

  const handleEditChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter || !seriesId) return;

    setUploading(true);
    try {
      await updateChapter.mutateAsync({
        id: editingChapter.id,
        seriesId,
        chapter_number: parseFloat(editChapterNumber),
        title: editChapterTitle.trim() || null,
      });
      toast.success("Chapter updated successfully");
      setEditDialogOpen(false);
      setEditingChapter(null);
    } catch (error) {
      toast.error("Failed to update chapter");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || seriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Series not found</h1>
          <Link to="/admin">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Link
          to="/admin"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {series.title}
            </h1>
            <p className="text-muted-foreground">Manage chapters</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent">
                <Plus className="h-4 w-4 mr-1" />
                Add Chapter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload New Chapter</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapterNumber">Chapter Number *</Label>
                    <Input
                      id="chapterNumber"
                      type="number"
                      step="0.1"
                      value={chapterNumber}
                      onChange={(e) => setChapterNumber(e.target.value)}
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapterTitle">Title (optional)</Label>
                    <Input
                      id="chapterTitle"
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      placeholder="Chapter title"
                    />
                  </div>
                </div>

                <Tabs value={chapterType} onValueChange={(v) => setChapterType(v as "images" | "pdf")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="images" className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Images
                    </TabsTrigger>
                    <TabsTrigger value="pdf" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="images" className="mt-4">
                    <Label className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground transition-colors">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {imageFiles.length > 0
                            ? `${imageFiles.length} images selected`
                            : "Click to upload images"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Select multiple images in order
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFilesChange}
                        className="hidden"
                      />
                    </Label>
                  </TabsContent>
                  <TabsContent value="pdf" className="mt-4">
                    <Label className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground transition-colors">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {pdfFile ? pdfFile.name : "Click to upload PDF"}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfChange}
                        className="hidden"
                      />
                    </Label>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-accent" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Chapter"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Chapters List */}
        {chaptersLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : chapters && chapters.length > 0 ? (
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-semibold">
                    {chapter.chapter_number}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Chapter {chapter.chapter_number}
                      {chapter.title && `: ${chapter.title}`}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(chapter.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {chapter.chapter_type}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEditDialog(chapter)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete Chapter {chapter.chapter_number}? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl shadow-card">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No chapters yet</p>
            <Button className="btn-accent" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Upload First Chapter
            </Button>
          </div>
        )}

        {/* Edit Chapter Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Chapter</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditChapter} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editChapterNumber">Chapter Number *</Label>
                <Input
                  id="editChapterNumber"
                  type="number"
                  step="0.1"
                  value={editChapterNumber}
                  onChange={(e) => setEditChapterNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editChapterTitle">Title (optional)</Label>
                <Input
                  id="editChapterTitle"
                  value={editChapterTitle}
                  onChange={(e) => setEditChapterTitle(e.target.value)}
                  placeholder="Chapter title"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingChapter(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-accent" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ChapterManager;
