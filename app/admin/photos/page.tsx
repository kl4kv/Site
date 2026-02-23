import { PhotoManager } from '@/app/components/photo-manager'
import Link from 'next/link'

export default function PhotosAdminPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-4">Админ-панель</h1>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/90 transition-colors"
            >
              Посты
            </Link>
            <Link
              href="/admin/photos"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Фотографии
            </Link>
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/90 transition-colors"
            >
              Открыть сайт
            </Link>
          </div>
        </div>

        <PhotoManager />
      </div>
    </div>
  )
}
