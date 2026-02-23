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
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingImageUrl ? existingImageUrl : null
  )
  const [filePath, setFilePath] = useState<string | null>(
    existingFilePath ? existingFilePath : null
  )
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    console.log('[ImageUploader] handleFileSelect called:', { name: file.name, type: file.type, size: file.size })
    setError(null)

    // Валидация типа
    const allowedTypes = accept.split(',').map(t => t.trim())
    if (!allowedTypes.includes(file.type)) {
      console.log('[ImageUploader] Invalid file type:', file.type)
      setError('Неподдерживаемый формат файла')
      return
    }

    // Валидация размера
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      console.log('[ImageUploader] File too large:', file.size)
      setError(`Файл слишком большой (макс. ${maxSizeMB}MB)`)
      return
    }

    console.log('[ImageUploader] File validated, setting state')
    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    console.log('[ImageUploader] State set:', { selectedFile: file.name })
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
      
      // Сохраняем путь и URL
      const newFilePath = result.data.file_path
      const newUrl = result.data.url
      
      setFilePath(newFilePath)
      setPreviewUrl(newUrl)
      
      // Вызываем onImageUploaded с правильными значениями
      console.log('[ImageUploader] Calling onImageUploaded with:', { url: newUrl, filePath: newFilePath })
      onImageUploaded(newUrl, newFilePath)
      
      // Очищаем selectedFile но НЕ previewUrl и filePath
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

  // Если уже есть загруженное изображение
  if (previewUrl && !selectedFile) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="relative aspect-video w-full max-w-lg rounded-lg overflow-hidden bg-muted border">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemoveImage}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Изображение загружено</span>
        </div>
      </div>
    )
  }

  // Область загрузки
  return (
    <div className={cn('space-y-4', className)}>
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

          {/* Кнопка выбора файла - видна всегда */}
          <div className="flex gap-2 flex-wrap justify-center">
            <Button
              variant="outline"
              onClick={() => document.getElementById('image-input')?.click()}
              type="button"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Выбрать файл
            </Button>

            {/* Кнопки для загруженного файла */}
            {selectedFile && (
              <>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  type="button"
                  variant="default"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null)
                    setError(null)
                  }}
                  type="button"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      {/* Скрытый input для выбора файла */}
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
