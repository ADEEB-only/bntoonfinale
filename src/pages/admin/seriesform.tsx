import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSeries, useCreateSeries, useUpdateSeries } from "@/hooks/useSeries";
import { useGenres, useSeriesGenres, useUpdateSeriesGenres } from "@/hooks/useGenres";
import { uploadFile, generateFilePath } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Upload, Tag, Star, Sparkles, Image, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const SeriesForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const { data: existingSeries, isLoading: seriesLoading } = useSeries(id || "");
  const { data: allGenres, isLoading: genresLoading } = useGenres();
  const { data: seriesGenres } = useSeriesGenres(id || "");
  const createSeries = useCreateSeries();
  const updateSeries = useUpdateSeries();
  const updateSeriesGenres = useUpdateSeriesGenres();

  const [title, setTitle] = useState("");
  const [alternativeTitles, setAlternativeTitles] = useState<string[]>([]);
  const [newAltTitle, setNewAltTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [type, setType] = useState("manhwa");
  const [rating, setRating] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        navigate("/admin/login");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (existingSeries) {
      setTitle(existingSeries.title);
      setAlternativeTitles((existingSeries as any).alternative_titles || []);
      setDescription(existingSeries.description || "");
      setStatus(existingSeries.status);
      setType(existingSeries.type || "manhwa");
      setRating(existingSeries.rating !== null ? String(existingSeries.rating) : "");
      setIsFeatured(existingSeries.is_featured || false);
      setCoverUrl(existingSeries.cover_url || "");
      setBannerUrl((existingSeries as any).banner_url || "");
    }
  }, [existingSeries]);

  useEffect(() => {
    if (seriesGenres) {
      setSelectedGenreIds(seriesGenres.map((g) => g.id));
    }
  }, [seriesGenres]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const path = generateFilePath("covers", file.name);
      const { url, error } = await uploadFile(file, path);

      if (error) throw new Error(error);

      setCoverUrl(url!);
      toast.success("Cover uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload cover");
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const path = generateFilePath("banners", file.name);
      const { url, error } = await uploadFile(file, path);

      if (error) throw new Error(error);

      setBannerUrl(url!);
      toast.success("Banner uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const addAlternativeTitle = () => {
    const trimmed = newAltTitle.trim();
    if (trimmed && !alternativeTitles.includes(trimmed)) {
      setAlternativeTitles([...alternativeTitles, trimmed]);
      setNewAltTitle("");
    }
  };

  const removeAlternativeTitle = (index: number) => {
    setAlternativeTitles(alternativeTitles.filter((_, i) => i !== index));
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      let seriesId = id;
      const ratingValue = rating.trim() === "" ? null : parseFloat(rating);
      
      if (isEditing) {
        await updateSeries.mutateAsync({
          id: id!,
          title: title.trim(),
          alternative_titles: alternativeTitles,
          description: description.trim() || undefined,
          status,
          type,
          rating: ratingValue,
          is_featured: isFeatured,
          cover_url: coverUrl || undefined,
          banner_url: bannerUrl || undefined,
        });
        toast.success("Series updated successfully");
      } else {
        const newSeries = await createSeries.mutateAsync({
          title: title.trim(),
          alternative_titles: alternativeTitles,
          description: description.trim() || undefined,
          status,
          type,
          rating: ratingValue,
          is_featured: isFeatured,
          cover_url: coverUrl || undefined,
          banner_url: bannerUrl || undefined,
        });
        seriesId = newSeries.id;
        toast.success("Series created successfully");
      }

      // Update genres
      if (seriesId) {
        await updateSeriesGenres.mutateAsync({
          seriesId,
          genreIds: selectedGenreIds,
        });
      }

      navigate("/admin");
    } catch (error) {
      toast.error(`Failed to ${isEditing ? "update" : "create"} series`);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (isEditing && seriesLoading) || genresLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <Link
          to="/admin"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">
          {isEditing ? "Edit Series" : "Create New Series"}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-start gap-4">
              <div className="h-40 w-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No cover
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-muted-foreground transition-colors">
                    {uploading ? (
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload cover image
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter series title"
              required
            />
          </div>

          {/* Alternative Titles */}
          <div className="space-y-2">
            <Label>Alternative Titles</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Add other names this series is known by (e.g., Korean/Japanese/Chinese titles, abbreviations)
            </p>
            
            {/* Existing Alternative Titles */}
            {alternativeTitles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {alternativeTitles.map((altTitle, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 gap-1"
                  >
                    {altTitle}
                    <button
                      type="button"
                      onClick={() => removeAlternativeTitle(index)}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Add New Alternative Title */}
            <div className="flex gap-2">
              <Input
                value={newAltTitle}
                onChange={(e) => setNewAltTitle(e.target.value)}
                placeholder="Enter alternative title"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAlternativeTitle();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addAlternativeTitle}
                disabled={!newAltTitle.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter series description"
              rows={4}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manhwa">Manhwa (Korean)</SelectItem>
                <SelectItem value="manga">Manga (Japanese)</SelectItem>
                <SelectItem value="manhua">Manhua (Chinese)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="hiatus">Hiatus</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <div>
                <Label htmlFor="featured" className="text-base font-medium cursor-pointer">
                  Featured Series
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show this series in the homepage featured carousel
                </p>
              </div>
            </div>
            <Checkbox
              id="featured"
              checked={isFeatured}
              onCheckedChange={(checked) => setIsFeatured(checked === true)}
            />
          </div>

          {/* Banner Upload (only show if Featured is enabled) */}
          {isFeatured && (
            <div className="space-y-2 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4 text-yellow-500" />
                Featured Banner (Optional)
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Upload a wide banner image for the featured carousel background. If not set, the cover image will be used.
              </p>
              <div className="flex items-start gap-4">
                <div className="h-24 w-48 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {bannerUrl ? (
                    <img
                      src={bannerUrl}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                      No banner
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-yellow-500/30 rounded-lg p-3 text-center hover:border-yellow-500/50 transition-colors">
                      {uploadingBanner ? (
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="mx-auto h-5 w-5 text-yellow-500/70 mb-1" />
                          <p className="text-xs text-muted-foreground">
                            Upload banner (1920×1080 recommended)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                      disabled={uploadingBanner}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Rating (Admin-controlled) */}
          <div className="space-y-2">
            <Label htmlFor="rating" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Rating (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="0-10"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">/ 10</span>
            </div>
          </div>

          {/* Genres */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Genres
            </Label>
            <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg min-h-[60px]">
              {allGenres?.map((genre) => (
                <Badge
                  key={genre.id}
                  variant={selectedGenreIds.includes(genre.id) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.name}
                </Badge>
              ))}
              {(!allGenres || allGenres.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No genres available. <Link to="/admin/genres" className="text-primary hover:underline">Create some first</Link>.
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Link to="/admin">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="btn-accent" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Series"
              ) : (
                "Create Series"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeriesForm;
