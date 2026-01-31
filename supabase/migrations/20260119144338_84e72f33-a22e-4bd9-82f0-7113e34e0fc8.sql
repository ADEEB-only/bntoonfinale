-- Add alternative_titles column to series table
ALTER TABLE public.series ADD COLUMN alternative_titles text[] DEFAULT '{}';

-- Create a GIN index for fast full-text search on titles
CREATE INDEX idx_series_title_search ON public.series USING gin(to_tsvector('english', title));

-- Create a function for advanced series search
CREATE OR REPLACE FUNCTION public.search_series(
  search_query text,
  filter_status text DEFAULT NULL,
  filter_type text DEFAULT NULL,
  filter_genres uuid[] DEFAULT NULL,
  sort_by text DEFAULT 'relevance',
  result_limit int DEFAULT 20,
  result_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  alternative_titles text[],
  description text,
  cover_url text,
  status text,
  type text,
  rating numeric,
  is_featured boolean,
  updated_at timestamptz,
  chapters_count bigint,
  relevance_score real
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      s.id,
      s.title,
      s.alternative_titles,
      s.description,
      s.cover_url,
      s.status,
      s.type,
      s.rating,
      s.is_featured,
      s.updated_at,
      (SELECT COUNT(*) FROM chapters c WHERE c.series_id = s.id) as chapters_count,
      CASE 
        WHEN search_query IS NULL OR search_query = '' THEN 1.0
        ELSE GREATEST(
          -- Exact title match (highest priority)
          CASE WHEN LOWER(s.title) = LOWER(search_query) THEN 1.0 ELSE 0 END,
          -- Title starts with query
          CASE WHEN LOWER(s.title) LIKE LOWER(search_query) || '%' THEN 0.9 ELSE 0 END,
          -- Title contains query
          CASE WHEN LOWER(s.title) LIKE '%' || LOWER(search_query) || '%' THEN 0.7 ELSE 0 END,
          -- Alternative title exact match
          CASE WHEN EXISTS (
            SELECT 1 FROM unnest(s.alternative_titles) alt WHERE LOWER(alt) = LOWER(search_query)
          ) THEN 0.95 ELSE 0 END,
          -- Alternative title contains query
          CASE WHEN EXISTS (
            SELECT 1 FROM unnest(s.alternative_titles) alt WHERE LOWER(alt) LIKE '%' || LOWER(search_query) || '%'
          ) THEN 0.6 ELSE 0 END,
          -- Full-text search on title
          ts_rank(to_tsvector('english', s.title), plainto_tsquery('english', search_query)) * 0.5,
          -- Description contains query
          CASE WHEN s.description IS NOT NULL AND LOWER(s.description) LIKE '%' || LOWER(search_query) || '%' THEN 0.3 ELSE 0 END
        )
      END::real as relevance_score
    FROM series s
    WHERE 
      -- Search filter
      (search_query IS NULL OR search_query = '' OR 
        LOWER(s.title) LIKE '%' || LOWER(search_query) || '%' OR
        EXISTS (SELECT 1 FROM unnest(s.alternative_titles) alt WHERE LOWER(alt) LIKE '%' || LOWER(search_query) || '%') OR
        (s.description IS NOT NULL AND LOWER(s.description) LIKE '%' || LOWER(search_query) || '%') OR
        to_tsvector('english', s.title) @@ plainto_tsquery('english', search_query)
      )
      -- Status filter
      AND (filter_status IS NULL OR s.status = filter_status)
      -- Type filter  
      AND (filter_type IS NULL OR s.type = filter_type)
      -- Genre filter
      AND (filter_genres IS NULL OR array_length(filter_genres, 1) IS NULL OR EXISTS (
        SELECT 1 FROM series_genres sg WHERE sg.series_id = s.id AND sg.genre_id = ANY(filter_genres)
      ))
  )
  SELECT * FROM search_results sr
  WHERE sr.relevance_score > 0 OR (search_query IS NULL OR search_query = '')
  ORDER BY 
    CASE WHEN sort_by = 'relevance' THEN sr.relevance_score END DESC NULLS LAST,
    CASE WHEN sort_by = 'latest' THEN sr.updated_at END DESC NULLS LAST,
    CASE WHEN sort_by = 'title' THEN sr.title END ASC NULLS LAST,
    CASE WHEN sort_by = 'rating' THEN sr.rating END DESC NULLS LAST,
    sr.updated_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;