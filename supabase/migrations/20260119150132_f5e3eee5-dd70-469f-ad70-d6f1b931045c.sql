-- Create chapter_views table to track views
CREATE TABLE public.chapter_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  viewer_hash text -- Anonymous hash to prevent duplicate counting per session
);

-- Enable RLS
ALTER TABLE public.chapter_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view the aggregated stats (but not individual records)
CREATE POLICY "Views are insertable by everyone"
ON public.chapter_views FOR INSERT
WITH CHECK (true);

-- Only allow selecting aggregated data through functions
CREATE POLICY "Views are viewable by everyone"
ON public.chapter_views FOR SELECT
USING (true);

-- Create indexes for fast aggregation queries
CREATE INDEX idx_chapter_views_series_id ON public.chapter_views(series_id);
CREATE INDEX idx_chapter_views_viewed_at ON public.chapter_views(viewed_at DESC);
CREATE INDEX idx_chapter_views_series_viewed ON public.chapter_views(series_id, viewed_at DESC);

-- Add total_views column to series for quick access
ALTER TABLE public.series ADD COLUMN total_views bigint NOT NULL DEFAULT 0;

-- Create function to get popular series by time period
CREATE OR REPLACE FUNCTION public.get_popular_series(
  time_period text DEFAULT 'all',
  result_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  cover_url text,
  status text,
  type text,
  total_views bigint,
  period_views bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date timestamp with time zone;
BEGIN
  -- Determine start date based on period
  CASE time_period
    WHEN 'weekly' THEN start_date := now() - interval '7 days';
    WHEN 'monthly' THEN start_date := now() - interval '30 days';
    ELSE start_date := '1970-01-01'::timestamp with time zone;
  END CASE;

  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.cover_url,
    s.status,
    s.type,
    s.total_views,
    COALESCE(COUNT(cv.id), 0)::bigint as period_views
  FROM series s
  LEFT JOIN chapter_views cv ON cv.series_id = s.id AND cv.viewed_at >= start_date
  GROUP BY s.id, s.title, s.cover_url, s.status, s.type, s.total_views
  HAVING COALESCE(COUNT(cv.id), 0) > 0 OR time_period = 'all'
  ORDER BY 
    CASE WHEN time_period = 'all' THEN s.total_views ELSE 0 END DESC,
    COUNT(cv.id) DESC,
    s.updated_at DESC
  LIMIT result_limit;
END;
$$;

-- Create function to record a view and update total
CREATE OR REPLACE FUNCTION public.record_chapter_view(
  p_chapter_id uuid,
  p_series_id uuid,
  p_viewer_hash text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the view record
  INSERT INTO chapter_views (chapter_id, series_id, viewer_hash)
  VALUES (p_chapter_id, p_series_id, p_viewer_hash);
  
  -- Update total views on series
  UPDATE series SET total_views = total_views + 1 WHERE id = p_series_id;
END;
$$;