-- Update alt text to match file_name for all existing photos
UPDATE photos SET alt = file_name WHERE alt = 'Photography';
