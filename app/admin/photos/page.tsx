import { PhotoManager } from '@/app/components/photo-manager'

export default function PhotosAdminPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <PhotoManager />
      </div>
    </div>
  )
}
