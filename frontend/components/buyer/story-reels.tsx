'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stories = [
  {
    id: 1,
    artisan: 'Maria Santos',
    craft: 'Hand-Woven Textiles',
    location: 'Peru',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
    preview: 'Maria learned weaving from her grandmother and now creates stunning textiles using traditional Andean techniques...',
  },
  {
    id: 2,
    artisan: 'Kenji Nakamura',
    craft: 'Ceramic Pottery',
    location: 'Japan',
    image: 'https://images.unsplash.com/photo-1565193566173-7cde32f50b94?w=400&h=500&fit=crop',
    preview: 'Each ceramic piece is hand-thrown on the wheel with clay sourced from local mountains, honoring a 40-year craft...',
  },
  {
    id: 3,
    artisan: 'Amara Okafor',
    craft: 'Natural Leather Goods',
    location: 'Nigeria',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop',
    preview: 'Amara creates beautiful leather bags and accessories using vegetable-tanned leather and traditional African patterns...',
  },
  {
    id: 4,
    artisan: 'Sofia Rossi',
    craft: 'Artisanal Glass',
    location: 'Italy',
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=500&fit=crop',
    preview: 'Sofia blows glass into stunning vases and sculptures, inspired by the Venetian glassmaking traditions of her homeland...',
  },
  {
    id: 5,
    artisan: 'Hassan Al-Rashid',
    craft: 'Handcrafted Jewelry',
    location: 'Morocco',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
    preview: 'Hassan combines traditional metalworking with semi-precious stones to create pieces that tell Moroccan stories...',
  },
];

export default function StoryReels() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-20 sm:py-32 bg-surface px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">
            Artisan Spotlight
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mt-3 text-balance">
            Featured Stories From Around the World
          </h2>
          <p className="text-lg text-foreground-secondary mt-4 max-w-2xl">
            Meet the talented creators behind each handmade piece and discover their unique craft journeys.
          </p>
        </div>

        <div className="relative">
          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollBehavior: 'smooth' }}
          >
            {stories.map((story) => (
              <div
                key={story.id}
                className="flex-shrink-0 w-96 snap-start group cursor-pointer"
              >
                <div className="bg-surface-secondary rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                  {/* Image Container */}
                  <div className="relative h-64 overflow-hidden bg-surface-tertiary">
                    <img
                      src={story.image || "/placeholder.svg"}
                      alt={story.artisan}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <Play
                        className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 fill-white"
                        strokeWidth={1}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-serif font-bold text-foreground mb-1">
                      {story.artisan}
                    </h3>
                    <p className="text-sm font-medium text-primary mb-3">{story.craft}</p>
                    <p className="text-xs text-foreground-tertiary mb-4 uppercase tracking-wider">
                      {story.location}
                    </p>

                    <p className="text-foreground-secondary text-sm leading-relaxed flex-grow">
                      {story.preview}
                    </p>

                    <button className="mt-4 text-primary font-medium text-sm hover:text-primary-dark transition-colors">
                      Read Full Story →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-6 top-1/3 -translate-y-1/2 z-10 p-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-6 top-1/3 -translate-y-1/2 z-10 p-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-16 text-center">
          <Button
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl text-base font-medium transition-colors"
          >
            View All Artisans
          </Button>
        </div>
      </div>
    </section>
  );
}
