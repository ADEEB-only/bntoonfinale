-- Create series table
CREATE TABLE public.series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  chapter_number NUMERIC NOT NULL,
  title TEXT,
  chapter_type TEXT NOT NULL DEFAULT 'images' CHECK (chapter_type IN ('images', 'pdf')),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chapter_pages table for image-based chapters
CREATE TABLE public.chapter_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_chapters_series_id ON public.chapters(series_id);
CREATE INDEX idx_chapter_pages_chapter_id ON public.chapter_pages(chapter_id);
CREATE UNIQUE INDEX idx_chapters_series_number ON public.chapters(series_id, chapter_number);

-- Enable RLS
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can view)
CREATE POLICY "Series are viewable by everyone" 
ON public.series FOR SELECT USING (true);

CREATE POLICY "Chapters are viewable by everyone" 
ON public.chapters FOR SELECT USING (true);

CREATE POLICY "Chapter pages are viewable by everyone" 
ON public.chapter_pages FOR SELECT USING (true);

-- Admin policies (authenticated users can modify)
CREATE POLICY "Authenticated users can insert series" 
ON public.series FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update series" 
ON public.series FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete series" 
ON public.series FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert chapters" 
ON public.chapters FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update chapters" 
ON public.chapters FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete chapters" 
ON public.chapters FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert chapter pages" 
ON public.chapter_pages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update chapter pages" 
ON public.chapter_pages FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete chapter pages" 
ON public.chapter_pages FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for series timestamp updates
CREATE TRIGGER update_series_updated_at
BEFORE UPDATE ON public.series
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for covers
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);

-- Create storage bucket for chapter content (images and PDFs)
INSERT INTO storage.buckets (id, name, public) VALUES ('chapters', 'chapters', true);

-- Storage policies for covers bucket
CREATE POLICY "Cover images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can upload covers" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update covers" 
ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete covers" 
ON storage.objects FOR DELETE USING (bucket_id = 'covers' AND auth.uid() IS NOT NULL);

-- Storage policies for chapters bucket
CREATE POLICY "Chapter content is publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'chapters');

CREATE POLICY "Authenticated users can upload chapter content" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chapters' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update chapter content" 
ON storage.objects FOR UPDATE USING (bucket_id = 'chapters' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete chapter content" 
ON storage.objects FOR DELETE USING (bucket_id = 'chapters' AND auth.uid() IS NOT NULL);