-- Create genres table
CREATE TABLE public.genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create junction table for series-genres many-to-many relationship
CREATE TABLE public.series_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  genre_id uuid NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (series_id, genre_id)
);

-- Enable RLS
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_genres ENABLE ROW LEVEL SECURITY;

-- RLS policies for genres (public read, admin write)
CREATE POLICY "Genres are viewable by everyone"
ON public.genres FOR SELECT
USING (true);

CREATE POLICY "Admins can insert genres"
ON public.genres FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update genres"
ON public.genres FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete genres"
ON public.genres FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for series_genres (public read, admin write)
CREATE POLICY "Series genres are viewable by everyone"
ON public.series_genres FOR SELECT
USING (true);

CREATE POLICY "Admins can insert series genres"
ON public.series_genres FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete series genres"
ON public.series_genres FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert some default genres
INSERT INTO public.genres (name, slug) VALUES
  ('Action', 'action'),
  ('Adventure', 'adventure'),
  ('Comedy', 'comedy'),
  ('Drama', 'drama'),
  ('Fantasy', 'fantasy'),
  ('Horror', 'horror'),
  ('Mystery', 'mystery'),
  ('Romance', 'romance'),
  ('Sci-Fi', 'sci-fi'),
  ('Slice of Life', 'slice-of-life'),
  ('Sports', 'sports'),
  ('Supernatural', 'supernatural'),
  ('Thriller', 'thriller');