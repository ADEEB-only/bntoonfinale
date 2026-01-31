-- Add optional rating column to series table (admin-controlled only)
ALTER TABLE public.series 
ADD COLUMN rating numeric(3,1) DEFAULT NULL 
CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10));