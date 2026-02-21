-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to photos bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'photos');

CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'photos');
