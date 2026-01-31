-- Add banner_url column to series table
ALTER TABLE public.series ADD COLUMN banner_url text DEFAULT NULL;

-- Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true);

-- Create storage policies for banners bucket
CREATE POLICY "Banners are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));