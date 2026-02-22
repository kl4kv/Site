import Image, { type ImageProps } from "next/image"

interface Credit {
  label: string
  value: string
}

interface BlogEntryProps {
  title: string
  credits: Credit[]
  image: {
    src: string
    alt: string
  }
  children: React.ReactNode
}

export function BlogEntry({ title, credits, image, children }: BlogEntryProps) {
  return (
    <article className="flex flex-col gap-8">
      {/* Title */}
      <h2 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h2>

      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
        />
      </div>

      {/* Credits */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
        {credits.map((credit) => (
          <div key={credit.label} className="flex items-center gap-2">
            <span className="font-medium text-foreground">{credit.label}:</span>
            <span>{credit.value}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none font-serif text-base leading-relaxed text-foreground">
        {children}
      </div>
    </article>
  )
}
