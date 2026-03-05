'use client';

import { useState } from 'react';
import { Upload, Search, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DiscoverySection() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = () => setIsDragging(true);
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = () => setIsDragging(false);

  return (
    <section className="py-20 sm:py-32 bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">
            Smart Discovery
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mt-3 text-balance">
            Find Crafts You Love
          </h2>
        </div>

        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-surface rounded-3xl border-2 border-dashed p-12 sm:p-16 text-center transition-all duration-300 ${
            isDragging
              ? 'border-primary bg-primary/5 scale-102'
              : 'border-border hover:border-primary/50 hover:bg-surface-secondary'
          }`}
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-4">
            Seen a craft you liked?
          </h3>

          <p className="text-lg text-foreground-secondary mb-8 max-w-xl mx-auto">
            Upload a photo of any handmade craft and our AI-powered search will find similar pieces from our artisan community. Discover new creators and unique variations.
          </p>

          <div className="mb-6">
            <button
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-colors ${
                isDragging
                  ? 'bg-primary text-white'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              <Upload className="w-5 h-5" />
              Choose Image or Drag Here
            </button>
          </div>

          <p className="text-sm text-foreground-tertiary">
            Supported formats: JPG, PNG, WebP (Max 10MB)
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h4 className="font-serif font-bold text-foreground">AI-Powered Matching</h4>
            </div>
            <p className="text-sm text-foreground-secondary">
              Our intelligent algorithm recognizes style, color, and technique to find similar crafts.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-6 h-6 text-primary" />
              <h4 className="font-serif font-bold text-foreground">Explore Variations</h4>
            </div>
            <p className="text-sm text-foreground-secondary">
              See all the different interpretations and styles of the craft you're interested in.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-primary" />
              <h4 className="font-serif font-bold text-foreground">Save Favorites</h4>
            </div>
            <p className="text-sm text-foreground-secondary">
              Build your inspiration collection and get notified when similar items are listed.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-foreground-secondary mb-6">
            Start discovering handmade crafts that match your unique taste and style.
          </p>
          <Button
            className="bg-accent hover:bg-accent-light text-foreground px-8 py-3 rounded-xl text-base font-medium transition-colors"
          >
            Begin Discovery Journey
          </Button>
        </div>
      </div>
    </section>
  );
}
