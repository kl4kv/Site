'use client'

import { useCallback, useState } from 'react'
import { Upload, Image as ImageIcon, Loader2, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ImageUploaderProps {
  onImageUploaded: (url: string, filePath: string) => void
  existingImageUrl?: string | null
  existingFilePath?: string | null
  folder?: 'covers' | 'content'
  accept?: string
  maxSizeMB?: number
  className?: string
}

export function ImageUploader({
  onImageUploaded,
  existingImageUrl,
  existingFilePath,
  folder = 'covers',
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  maxSizeMB = 10,
  className,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null)
  const [filePath, setFilePath] = useState<string | null>(existingFilePath || null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    
    // Валидация типа
    const allowedTypes = accept.split(',').map(t => t.trim())
    if (!allowedTypes.includes(file.type)) {
      setError('Неподдерживаемый формат файла')
      return
    }
    
    // Валидация размера
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`Файл слишком большой (макс. ${maxSizeMB}MB)`)
      return
    }
    
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }, [accept, maxSizeMB])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    console.log('[ImageUploader] Starting upload...', { fileName: selectedFile.name, folder })

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folder', folder)

      const response = await fetch('/api/blog-images/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('[ImageUploader] Response status:', response.status)

      const result = await response.json()
      console.log('[ImageUploader] Response body:', result)

      if (!result.success) {
        throw new Error(result.error || 'Ошибка загрузки')
      }

      console.log('[ImageUploader] Upload successful:', result.data)
      
      setFilePath(result.data.file_path)
      setPreviewUrl(result.data.url)
      
      console.log('[ImageUploader] Calling onImageUploaded with:', { url: result.data.url, filePath: result.data.file_path })
      onImageUploaded(result.data.url, result.data.file_path)
      setSelectedFile(null)
    } catch (err) {
      console.error('[ImageUploader] Upload error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, folder, onImageUploaded])

  const handleRemoveImage = useCallback(async () => {
    if (filePath) {
      try {
        await fetch('/api/blog-images/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath }),
        })
      } catch (err) {
        console.error('Delete error:', err)
      }
    }
    
    setPreviewUrl(null)
    setFilePath(null)
    setSelectedFile(null)
    setError(null)
    onImageUploaded('', '')
  }, [filePath, onImageUploaded])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preview area */}
      {previewUrl && (
        <div className="relative aspect-video w-full max-w-lg rounded-lg overflow-hidden bg-muted border">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {!isUploading && (
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemoveImage}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Upload area */}
      {!previewUrl && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            'hover:border-primary hover:bg-primary/5',
            selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {selectedFile ? selectedFile.name : 'Перетащите изображение сюда'}
              </p>
              <p className="text-xs text-muted-foreground">
                или нажмите для выбора файла (макс. {maxSizeMB}MB)
              </p>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => document.getElementById('image-input')?.click()}
                type="button"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Выбрать файл
              </Button>
              
              {selectedFile && (
                <>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    type="button"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      'Загрузить'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedFile(null)
                      setError(null)
                    }}
                    type="button"
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
      )}

      {/* Success state */}
      {previewUrl && !isUploading && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Изображение загружено</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        id="image-input"
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleFileSelect(file)
          }
        }}
      />
    </div>
  )
}
