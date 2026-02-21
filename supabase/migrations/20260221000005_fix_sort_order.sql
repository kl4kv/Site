-- Fix sort_order to be unique for each photo
-- Assign sort_order based on id order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 AS new_sort_order
  FROM photos
)
UPDATE photos p
SET sort_order = n.new_sort_order
FROM numbered n
WHERE p.id = n.id;
