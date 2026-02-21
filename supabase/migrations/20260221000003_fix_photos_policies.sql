-- Update policies for photos table to allow anonymous access
DROP POLICY IF EXISTS "Public read access" ON photos;
DROP POLICY IF EXISTS "Authenticated users can insert" ON photos;
DROP POLICY IF EXISTS "Authenticated users can update" ON photos;
DROP POLICY IF EXISTS "Authenticated users can delete" ON photos;

-- Allow anyone to read photos
CREATE POLICY "Anyone can read"
ON photos FOR SELECT
USING (true);

-- Allow anyone to insert photos
CREATE POLICY "Anyone can insert"
ON photos FOR INSERT
WITH CHECK (true);

-- Allow anyone to update photos
CREATE POLICY "Anyone can update"
ON photos FOR UPDATE
USING (true);

-- Allow anyone to delete photos
CREATE POLICY "Anyone can delete"
ON photos FOR DELETE
USING (true);
