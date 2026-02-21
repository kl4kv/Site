import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const { fileName: originalFileName, height } = body

    // Generate unique filename
    const fileExt = originalFileName.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

    console.log('Upload request:', { originalFileName, fileName, height })

    // Create database record first
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        file_name: originalFileName,
        file_path: fileName,
        alt: originalFileName,
        height,
        sort_order: 0,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName)

    console.log('Photo created:', photo)

    // Revalidate the home page cache
    revalidatePath('/')

    return NextResponse.json({
      fileName,
      photo,
      publicUrl: urlData.publicUrl,
    })
  } catch (error: any) {
    console.error('Error creating upload:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create upload' },
      { status: 500 }
    )
  }
}
