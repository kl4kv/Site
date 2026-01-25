import Link from "next/link"
import { Instagram, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-background text-foreground">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8">
            {/* Left Column - Branding */}
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl md:text-4xl font-light tracking-wide">
                  Владимир
                </h2>
                <p className="text-sm uppercase tracking-[0.3em] text-foreground/60 mt-2">
                  Photographer
                </p>
              </div>
              <p className="text-foreground/70 max-w-sm leading-relaxed">
                Capturing authentic moments and timeless stories through the lens. 
                Available for portraits, events, and commercial projects.
              </p>
            </div>

            {/* Right Column - Contact */}
            <div className="md:text-right space-y-6">
              <h3 className="text-sm uppercase tracking-[0.2em] text-foreground/60">
                Get in Touch
              </h3>
              
              <div className="space-y-4">
                <Link
                  href="mailto:contact@example.com"
                  className="flex items-center gap-3 md:justify-end text-foreground/80 hover:text-foreground transition-colors duration-300 group"
                >
                  <Mail className="size-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>contact@example.com</span>
                </Link>
                
                <Link
                  href="https://www.instagram.com/kl4kv/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 md:justify-end text-foreground/80 hover:text-foreground transition-colors duration-300 group"
                >
                  <Instagram className="size-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>@kl4kv</span>
                </Link>
                
                <div className="flex items-center gap-3 md:justify-end text-foreground/60">
                  <MapPin className="size-4" />
                  <span>Moscow, Russia</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-foreground/10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-foreground/50">
            <p>&copy; {new Date().getFullYear()} Владимир. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link 
                href="#" 
                className="hover:text-foreground transition-colors duration-300"
              >
                Privacy Policy
              </Link>
              <Link 
                href="#" 
                className="hover:text-foreground transition-colors duration-300"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
