import Link from "next/link"
import { Instagram, Mail } from "lucide-react"

export function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group">
          </Link>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <Link
              href="https://www.instagram.com/kl4kv/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
              aria-label="Instagram"
            >
              <Instagram className="size-5" />
            </Link>
            <Link
              href="mailto:contact@example.com"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
              aria-label="Email"
            >
              <Mail className="size-5" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
