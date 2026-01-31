-- Add type column to series table for comic type classification
ALTER TABLE public.series 
ADD COLUMN type text NOT NULL DEFAULT 'manhwa';

-- Add a check constraint to ensure valid types
ALTER TABLE public.series 
ADD CONSTRAINT series_type_check CHECK (type IN ('manhwa', 'manga', 'manhua'));