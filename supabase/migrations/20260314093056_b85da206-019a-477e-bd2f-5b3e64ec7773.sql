
-- Add image_url column to questions table
ALTER TABLE public.questions ADD COLUMN image_url TEXT;

-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true);

-- Allow anyone to read question images (public bucket)
CREATE POLICY "Anyone can read question images"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

-- Allow authenticated or anon to upload (admin auth is handled at edge function level)
CREATE POLICY "Anyone can upload question images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'question-images');

CREATE POLICY "Anyone can update question images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'question-images');

CREATE POLICY "Anyone can delete question images"
ON storage.objects FOR DELETE
USING (bucket_id = 'question-images');
