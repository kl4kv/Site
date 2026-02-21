"use client"

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { MoreHorizontal, Trash2, Upload, MoveUp, MoveDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPhotos, deletePhoto, getPhotoUrl, type Photo } from '@/lib/photos'
import { supabase } from '@/lib/supabase'

export function PhotoManager() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPhotos = useCallback(async () => {
    try {
      console.log('Loading photos...')
      const data = await getPhotos()
      console.log('Loaded photos:', data)
      setPhotos(data)
      setError(null)
    } catch (err: any) {
      console.error('Error loading photos:', err)
      setError(err.message || 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const heights: ('short' | 'medium' | 'tall')[] = ['short', 'medium', 'tall']
      const randomHeight = heights[Math.floor(Math.random() * heights.length)]

      // First, create database record and get file info
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          height: randomHeight,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { fileName, photo } = await response.json()
      
      console.log('Upload response:', { fileName, photo })

      if (!photo || !photo.file_path) {
        throw new Error('Invalid photo response from server')
      }

      // Upload file directly to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('File uploaded successfully')
      setPhotos((prev) => [...prev, photo])
    } catch (error: any) {
      console.error('Error uploading:', error)
      alert(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (photo: Photo) => {
    if (!confirm('Delete this photo?')) return

    try {
      const response = await fetch('/api/photos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: photo.id,
          file_path: photo.file_path,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch (error: any) {
      console.error('Error deleting:', error)
      alert(error.message || 'Failed to delete photo')
    }
  }

  const movePhoto = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= photos.length) return

    const newPhotos = [...photos]
    const temp = newPhotos[index]
    newPhotos[index] = newPhotos[newIndex]
    newPhotos[newIndex] = temp

    // Update sort orders
    const updates = newPhotos.map((photo, i) => ({
      id: photo.id,
      sort_order: i,
    }))

    try {
      await fetch('/api/photos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      setPhotos(newPhotos)
    } catch (error) {
      console.error('Error reordering:', error)
    }
  }

  if (loading) return <div className="p-4">Loading photos...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Photo Manager</h2>
        <div>
          <Button onClick={() => document.getElementById('photo-upload')?.click()} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative break-inside-avoid group">
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <Image
                src={getPhotoUrl(photo.file_path)}
                alt={photo.alt}
                width={400}
                height={600}
                className="w-full h-auto"
              />
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => movePhoto(index, 'up')}
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => movePhoto(index, 'down')}
                disabled={index === photos.length - 1}
              >
                <MoveDown className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDelete(photo)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
