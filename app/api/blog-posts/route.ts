import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Credit {
  label: string
  value: string
}

interface PostBody {
  id?: number
  title: string
  slug: string
  content: string
  excerpt: string
  cover_image: string | null
  published: boolean
  credits: Credit[]
}

/**
 * POST /api/blog-posts
 * Создание или обновление поста
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: PostBody = await request.json()

    // Валидация
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Заполните обязательные поля' },
        { status: 400 }
      )
    }

    // Проверка уникальности slug (если это не обновление существующего поста)
    if (!body.id) {
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('slug', body.slug)
        .single()

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Пост с таким URL уже существует' },
          { status: 400 }
        )
      }
    }

    if (body.id) {
      // Обновление существующего поста
      const { data: post, error: updateError } = await supabase
        .from('posts')
        .update({
          title: body.title,
          slug: body.slug,
          content: body.content,
          excerpt: body.excerpt || null,
          cover_image: body.cover_image,
          published: body.published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        )
      }

      // Обновляем кредиты
      if (body.credits) {
        // Удаляем старые кредиты
        await supabase
          .from('post_credits')
          .delete()
          .eq('post_id', body.id)

        // Добавляем новые
        if (body.credits.length > 0) {
          const creditsData = body.credits.map((credit, index) => ({
            post_id: body.id,
            label: credit.label,
            value: credit.value,
            sort_order: index + 1,
          }))

          await supabase
            .from('post_credits')
            .insert(creditsData)
        }
      }

      return NextResponse.json({
        success: true,
        data: { id: post.id },
        message: 'Пост обновлён',
      })
    } else {
      // Создание нового поста
      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({
          title: body.title,
          slug: body.slug,
          content: body.content,
          excerpt: body.excerpt || null,
          cover_image: body.cover_image,
          published: body.published,
          author_id: null, // Для публичных постов без автора
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        )
      }

      // Добавляем кредиты
      if (body.credits && body.credits.length > 0) {
        const creditsData = body.credits.map((credit, index) => ({
          post_id: post.id,
          label: credit.label,
          value: credit.value,
          sort_order: index + 1,
        }))

        await supabase
          .from('post_credits')
          .insert(creditsData)
      }

      return NextResponse.json({
        success: true,
        data: { id: post.id },
        message: 'Пост создан',
      })
    }
  } catch (error) {
    console.error('Post error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка сервера' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/blog-posts
 * Удаление поста
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID поста не указан' },
        { status: 400 }
      )
    }

    // Получаем информацию о посте для удаления обложки
    const { data: post } = await supabase
      .from('posts')
      .select('cover_image')
      .eq('id', id)
      .single()

    // Удаляем пост (кредиты удалятся каскадно)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Удаляем обложку из Storage если она есть
    if (post?.cover_image) {
      const imagePath = post.cover_image.replace('/images/', '')
      await supabase.storage
        .from('images')
        .remove([imagePath])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка сервера' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blog-posts
 * Получение списка всех постов (для админки)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (id) {
      // Получение одного поста по ID
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          credits:post_credits (
            label,
            value,
            sort_order
          )
        `)
        .eq('id', parseInt(id))
        .single()

      if (error || !post) {
        return NextResponse.json(
          { success: false, error: 'Пост не найден' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          ...post,
          cover_image_url: post.cover_image ? 
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${post.cover_image.replace('/images/', '')}` 
            : null,
          cover_image_path: post.cover_image?.replace('/images/', '') || null,
          credits: (post.credits || []).map((c: { label: string; value: string }) => ({
            label: c.label,
            value: c.value,
          })),
        },
      })
    }

    // Получение всех постов
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        cover_image,
        published,
        created_at,
        credits:post_credits (
          label,
          value
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: posts.map((post) => ({
        ...post,
        cover_image_url: post.cover_image ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${post.cover_image.replace('/images/', '')}` 
          : null,
        credits: (post.credits || []).map((c: { label: string; value: string }) => ({
          label: c.label,
          value: c.value,
        })),
      })),
    })
  } catch (error) {
    console.error('Get error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка сервера' 
      },
      { status: 500 }
    )
  }
}
