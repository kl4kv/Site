import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const photosDir = path.join(process.cwd(), 'public', 'photos')

async function uploadPhotos() {
  const files = fs.readdirSync(photosDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'))

  console.log(`Found ${files.length} photos to upload`)

  for (const file of files) {
    const filePath = path.join(photosDir, file)
    const fileContent = fs.readFileSync(filePath)

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(file, fileContent, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error(`Error uploading ${file}:`, error.message)
    } else {
      console.log(`Uploaded ${file}`)
    }
  }

  console.log('Done!')
}

uploadPhotos().catch(console.error)
