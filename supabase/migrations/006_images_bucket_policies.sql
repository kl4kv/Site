-- Миграция: RLS политики для бакета images
-- Описание: Разрешаем публичную загрузку изображений (для разработки)

-- ============================================
-- UP миграция
-- ============================================

-- Удаляем существующие политики
DROP POLICY IF EXISTS "Публичный доступ на чтение изображений" ON storage.objects;
DROP POLICY IF EXISTS "Аутентифицированные пользователи могут загружать изображения" ON storage.objects;
DROP POLICY IF EXISTS "Аутентифицированные пользователи могут удалять изображения" ON storage.objects;
DROP POLICY IF EXISTS "Публичная загрузка изображений" ON storage.objects;

-- Политика 1: Публичный доступ на чтение всех изображений из бакета 'images'
CREATE POLICY "Публичный доступ на чтение изображений"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

-- Политика 2: Публичная загрузка изображений (для разработки/админки)
-- В продакшене лучше ограничить это только аутентифицированными пользователями
CREATE POLICY "Публичная загрузка изображений"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'images');

-- Политика 3: Публичное удаление изображений (для разработки/админки)
CREATE POLICY "Публичное удаление изображений"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'images');

-- ============================================
-- DOWN миграция
-- ============================================
/*
DROP POLICY IF EXISTS "Публичный доступ на чтение изображений" ON storage.objects;
DROP POLICY IF EXISTS "Публичная загрузка изображений" ON storage.objects;
DROP POLICY IF EXISTS "Публичное удаление изображений" ON storage.objects;
*/
