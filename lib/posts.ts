import { createClient } from './supabase/server'

export interface PostCredit {
  label: string
  value: string
}

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  cover_image: string | null
  published: boolean
  created_at: string
  updated_at: string
  credits: PostCredit[]
}

/**
 * Получает все опубликованные посты, отсортированные по дате создания
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      content,
      excerpt,
      cover_image,
      published,
      created_at,
      updated_at,
      credits:post_credits (
        label,
        value,
        sort_order
      )
    `)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .order('sort_order', { referencedTable: 'credits', ascending: true })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  // Преобразуем данные в нужный формат
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    cover_image: post.cover_image,
    published: post.published,
    created_at: post.created_at,
    updated_at: post.updated_at,
    credits: (post.credits || []).map((credit: { label: string; value: string }) => ({
      label: credit.label,
      value: credit.value,
    })),
  }))
}

/**
 * Получает один пост по slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      content,
      excerpt,
      cover_image,
      published,
      created_at,
      updated_at,
      credits:post_credits (
        label,
        value,
        sort_order
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .order('sort_order', { referencedTable: 'credits', ascending: true })
    .single()

  if (error || !post) {
    console.error('Error fetching post:', error)
    return null
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    cover_image: post.cover_image,
    published: post.published,
    created_at: post.created_at,
    updated_at: post.updated_at,
    credits: (post.credits || []).map((credit: { label: string; value: string }) => ({
      label: credit.label,
      value: credit.value,
    })),
  }
}

/**
 * Получает URL для изображения из бакета Supabase Storage
 */
export function getImageUrl(path: string | null): string | null {
  if (!path) return null
  
  // Если путь начинается с http, возвращаем как есть
  if (path.startsWith('http')) {
    return path
  }

  // Для локальных путей в бакете Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && path.startsWith('/images/')) {
    const fileName = path.replace('/images/', '')
    return `${supabaseUrl}/storage/v1/object/public/images/${fileName}`
  }

  // Для локальных файлов в public директории
  return path
}
