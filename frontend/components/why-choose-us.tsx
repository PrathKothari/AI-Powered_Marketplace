import { Card } from '@/components/ui/card'
import { Users, Sparkles, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Support Small Businesses',
    description: 'Every purchase directly supports independent artisans and creative makers around the world.',
  },
  {
    icon: Sparkles,
    title: 'Unique Handmade Products',
    description: 'Discover one-of-a-kind items you won\'t find anywhere else. Each product is crafted with care.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Shop with confidence. All transactions are protected with industry-leading security.',
  },
  {
    icon: Zap,
    title: 'Fast & Reliable Delivery',
    description: 'Quality packaging and fast shipping ensure your handmade treasures arrive safely.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Us</h2>
          <p className="text-muted-foreground text-lg">
            What makes our marketplace special
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card
                key={index}
                className="p-8 bg-card border-border hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

