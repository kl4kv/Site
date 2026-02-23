-- Миграция: Исправление RLS политик для бакета images
-- Описание: Разрешаем публичную загрузку для разработки

-- ============================================
-- UP миграция
-- ============================================

-- Удаляем ВСЕ существующие политики для storage.objects
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- ============================================
-- Политика 1: Публичный доступ на чтение (SELECT)
-- ============================================
CREATE POLICY "images_public_select"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

-- ============================================
-- Политика 2: Публичная загрузка (INSERT)
-- Для разработки разрешаем всем, в продакшене ограничить authenticated
-- ============================================
CREATE POLICY "images_public_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'images');

-- ============================================
-- Политика 3: Публичное удаление (DELETE)
-- ============================================
CREATE POLICY "images_public_delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'images');

-- ============================================
-- Политика 4: Обновление метаданных (UPDATE)
-- ============================================
CREATE POLICY "images_public_update"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

-- ============================================
-- DOWN миграция
-- ============================================
/*
DROP POLICY IF EXISTS "images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "images_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "images_public_delete" ON storage.objects;
DROP POLICY IF EXISTS "images_public_update" ON storage.objects;
*/
