-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id BIGSERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  alt TEXT DEFAULT 'Photography',
  height TEXT NOT NULL DEFAULT 'medium',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access"
ON photos FOR SELECT
USING (true);

-- Allow authenticated users to manage photos
CREATE POLICY "Authenticated users can insert"
ON photos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update"
ON photos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete"
ON photos FOR DELETE
TO authenticated
USING (true);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS photos_sort_order_idx ON photos(sort_order);
