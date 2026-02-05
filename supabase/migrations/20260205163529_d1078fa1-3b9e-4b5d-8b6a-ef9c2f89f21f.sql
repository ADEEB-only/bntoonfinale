-- Remove the overly permissive "Views are viewable by everyone" policy
-- Keep only the admin-only policy for chapter_views
DROP POLICY IF EXISTS "Views are viewable by everyone" ON public.chapter_views;