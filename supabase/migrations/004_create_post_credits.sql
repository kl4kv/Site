-- Миграция: Добавление таблицы post_credits для хранения кредитов поста
-- Описание: Отдельная таблица для метаданных (Локация, Дата, Категория, Фото и т.д.)

-- ============================================
-- UP миграция
-- ============================================

-- Создаём таблицу post_credits
CREATE TABLE IF NOT EXISTS post_credits (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,    -- Название кредита (Локация, Дата, Категория, Фото)
  value TEXT NOT NULL,    -- Значение кредита
  sort_order INTEGER NOT NULL DEFAULT 0  -- Порядок отображения
);

-- Добавляем комментарий к таблице
COMMENT ON TABLE post_credits IS 'Таблица для хранения метаданных поста (локация, дата, категория, автор фото и т.д.)';
COMMENT ON COLUMN post_credits.id IS 'Уникальный идентификатор кредита';
COMMENT ON COLUMN post_credits.post_id IS 'Ссылка на пост в таблице posts';
COMMENT ON COLUMN post_credits.label IS 'Название кредита (например: "Локация", "Дата")';
COMMENT ON COLUMN post_credits.value IS 'Значение кредита';
COMMENT ON COLUMN post_credits.sort_order IS 'Порядок отображения кредитов';

-- Индекс для быстрого поиска кредитов по посту
CREATE INDEX IF NOT EXISTS idx_post_credits_post_id ON post_credits(post_id);

-- Индекс для сортировки кредитов
CREATE INDEX IF NOT EXISTS idx_post_credits_sort_order ON post_credits(sort_order);

-- ============================================
-- Seed данные для кредитов
-- ============================================

-- Кредиты для поста "Прогулки по старому городу"
INSERT INTO post_credits (post_id, label, value, sort_order)
SELECT 
  p.id,
  unnest(ARRAY['Локация', 'Дата', 'Категория', 'Фото']) AS label,
  unnest(ARRAY['Тбилиси, Грузия', 'Январь 2025', 'Путешествия', 'Владимир']) AS value,
  unnest(ARRAY[1, 2, 3, 4]) AS sort_order
FROM posts p
WHERE p.slug = 'progulki-po-staromu-gorodu'
ON CONFLICT DO NOTHING;

-- Кредиты для поста "Тишина и вода"
INSERT INTO post_credits (post_id, label, value, sort_order)
SELECT 
  p.id,
  unnest(ARRAY['Локация', 'Дата', 'Категория', 'Формат']) AS label,
  unnest(ARRAY['Карелия, Россия', 'Август 2024', 'Природа', 'Фотоэссе']) AS value,
  unnest(ARRAY[1, 2, 3, 4]) AS sort_order
FROM posts p
WHERE p.slug = 'tishina-i-voda'
ON CONFLICT DO NOTHING;

-- ============================================
-- DOWN миграция
-- ============================================
/*
DROP INDEX IF EXISTS idx_post_credits_sort_order;
DROP INDEX IF EXISTS idx_post_credits_post_id;
DROP TABLE IF EXISTS post_credits;
*/
