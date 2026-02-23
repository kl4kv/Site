-- Миграция: Создание бакета для изображений блога
-- Описание: Создание публичного бакета 'images' для хранения обложек постов

-- ============================================
-- UP миграция
-- ============================================

-- Создаём бакет 'images' если он не существует
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  TRUE,  -- публичный бакет
  10485760,  -- 10MB лимит на файл
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DOWN миграция
-- ============================================
/*
DELETE FROM storage.buckets WHERE id = 'images';
*/
