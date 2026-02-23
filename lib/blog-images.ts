import { createClient } from './supabase/server'

/**
 * Типы для изображений блога
 */
export type ImageFolder = 'blog/covers' | 'blog/content' | 'general'

export interface BlogImage {
  id: string
  file_name: string
  file_path: string
  folder: ImageFolder
  url: string
  size: number
  mime_type: string
  created_at: string
}

/**
 * Конфигурация путей к папкам
 */
export const IMAGE_FOLDERS = {
  covers: 'blog/covers' as ImageFolder,
  content: 'blog/content' as ImageFolder,
  general: 'general' as ImageFolder,
}

/**
 * Генерирует уникальное имя файла
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.\-_]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
  
  return `${timestamp}-${random}-${safeName}`
}

/**
 * Получает полный путь к файлу в бакете
 */
export function getFilePath(folder: ImageFolder, fileName: string): string {
  return `${folder}/${fileName}`
}

/**
 * Получает публичный URL для изображения
 */
export function getImageUrl(filePath: string | null): string | null {
  if (!filePath) return null
  
  // Если это уже полный URL
  if (filePath.startsWith('http')) {
    return filePath
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && filePath.startsWith('/images/')) {
    const relativePath = filePath.replace('/images/', '')
    return `${supabaseUrl}/storage/v1/object/public/images/${relativePath}`
  }
  
  // Для путей без префикса
  if (supabaseUrl && !filePath.startsWith('http')) {
    return `${supabaseUrl}/storage/v1/object/public/images/${filePath}`
  }
  
  return filePath
}

/**
 * Загружает изображение в Supabase Storage
 */
export async function uploadBlogImage(
  file: File,
  folder: ImageFolder = IMAGE_FOLDERS.covers
): Promise<{ success: boolean; data?: BlogImage; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Валидация типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Неподдерживаемый формат файла. Разрешены: JPEG, PNG, WebP, GIF',
      }
    }
    
    // Валидация размера (макс 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Файл слишком большой. Максимальный размер: 10MB',
      }
    }
    
    // Генерируем уникальное имя файла
    const fileName = generateFileName(file.name)
    const filePath = getFilePath(folder, fileName)
    
    // Читаем файл как ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Загружаем в Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
        duplex: 'half',
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return {
        success: false,
        error: `Ошибка загрузки: ${uploadError.message}`,
      }
    }
    
    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)
    
    // Создаём запись об изображении
    const image: BlogImage = {
      id: uploadData.path,
      file_name: fileName,
      file_path: filePath,
      folder,
      url: urlData.publicUrl,
      size: file.size,
      mime_type: file.type,
      created_at: new Date().toISOString(),
    }
    
    return {
      success: true,
      data: image,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

/**
 * Удаляет изображение из Storage
 */
export async function deleteBlogImage(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.storage
      .from('images')
      .remove([filePath])
    
    if (error) {
      return {
        success: false,
        error: `Ошибка удаления: ${error.message}`,
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

/**
 * Получает список изображений в папке
 */
export async function listBlogImages(
  folder: ImageFolder
): Promise<{ success: boolean; data?: BlogImage[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: files, error } = await supabase.storage
      .from('images')
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })
    
    if (error) {
      return {
        success: false,
        error: `Ошибка получения списка: ${error.message}`,
      }
    }
    
    const images: BlogImage[] = (files || []).map((file) => {
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(`${folder}/${file.name}`)
      
      return {
        id: file.id || `${folder}/${file.name}`,
        file_name: file.name,
        file_path: `${folder}/${file.name}`,
        folder,
        url: urlData.publicUrl,
        size: file.metadata?.size || 0,
        mime_type: file.metadata?.mimeType || 'image/jpeg',
        created_at: file.created_at || new Date().toISOString(),
      }
    })
    
    return {
      success: true,
      data: images,
    }
  } catch (error) {
    console.error('List error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

/**
 * Обновляет cover_image в посте
 */
export async function updatePostCoverImage(
  postId: number,
  coverImagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('posts')
      .update({ cover_image: `/images/${coverImagePath}` })
      .eq('id', postId)
    
    if (error) {
      return {
        success: false,
        error: `Ошибка обновления поста: ${error.message}`,
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Update post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}
