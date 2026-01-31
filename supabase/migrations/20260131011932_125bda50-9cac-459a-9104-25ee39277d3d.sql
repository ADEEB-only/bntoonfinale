-- Add missing UPDATE policy for series_genres (admin only)
CREATE POLICY "Admins can update series genres"
ON public.series_genres
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Restrict chapter_views SELECT to only admins (prevents user tracking/profiling)
DROP POLICY IF EXISTS "Anyone can view chapter views" ON public.chapter_views;
DROP POLICY IF EXISTS "Public can read chapter views" ON public.chapter_views;

CREATE POLICY "Only admins can view chapter views"
ON public.chapter_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);