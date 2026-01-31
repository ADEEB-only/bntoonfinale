-- Add is_featured column to series table for admin control of featured section
ALTER TABLE public.series 
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Create index for faster featured queries
CREATE INDEX idx_series_is_featured ON public.series (is_featured) WHERE is_featured = true;