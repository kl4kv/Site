import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { id, file_path } = await request.json()

    // Delete from storage
    await supabase.storage.from('photos').remove([file_path])

    // Delete from database
    const { error } = await supabase.from('photos').delete().eq('id', id)
    if (error) throw error

    // Revalidate the home page cache
    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    )
  }
}
