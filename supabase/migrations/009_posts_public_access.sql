-- Миграция: Разрешаем анонимный доступ к posts для разработки
-- Описание: Для упрощения разработки разрешаем операции без аутентификации

-- ============================================
-- UP миграция
-- ============================================

-- Удаляем существующие политики
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'posts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON posts', pol.policyname);
    END LOOP;
END $$;

-- ============================================
-- Политика 1: Публичный SELECT только для опубликованных постов
-- ============================================
CREATE POLICY "posts_public_select"
  ON posts
  FOR SELECT
  USING (TRUE);  -- Разрешаем SELECT всем (для опубликованных фильтруется в приложении)

-- ============================================
-- Политика 2: Разрешаем INSERT всем (для разработки)
-- В продакшене лучше ограничить authenticated
-- ============================================
CREATE POLICY "posts_public_insert"
  ON posts
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================
-- Политика 3: Разрешаем UPDATE всем (для разработки)
-- ============================================
CREATE POLICY "posts_public_update"
  ON posts
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================
-- Политика 4: Разрешаем DELETE всем (для разработки)
-- ============================================
CREATE POLICY "posts_public_delete"
  ON posts
  FOR DELETE
  USING (TRUE);

-- ============================================
-- DOWN миграция
-- ============================================
/*
DROP POLICY IF EXISTS "posts_public_select" ON posts;
DROP POLICY IF EXISTS "posts_public_insert" ON posts;
DROP POLICY IF EXISTS "posts_public_update" ON posts;
DROP POLICY IF EXISTS "posts_public_delete" ON posts;
*/
