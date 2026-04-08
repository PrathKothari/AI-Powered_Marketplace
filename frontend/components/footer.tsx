import { Facebook, Instagram, Twitter, Mail, Paintbrush } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 md:py-20 flex flex-col items-center text-center gap-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center gap-4 max-w-md">
            <div className="flex items-center gap-2">
              <Paintbrush className="w-8 h-8 text-primary" />
              <h3 className="text-3xl font-bold text-primary tracking-tight">KalaSetu</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Connecting talented artisans with customers who appreciate handmade quality.
            </p>
          </div>

          {/* Commented out sections
          <div className="hidden md:flex flex-col gap-4">
            <h4 className="font-semibold text-foreground">Company</h4>
            ...
          </div>
          */}
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border py-12 flex flex-col items-center justify-center text-center gap-6">
          <p className="text-muted-foreground text-sm font-medium">
            © {currentYear} KalaSetu Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-widest font-bold">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-widest font-bold">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-widest font-bold">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
