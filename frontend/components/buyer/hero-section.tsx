import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-background to-muted px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center py-20 sm:py-32">
        <div className="mb-8 inline-block">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">
            KalaSetu
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-6 text-balance leading-tight">
          Discover the Stories Behind Every Craft
        </h1>

        <p className="text-lg sm:text-xl text-foreground-secondary max-w-2xl mx-auto mb-12 leading-relaxed text-pretty">
          Every piece tells a story. Buy directly from artisans around the world and become part of their creative journey. Authentic handmade crafts with verified origins and real human connections.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl text-base font-medium transition-colors"
          >
            Watch Artisan Stories
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-xl text-base font-medium transition-colors bg-transparent"
          >
            Explore Marketplace
          </Button>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">2.5K+</div>
            <p className="text-sm text-foreground-tertiary">Artisans</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">10K+</div>
            <p className="text-sm text-foreground-tertiary">Unique Pieces</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <p className="text-sm text-foreground-tertiary">Countries</p>
          </div>
        </div>
      </div>
    </section>
  );
}
