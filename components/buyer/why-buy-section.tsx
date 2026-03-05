import { Zap, Heart, Shield } from 'lucide-react';

const reasons = [
  {
    icon: Heart,
    title: 'Authentic Handmade Crafts',
    description:
      'Every item is handcrafted with care. No mass production, no shortcuts. Just real artisans creating real art with passion and skill.',
  },
  {
    icon: Zap,
    title: 'Directly Support Artisans',
    description:
      'Your purchase goes directly to the makers. Fair prices, ethical practices, and meaningful impact on artisans and their communities.',
  },
  {
    icon: Shield,
    title: 'Verified Origin & Story',
    description:
      'Every craft comes with verified provenance. Know exactly who made it, where it comes from, and the story behind your purchase.',
  },
];

export default function WhyBuySection() {
  return (
    <section className="py-20 sm:py-32 bg-surface-secondary px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">
            Why Choose Us
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mt-3 text-balance">
            The Artisan Difference
          </h2>
          <p className="text-lg text-foreground-secondary mt-4 max-w-2xl mx-auto">
            Shopping for handmade crafts means investing in authenticity, supporting real people, and owning pieces with genuine stories.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div
                key={index}
                className="bg-surface rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                <h3 className="text-2xl font-serif font-bold text-foreground mb-4">
                  {reason.title}
                </h3>

                <p className="text-foreground-secondary leading-relaxed flex-grow">
                  {reason.description}
                </p>

                <div className="mt-6 pt-6 border-t border-border">
                  <button className="text-primary font-medium text-sm hover:text-primary-dark transition-colors">
                    Learn More →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-primary mb-2">100%</div>
            <p className="text-sm text-foreground-secondary">Handmade</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary mb-2">98%</div>
            <p className="text-sm text-foreground-secondary">Customer Satisfaction</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary mb-2">7 Days</div>
            <p className="text-sm text-foreground-secondary">Money Back Guarantee</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary mb-2">24/7</div>
            <p className="text-sm text-foreground-secondary">Artisan Support</p>
          </div>
        </div>
      </div>
    </section>
  );
}
