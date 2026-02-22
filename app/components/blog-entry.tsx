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

      <div className="flex flex-col md:flex-row gap-8">
        {/* Credits - Left Sidebar */}
        <aside className="md:w-48 shrink-0">
          <dl className="flex flex-col gap-4 text-sm">
            {credits.map((credit) => (
              <div key={credit.label}>
                <dt className="font-medium text-foreground">{credit.label}</dt>
                <dd className="text-muted-foreground">{credit.value}</dd>
              </div>
            ))}
          </dl>
        </aside>

        {/* Image + Content - Right Side */}
        <div className="flex-1 flex flex-col gap-8">
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

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none font-serif text-base leading-relaxed text-foreground">
            {children}
          </div>
        </div>
      </div>
    </article>
  )
}
