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
    console.log('Reorder API received:', body)
    
    const { updates } = body

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid updates format' },
        { status: 400 }
      )
    }

    console.log('Updating sort_order for:', updates)

    // Update each photo's sort order
    for (const { id, sort_order } of updates) {
      const { error } = await supabase
        .from('photos')
        .update({ sort_order })
        .eq('id', id)
      
      if (error) {
        console.error(`Error updating photo ${id}:`, error)
        throw error
      }
      
      console.log(`Updated photo ${id} to sort_order ${sort_order}`)
    }

    // Revalidate the home page and photos page cache
    revalidatePath('/')
    revalidatePath('/photos')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
