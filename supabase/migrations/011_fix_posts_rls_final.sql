-- Миграция: Полное исправление RLS для posts
-- Описание: Удаляем ВСЕ политики и создаём новые для публичного доступа

-- ============================================
-- UP миграция
-- ============================================

-- Сначала отключаем RLS полностью
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Включаем обратно
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Удаляем ВСЕ политики для posts через DO блок
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
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- ============================================
-- Создаём новые политики с простыми именами
-- ============================================

-- 1. SELECT: все могут читать все посты
CREATE POLICY "posts_select_all"
  ON posts FOR SELECT
  USING (TRUE);

-- 2. INSERT: все могут создавать
CREATE POLICY "posts_insert_all"
  ON posts FOR INSERT
  WITH CHECK (TRUE);

-- 3. UPDATE: все могут обновлять
CREATE POLICY "posts_update_all"
  ON posts FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- 4. DELETE: все могут удалять
CREATE POLICY "posts_delete_all"
  ON posts FOR DELETE
  USING (TRUE);

-- ============================================
-- DOWN миграция
-- ============================================
/*
DROP POLICY IF EXISTS "posts_select_all" ON posts;
DROP POLICY IF EXISTS "posts_insert_all" ON posts;
DROP POLICY IF EXISTS "posts_update_all" ON posts;
DROP POLICY IF EXISTS "posts_delete_all" ON posts;
*/
