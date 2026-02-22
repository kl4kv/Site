-- Add visible column to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true;

-- Update existing photos to be visible
UPDATE photos SET visible = true WHERE visible IS NULL;

-- Create index for visibility filtering
CREATE INDEX IF NOT EXISTS photos_visible_idx ON photos(visible);

-- Update sort index to include visible for efficient ordering
DROP INDEX IF EXISTS photos_sort_order_idx;
CREATE INDEX IF NOT EXISTS photos_sort_idx ON photos(visible ASC, sort_order ASC);
