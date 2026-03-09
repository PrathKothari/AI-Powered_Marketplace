'use client';

import HeroSection from '@/components/buyer/hero-section';
import StoryReels from '@/components/buyer/story-reels';
import WhyBuySection from '@/components/buyer/why-buy-section';
import DiscoverySection from '@/components/buyer/discovery-section';

import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export default function BuyerHomePage() {
  const role = useSelector(
    (state: RootState) => state.auth.role
  );

  // Optional guard
  if (role !== 'buyer') return null;

  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <StoryReels />
      <WhyBuySection />
      <DiscoverySection />
    </main>
  );
}
