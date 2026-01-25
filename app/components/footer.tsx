import Link from "next/link"
import { Instagram, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-background text-foreground">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16 md:py-24">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Branding */}
            <div className="space-y-4">
              <div>
                <h2 className="text-4xl md:text-4xl font-light tracking-wide opacity-50">
                  Владимир
                </h2>
                <p className="text-sm uppercase tracking-[0.3em] opacity-50 mt-2">
                  Photographer
                </p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-[0.2em] opacity-50">
                Get in Touch
              </h3>
              
              <div className="flex items-center justify-center gap-6">
                <Link
                  href="mailto:contact@example.com"
                  className="opacity-50 hover:opacity-100 transition-opacity duration-300"
                  aria-label="Email"
                >
                  <Mail className="size-5" />
                </Link>
                
                <Link
                  href="https://www.instagram.com/kl4kv/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-50 hover:opacity-100 transition-opacity duration-300"
                  aria-label="Instagram"
                >
                  <Instagram className="size-5" />
                </Link>
                
                <div className="opacity-50">
                  <MapPin className="size-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-foreground/10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm opacity-50">
            <p>&copy; {new Date().getFullYear()} Владимир. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link 
                href="#" 
                className="hover:opacity-100 transition-opacity duration-300"
              >
                Privacy Policy
              </Link>
              <Link 
                href="#" 
                className="hover:opacity-100 transition-opacity duration-300"
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
