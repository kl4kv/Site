import { Header } from "./components/header"
import { BlogEntry } from "./components/blog-entry"
import { Footer } from "./components/footer"
import { getPublishedPosts, getImageUrl } from "@/lib/posts"

export default async function Home() {
  const posts = await getPublishedPosts()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 py-32 sm:px-6 md:py-36 lg:ml-[22%] lg:mr-[8%] lg:px-0">
        {/* Bio section */}
        <section className="mb-20">
          <div className="mt-8 max-w-lg font-serif text-base leading-relaxed text-foreground">
            <p>
              Добро пожаловать в мой личный блог. Здесь я делюсь мыслями,
              наблюдениями и проектами, которые занимают мое внимание. Пишу о
              технологиях, путешествиях и повседневных открытиях.
            </p>
            <p className="mt-4">
              Каждый пост — это попытка зафиксировать момент, идею или опыт,
              который показался мне достойным внимания. Надеюсь, вам будет
              интересно.
            </p>
          </div>
        </section>

        {/* Blog entries */}
        <section className="flex flex-col gap-24 pb-32">
          {posts.map((post) => (
            <BlogEntry
              key={post.id}
              title={post.title}
              credits={post.credits}
              image={{
                src: getImageUrl(post.cover_image) || "/images/placeholder.jpg",
                alt: post.title,
              }}
            >
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-4' : ''}>
                  {paragraph}
                </p>
              ))}
            </BlogEntry>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  )
}
