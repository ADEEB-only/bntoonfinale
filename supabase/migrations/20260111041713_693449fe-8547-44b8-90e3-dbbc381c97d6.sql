-- Drop existing permissive policies for content tables
DROP POLICY IF EXISTS "Authenticated users can insert series" ON public.series;
DROP POLICY IF EXISTS "Authenticated users can update series" ON public.series;
DROP POLICY IF EXISTS "Authenticated users can delete series" ON public.series;
DROP POLICY IF EXISTS "Authenticated users can insert chapters" ON public.chapters;
DROP POLICY IF EXISTS "Authenticated users can update chapters" ON public.chapters;
DROP POLICY IF EXISTS "Authenticated users can delete chapters" ON public.chapters;
DROP POLICY IF EXISTS "Authenticated users can insert chapter pages" ON public.chapter_pages;
DROP POLICY IF EXISTS "Authenticated users can update chapter pages" ON public.chapter_pages;
DROP POLICY IF EXISTS "Authenticated users can delete chapter pages" ON public.chapter_pages;

-- Create admin-only policies for series
CREATE POLICY "Admins can insert series" 
ON public.series FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update series" 
ON public.series FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete series" 
ON public.series FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create admin-only policies for chapters
CREATE POLICY "Admins can insert chapters" 
ON public.chapters FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chapters" 
ON public.chapters FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chapters" 
ON public.chapters FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create admin-only policies for chapter_pages
CREATE POLICY "Admins can insert chapter pages" 
ON public.chapter_pages FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chapter pages" 
ON public.chapter_pages FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chapter pages" 
ON public.chapter_pages FOR DELETE 
USING (has_role(auth.uid(), 'admin'));