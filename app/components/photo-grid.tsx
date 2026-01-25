"use client"

import Image from "next/image"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Photo {
  id: number
  src: string
  alt: string
  height: "short" | "medium" | "tall"
}

const photos: Photo[] = [
  { id: 1, src: "/photos/07db14b81065aaeed8ce548029ed3263.jpg", alt: "Photography", height: "tall" },
  { id: 2, src: "/photos/149c4a05fbfeebb75a698ea47df36d3d.jpg", alt: "Photography", height: "medium" },
  { id: 3, src: "/photos/1ff1259f35032b5906f06a77f3984558.jpg", alt: "Photography", height: "short" },
  { id: 4, src: "/photos/2a9d4360785a5f1a3be400267fa4d9be.jpg", alt: "Photography", height: "short" },
  { id: 5, src: "/photos/789ed5ee684efdeea44418519af702f1.jpg", alt: "Photography", height: "tall" },
  { id: 6, src: "/photos/7c785a56c733f56aea35ffa1e7b4c25a.jpg", alt: "Photography", height: "medium" },
  { id: 7, src: "/photos/b8ad4ebc9e668bdae34062ed3fb4e9e4.jpg", alt: "Photography", height: "medium" },
  { id: 8, src: "/photos/cdb82cc105459517cf64758daf8b195b.jpg", alt: "Photography", height: "short" },
  { id: 9, src: "/photos/d970add338ab8d84b185658e68cd83a8.jpg", alt: "Photography", height: "tall" },
]

const heightClasses = {
  short: "aspect-square",
  medium: "aspect-[3/4]",
  tall: "aspect-[2/3]",
}

export function PhotoGrid() {
  return (
    <section className="px-4 md:px-6 py-12 pt-24">
      <div className="container mx-auto">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative mb-4 break-inside-avoid group"
            >
              <div className={`relative ${heightClasses[photo.height]} overflow-hidden rounded-xl bg-muted`}>
                <Image
                  src={photo.src}
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
