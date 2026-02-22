import { supabase } from './supabase'

export interface Photo {
  id: number
  file_name: string
  file_path: string
  alt: string
  height: 'short' | 'medium' | 'tall'
  sort_order: number
  visible: boolean
  created_at: string
}

export async function getPhotos(): Promise<Photo[]> {
  console.log('getPhotos called')
  // Order by visible ASC (invisible first), then by sort_order
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('visible', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getPhotos error:', error)
    throw error
  }
  console.log('getPhotos result:', data)
  return data || []
}

export async function uploadPhoto(
  file: File,
  height: 'short' | 'medium' | 'tall'
): Promise<Photo> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = fileName

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  // Create database record
  const { data: photo, error: dbError } = await supabase
    .from('photos')
    .insert({
      file_name: fileName,
      file_path: filePath,
      alt: 'Photography',
      height,
      sort_order: 0,
    })
    .select()
    .single()

  if (dbError) throw dbError
  return photo
}

export async function deletePhoto(photo: Photo): Promise<void> {
  // Delete from storage
  await supabase.storage.from('photos').remove([photo.file_path])

  // Delete from database
  const { error } = await supabase.from('photos').delete().eq('id', photo.id)
  if (error) throw error
}

export async function updatePhotoOrder(
  updates: { id: number; sort_order: number }[]
): Promise<void> {
  const { error } = await supabase.rpc('update_photo_order', {
    photo_updates: updates,
  })
  if (error) throw error
}

export async function togglePhotoVisibility(id: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('photos')
    .select('visible')
    .eq('id', id)
    .single()

  if (error) throw error

  const newVisible = !data.visible
  const { error: updateError } = await supabase
    .from('photos')
    .update({ visible: newVisible })
    .eq('id', id)

  if (updateError) throw updateError

  return newVisible
}

export function getPhotoUrl(filePath: string): string {
  const { data } = supabase.storage.from('photos').getPublicUrl(filePath)
  return data.publicUrl
}
