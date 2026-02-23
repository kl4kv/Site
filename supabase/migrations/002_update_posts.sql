-- Миграция: Обновление таблицы posts
-- Описание: Добавление всех полей, индексов, триггеров и RLS политик

-- ============================================
-- UP миграция (применение изменений)
-- ============================================

-- 1. Добавляем недостающие поля (если их нет)
DO $$ 
BEGIN
  -- Добавляем updated_at если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'updated_at') THEN
    ALTER TABLE posts ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  
  -- Добавляем slug если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'slug') THEN
    ALTER TABLE posts ADD COLUMN slug TEXT;
  END IF;
  
  -- Добавляем content если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'content') THEN
    ALTER TABLE posts ADD COLUMN content TEXT;
  END IF;
  
  -- Добавляем excerpt если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'excerpt') THEN
    ALTER TABLE posts ADD COLUMN excerpt TEXT;
  END IF;
  
  -- Добавляем cover_image если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'cover_image') THEN
    ALTER TABLE posts ADD COLUMN cover_image TEXT;
  END IF;
  
  -- Добавляем published если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'published') THEN
    ALTER TABLE posts ADD COLUMN published BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  
  -- Добавляем author_id если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_id') THEN
    ALTER TABLE posts ADD COLUMN author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Делаем поле slug NOT NULL (после того как все существующие записи получат значение)
ALTER TABLE posts ALTER COLUMN slug SET NOT NULL;

-- 3. Делаем поле content NOT NULL
ALTER TABLE posts ALTER COLUMN content SET NOT NULL;

-- 4. Добавляем комментарии к таблице и полям
COMMENT ON TABLE posts IS 'Таблица для хранения записей блога с поддержкой черновиков и опубликованных постов';
COMMENT ON COLUMN posts.id IS 'Уникальный идентификатор поста (автоинкремент)';
COMMENT ON COLUMN posts.created_at IS 'Дата и время создания поста';
COMMENT ON COLUMN posts.updated_at IS 'Дата и время последнего обновления поста';
COMMENT ON COLUMN posts.title IS 'Заголовок статьи';
COMMENT ON COLUMN posts.slug IS 'URL-слагов поста (уникальный, для формирования ссылок)';
COMMENT ON COLUMN posts.content IS 'Основное содержимое статьи (HTML или Markdown)';
COMMENT ON COLUMN posts.excerpt IS 'Краткое описание для превью (анонс статьи)';
COMMENT ON COLUMN posts.cover_image IS 'Путь к изображению обложки поста';
COMMENT ON COLUMN posts.published IS 'Флаг публикации: true = опубликовано, false = черновик';
COMMENT ON COLUMN posts.author_id IS 'ID автора поста (ссылка на auth.users)';

-- ============================================
-- 5. Индексы для оптимизации запросов
-- ============================================

-- Уникальный индекс на slug (для быстрого поиска и гарантии уникальности URL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- Индекс на published (для быстрой фильтрации опубликованных постов)
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);

-- Индекс на created_at (для сортировки по дате создания)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Индекс на author_id (для быстрого поиска постов по автору)
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);

-- ============================================
-- 6. Функция для автоматического обновления updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Триггерная функция для автоматического обновления поля updated_at при изменении записи';

-- ============================================
-- 7. Триггер для обновления updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Row Level Security (RLS)
-- ============================================

-- Включаем RLS для таблицы posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики (если есть) перед созданием новых
DROP POLICY IF EXISTS "Публичный доступ к опубликованным постам" ON posts;
DROP POLICY IF EXISTS "Авторизованные пользователи могут создавать посты" ON posts;
DROP POLICY IF EXISTS "Авторы могут обновлять свои посты" ON posts;
DROP POLICY IF EXISTS "Авторы могут удалять свои посты" ON posts;

-- --------------------------------------------
-- Политика 1: Публичный SELECT только для опубликованных постов
-- --------------------------------------------
CREATE POLICY "Публичный доступ к опубликованным постам"
  ON posts
  FOR SELECT
  USING (published = TRUE);

-- --------------------------------------------
-- Политика 2: Авторизованные пользователи могут создавать посты (INSERT)
-- --------------------------------------------
CREATE POLICY "Авторизованные пользователи могут создавать посты"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- --------------------------------------------
-- Политика 3: Автор поста может обновлять свои посты (UPDATE)
-- --------------------------------------------
CREATE POLICY "Авторы могут обновлять свои посты"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- --------------------------------------------
-- Политика 4: Автор поста может удалять свои посты (DELETE)
-- --------------------------------------------
CREATE POLICY "Авторы могут удалять свои посты"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- ============================================
-- DOWN миграция (откат изменений)
-- ============================================
/*
-- Удаляем политики RLS
DROP POLICY IF EXISTS "Публичный доступ к опубликованным постам" ON posts;
DROP POLICY IF EXISTS "Авторизованные пользователи могут создавать посты" ON posts;
DROP POLICY IF EXISTS "Авторы могут обновлять свои посты" ON posts;
DROP POLICY IF EXISTS "Авторы могут удалять свои посты" ON posts;

-- Отключаем RLS
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Удаляем триггер
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;

-- Удаляем функцию
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Удаляем индексы
DROP INDEX IF EXISTS idx_posts_slug;
DROP INDEX IF EXISTS idx_posts_published;
DROP INDEX IF EXISTS idx_posts_created_at;
DROP INDEX IF EXISTS idx_posts_author_id;

-- Примечание: поля не удаляем, так как они могут содержать данные
*/
