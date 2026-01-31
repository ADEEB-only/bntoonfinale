
# Fix Chapter Image Folder Structure

## Problem

Currently, when you upload chapter images, each image gets saved in its own separate folder:
```
chapters/series-abc/1738000001_0/1738000001.jpg
chapters/series-abc/1738000002_1/1738000002.jpg
chapters/series-abc/1738000003_2/1738000003.jpg
```

## Solution

Change the folder structure so all images for one chapter are stored together:
```
chapters/series-abc/chapter-1/1.jpg
chapters/series-abc/chapter-1/2.jpg
chapters/series-abc/chapter-1/3.jpg
```

## Changes

### 1. Update `src/lib/storage.ts`

Add a new helper function specifically for chapter pages that uses page numbers instead of timestamps:

```typescript
// New function for chapter pages
export function generateChapterPagePath(
  seriesId: string,
  chapterNumber: number,
  pageNumber: number,
  extension: string
): string {
  // Creates: chapters/[seriesId]/ch-[chapterNumber]/[pageNumber].[ext]
  return `chapters/${seriesId}/ch-${chapterNumber}/${pageNumber}.${extension}`;
}
```

### 2. Update `src/pages/admin/chaptermanager.tsx`

Modify the image upload logic to:
1. Generate ONE folder path for all images in a chapter
2. Use simple page numbers (1, 2, 3...) as filenames

**Before:**
```typescript
const path = generateFilePath("chapters", file.name, `${seriesId}/${Date.now()}_${index}`);
```

**After:**
```typescript
const ext = file.name.split('.').pop() || 'jpg';
const path = generateChapterPagePath(seriesId, parseFloat(chapterNumber), index + 1, ext);
```

## Result

After this change:
- **Chapter 1 images**: `chapters/abc123/ch-1/1.jpg`, `chapters/abc123/ch-1/2.jpg`, etc.
- **Chapter 2 images**: `chapters/abc123/ch-2/1.jpg`, `chapters/abc123/ch-2/2.jpg`, etc.
- **PDF files**: Will continue using the existing pattern (one file per chapter)

This keeps your Bunny storage organized with one folder per chapter.

---

## Technical Details

| File | Change |
|------|--------|
| `src/lib/storage.ts` | Add `generateChapterPagePath()` helper function |
| `src/pages/admin/chaptermanager.tsx` | Use new helper for image uploads |
