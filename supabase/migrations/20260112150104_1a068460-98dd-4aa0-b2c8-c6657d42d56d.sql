-- Drop existing permissive storage policies for covers
DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete covers" ON storage.objects;

-- Drop existing permissive storage policies for chapters
DROP POLICY IF EXISTS "Authenticated users can upload chapter content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update chapter content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete chapter content" ON storage.objects;

-- Create admin-only storage policies for covers
CREATE POLICY "Admins can upload covers"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'covers' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update covers"
ON storage.objects FOR UPDATE 
USING (bucket_id = 'covers' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete covers"
ON storage.objects FOR DELETE 
USING (bucket_id = 'covers' AND has_role(auth.uid(), 'admin'::app_role));

-- Create admin-only storage policies for chapters
CREATE POLICY "Admins can upload chapters"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chapters' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update chapters"
ON storage.objects FOR UPDATE 
USING (bucket_id = 'chapters' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete chapters"
ON storage.objects FOR DELETE 
USING (bucket_id = 'chapters' AND has_role(auth.uid(), 'admin'::app_role));