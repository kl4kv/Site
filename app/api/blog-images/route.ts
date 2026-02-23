import { NextRequest, NextResponse } from 'next/server'
import { uploadBlogImage, deleteBlogImage, listBlogImages, IMAGE_FOLDERS } from '@/lib/blog-images'

/**
 * POST /api/blog-images/upload
 * Загрузка изображения
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API blog-images] Received POST request')
    
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string | null

    console.log('[API blog-images] File:', file ? { name: file.name, type: file.type, size: file.size } : 'null')
    console.log('[API blog-images] Folder:', folder)

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не найден' },
        { status: 400 }
      )
    }

    // Определяем папку
    let targetFolder = IMAGE_FOLDERS.covers
    if (folder === 'content') {
      targetFolder = IMAGE_FOLDERS.content
    } else if (folder === 'general') {
      targetFolder = IMAGE_FOLDERS.general
    }

    console.log('[API blog-images] Target folder:', targetFolder)

    // Загружаем изображение
    const result = await uploadBlogImage(file, targetFolder)

    console.log('[API blog-images] Upload result:', result)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.data!.url,
        file_path: result.data!.file_path,
        file_name: result.data!.file_name,
        size: result.data!.size,
      },
    })
  } catch (error) {
    console.error('[API blog-images] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blog-images
 * Получение списка изображений в папке
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const folder = searchParams.get('folder') || 'covers'
    
    let targetFolder = IMAGE_FOLDERS.covers
    if (folder === 'content') {
      targetFolder = IMAGE_FOLDERS.content
    } else if (folder === 'general') {
      targetFolder = IMAGE_FOLDERS.general
    }
    
    const result = await listBlogImages(targetFolder)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка получения списка' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/blog-images
 * Удаление изображения
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const filePath = body.filePath
    
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Путь к файлу не указан' },
        { status: 400 }
      )
    }
    
    const result = await deleteBlogImage(filePath)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка удаления' 
      },
      { status: 500 }
    )
  }
}
