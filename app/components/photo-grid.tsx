import Image from "next/image"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPhotos, getPhotoUrl } from "@/lib/photos"

const heightClasses = {
  short: "aspect-square",
  medium: "aspect-[3/4]",
  tall: "aspect-[2/3]",
}

export async function PhotoGrid() {
  const photos = await getPhotos()

  console.log('PhotoGrid photos order:', photos.map(p => ({ id: p.id, sort_order: p.sort_order, file_name: p.file_name })))

  return (
    <section className="px-4 md:px-6 py-12 pt-24">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative break-inside-avoid group"
            >
              <div className={`relative ${heightClasses[photo.height]} overflow-hidden rounded-xl bg-muted`}>
                <Image
                  src={getPhotoUrl(photo.file_path)}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              >
                <MoreHorizontal className="h-4 w-4 text-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
