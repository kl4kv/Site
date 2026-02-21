-- Update storage policies to allow anonymous access
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Allow anyone to upload to photos bucket
CREATE POLICY "Anyone can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');

-- Allow anyone to update their uploads
CREATE POLICY "Anyone can update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'photos');

-- Allow anyone to delete
CREATE POLICY "Anyone can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'photos');
