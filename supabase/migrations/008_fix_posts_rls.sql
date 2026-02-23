-- Миграция: Исправление RLS политик для таблицы posts
-- Описание: Разрешаем INSERT без author_id для администрирования

-- ============================================
-- UP миграция
-- ============================================

-- Удаляем ВСЕ существующие политики для posts
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
  USING (published = TRUE);

-- ============================================
-- Политика 2: Авторизованные пользователи могут создавать посты
-- Разрешаем INSERT с NULL author_id (для админ-панели)
-- ============================================
CREATE POLICY "posts_auth_insert"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id OR author_id IS NULL
  );

-- ============================================
-- Политика 3: Авторизованные пользователи могут обновлять любые посты
-- ============================================
CREATE POLICY "posts_auth_update"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================
-- Политика 4: Авторизованные пользователи могут удалять любые посты
-- ============================================
CREATE POLICY "posts_auth_delete"
  ON posts
  FOR DELETE
  TO authenticated
  USING (TRUE);

-- ============================================
-- DOWN миграция
-- ============================================
/*
DROP POLICY IF EXISTS "posts_public_select" ON posts;
DROP POLICY IF EXISTS "posts_auth_insert" ON posts;
DROP POLICY IF EXISTS "posts_auth_update" ON posts;
DROP POLICY IF EXISTS "posts_auth_delete" ON posts;
*/
