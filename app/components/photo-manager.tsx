"use client"

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { GripVertical, Trash2, Upload, Trash, Check, Eye, EyeOff } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { getPhotos, deletePhoto, getPhotoUrl, type Photo, togglePhotoVisibility } from '@/lib/photos'
import { supabase } from '@/lib/supabase'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortablePhotoRowProps {
  photo: Photo
  isSelected: boolean
  onToggleSelect: (id: number) => void
  onDelete: (photo: Photo) => void
  onToggleVisibility: (id: number) => void
}

function SortablePhotoRow({ photo, isSelected, onToggleSelect, onDelete, onToggleVisibility }: SortablePhotoRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 p-4 bg-card border rounded-lg transition-all duration-300 hover:shadow-md ${
        isDragging ? 'shadow-lg scale-[1.02] bg-muted' : ''
      } ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''} ${!photo.visible ? 'opacity-60' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Checkbox */}
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
        onClick={() => onToggleSelect(photo.id)}
      >
        {isSelected ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 border-2 border-current rounded-sm" />}
      </Button>

      {/* Image */}
      <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={getPhotoUrl(photo.file_path)}
          alt={photo.alt}
          fill
          className="object-cover"
        />
        {!photo.visible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <EyeOff className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {photo.file_name}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {photo.alt}
        </div>
      </div>

      {/* Alt Text */}
      <div className="hidden md:block w-48 text-sm text-muted-foreground truncate">
        {photo.alt}
      </div>

      {/* Visible */}
      <div className="hidden sm:block w-24 text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onToggleVisibility(photo.id)}
          title={photo.visible ? 'Hide' : 'Show'}
        >
          {photo.visible ? (
            <Eye className="h-4 w-4 text-green-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Sort Order */}
      <div className="hidden lg:block w-24 text-sm font-mono text-center">
        {photo.sort_order}
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
        onClick={() => onDelete(photo)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function PhotoManager() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return

    setUploading(true)
    try {
      const heights: ('short' | 'medium' | 'tall')[] = ['short', 'medium', 'tall']
      
      for (const file of files) {
        const randomHeight = heights[Math.floor(Math.random() * heights.length)]

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            height: randomHeight,
            visible: false, // New photos are invisible by default
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const { fileName, photo } = await response.json()

        if (!photo || !photo.file_path) {
          throw new Error('Invalid photo response from server')
        }

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
      }

      // Reload photos to get the new ones at the top
      await loadPhotos()
    } catch (error: any) {
      console.error('Error uploading:', error)
      alert(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleUpload(acceptedFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    multiple: true,
    disabled: uploading,
  })

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
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(photo.id)
        return next
      })
    } catch (error: any) {
      console.error('Error deleting:', error)
      alert(error.message || 'Failed to delete photo')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected photo${selectedIds.size > 1 ? 's' : ''}?`)) return

    try {
      const photosToDelete = photos.filter((p) => selectedIds.has(p.id))
      
      for (const photo of photosToDelete) {
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
      }

      setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)))
      setSelectedIds(new Set())
    } catch (error: any) {
      console.error('Error bulk deleting:', error)
      alert(error.message || 'Failed to delete photos')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = photos.findIndex((p) => p.id === active.id)
    const newIndex = photos.findIndex((p) => p.id === over.id)

    console.log('DragEnd:', { activeId: active.id, overId: over.id, oldIndex, newIndex })

    const newPhotos = arrayMove(photos, oldIndex, newIndex)

    const updates = newPhotos.map((photo, i) => ({
      id: photo.id,
      sort_order: i,
    }))

    console.log('Sending updates:', updates)

    try {
      const response = await fetch('/api/photos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      console.log('Reorder response:', response.status, response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Reorder failed')
      }

      setPhotos(newPhotos)
    } catch (error) {
      console.error('Error reordering:', error)
      loadPhotos()
    }
  }

  const handleToggleVisibility = async (id: number) => {
    try {
      const newVisible = await togglePhotoVisibility(id)
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, visible: newVisible } : p))
      )
    } catch (error: any) {
      console.error('Error toggling visibility:', error)
      alert(error.message || 'Failed to toggle visibility')
    }
  }

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)))
    }
  }, [photos, selectedIds.size])

  const selectedCount = selectedIds.size
  const invisibleCount = photos.filter((p) => !p.visible).length

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading photos...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Photo Manager</h2>
          <p className="text-muted-foreground mt-1">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} • {selectedCount} selected • {invisibleCount} hidden
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Selected ({selectedCount})
            </Button>
          )}
          <Button onClick={() => document.getElementById('photo-upload')?.click()} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(Array.from(e.target.files || []))}
            className="hidden"
          />
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto h-12 w-12 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        {isDragActive ? (
          <p className="mt-4 text-lg font-semibold text-primary">Drop photos here...</p>
        ) : (
          <>
            <p className="mt-4 text-lg font-semibold">Drag & drop photos here</p>
            <p className="text-muted-foreground mt-1">or click to select (new photos are hidden by default)</p>
          </>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No photos yet</h3>
          <p className="text-muted-foreground mt-1">Upload your first photo to get started</p>
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div className="hidden sm:flex items-center gap-4 p-4 mb-2 text-sm font-medium text-muted-foreground">
            <div className="w-8" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === photos.length && photos.length > 0 ? (
                <Check className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 border-2 border-current rounded-sm" />
              )}
            </Button>
            <div className="w-20">Image</div>
            <div className="flex-1">Title</div>
            <div className="hidden md:block w-48">Alt Text</div>
            <div className="hidden sm:block w-24 text-center">Visible</div>
            <div className="hidden lg:block w-24 text-center">Order</div>
            <div className="w-8" />
          </div>

          {/* Photo List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={photos.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {photos.map((photo) => (
                  <SortablePhotoRow
                    key={photo.id}
                    photo={photo}
                    isSelected={selectedIds.has(photo.id)}
                    onToggleSelect={toggleSelect}
                    onDelete={handleDelete}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  )
}
