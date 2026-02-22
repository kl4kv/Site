import { Header } from "./components/header"
import { PhotoGrid } from "./components/photo-grid"
import { Footer } from "./components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PhotoGrid />
      </main>
      <Footer />
    </div>
  )
}
