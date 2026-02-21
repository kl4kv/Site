import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function syncPhotos() {
  // Get list of files from storage
  const { data: files, error: listError } = await supabase.storage
    .from('photos')
    .list()

  if (listError) {
    console.error('Error listing files:', listError)
    return
  }

  console.log(`Found ${files.length} files in storage`)

  // Get existing photos from database
  const { data: existingPhotos } = await supabase
    .from('photos')
    .select('file_path')

  const existingPaths = new Set(existingPhotos?.map(p => p.file_path) || [])

  // Add missing photos to database
  const heights: ('short' | 'medium' | 'tall')[] = ['short', 'medium', 'tall']
  let added = 0

  for (const file of files) {
    if (!existingPaths.has(file.name)) {
      const randomHeight = heights[Math.floor(Math.random() * heights.length)]
      
      const { error } = await supabase
        .from('photos')
        .insert({
          file_name: file.name,
          file_path: file.name,
          alt: 'Photography',
          height: randomHeight,
          sort_order: added,
        })

      if (error) {
        console.error(`Error adding ${file.name}:`, error)
      } else {
        console.log(`Added ${file.name}`)
        added++
      }
    }
  }

  console.log(`Done! Added ${added} photos to database`)
}

syncPhotos().catch(console.error)
