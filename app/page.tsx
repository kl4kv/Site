import { PhotoGrid } from "./components/photo-grid"
import { Footer } from "./components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <PhotoGrid />
      </main>
      <Footer />
    </div>
  )
}
