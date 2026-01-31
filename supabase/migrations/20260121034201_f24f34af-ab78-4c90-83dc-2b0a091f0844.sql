-- Drop the overly permissive INSERT policy on chapter_views
DROP POLICY IF EXISTS "Views are insertable by everyone" ON public.chapter_views;

-- Create a restrictive policy - only allow inserts through the RPC function
-- Since record_chapter_view is SECURITY DEFINER, it bypasses RLS
-- This prevents direct inserts to the table
CREATE POLICY "Views can only be inserted via RPC"
ON public.chapter_views
FOR INSERT
WITH CHECK (false);

-- Update the record_chapter_view function to add rate limiting
CREATE OR REPLACE FUNCTION public.record_chapter_view(p_chapter_id uuid, p_series_id uuid, p_viewer_hash text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_view_count integer;
BEGIN
  -- Rate limiting: Check if this viewer_hash has made more than 10 views in the last minute
  IF p_viewer_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_view_count
    FROM chapter_views
    WHERE viewer_hash = p_viewer_hash
      AND viewed_at > now() - interval '1 minute';
    
    -- If more than 10 views in the last minute, reject
    IF recent_view_count >= 10 THEN
      RAISE EXCEPTION 'Rate limit exceeded';
    END IF;
    
    -- Also check if this exact chapter was already viewed by this hash in the last hour
    IF EXISTS (
      SELECT 1 FROM chapter_views
      WHERE chapter_id = p_chapter_id
        AND viewer_hash = p_viewer_hash
        AND viewed_at > now() - interval '1 hour'
    ) THEN
      -- Already viewed recently, don't count again
      RETURN;
    END IF;
  END IF;

  -- Insert the view record
  INSERT INTO chapter_views (chapter_id, series_id, viewer_hash)
  VALUES (p_chapter_id, p_series_id, p_viewer_hash);
  
  -- Update total views on series
  UPDATE series SET total_views = total_views + 1 WHERE id = p_series_id;
END;
$$;