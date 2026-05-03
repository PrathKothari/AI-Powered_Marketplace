'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  availability: string[];
  rating: number;
}

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterState) => void;
}

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports',
  'Books',
  'Beauty',
];

const RATINGS = ['4★ & above', '3★ & above', '2★ & above', '1★ & above'];

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 1000],
    availability: [],
    rating: 0,
  });

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    availability: true,
    rating: true,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (category: string) => {
    const updated = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    const newFilters = { ...filters, categories: updated };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleAvailabilityChange = (availability: string) => {
    const updated = filters.availability.includes(availability)
      ? filters.availability.filter((a) => a !== availability)
      : [...filters.availability, availability];
    const newFilters = { ...filters, availability: updated };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleRatingChange = (rating: number) => {
    const newFilters = { ...filters, rating: filters.rating === rating ? 0 : rating };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const value = Number(e.target.value);
    const newRange: [number, number] = [...filters.priceRange] as [number, number];
    newRange[index] = value;
    const newFilters = { ...filters, priceRange: newRange };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="block lg:hidden mb-4">
        <button
          className="w-full px-4 py-2 rounded-lg bg-accent text-accent-foreground font-semibold shadow focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      <aside className={`space-y-6 ${mobileOpen ? 'block' : 'hidden'} lg:block w-full lg:w-auto`}>
        {/* Categories */}
        <section>
          <button
            className="flex items-center justify-between w-full font-semibold text-left text-base sm:text-lg mb-2"
            onClick={() => toggleSection('categories')}
          >
            Categories
            {expandedSections.categories ? <ChevronUp /> : <ChevronDown />}
          </button>
          {expandedSections.categories && (
            <div className="space-y-2 pl-2">
              {CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={filters.categories.includes(cat)}
                    onCheckedChange={() => handleCategoryChange(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Price Range */}
        <section>
          <button
            className="flex items-center justify-between w-full font-semibold text-left text-base sm:text-lg mb-2"
            onClick={() => toggleSection('price')}
          >
            Price Range
            {expandedSections.price ? <ChevronUp /> : <ChevronDown />}
          </button>
          {expandedSections.price && (
            <div className="space-y-3 pl-2">
              <div>
                <label className="text-xs text-muted-foreground">Min: ${filters.priceRange[0]}</label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange(e, 0)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max: ${filters.priceRange[1]}</label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange(e, 1)}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </section>

        {/* Availability */}
        <section>
          <button
            className="flex items-center justify-between w-full font-semibold text-left text-base sm:text-lg mb-2"
            onClick={() => toggleSection('availability')}
          >
            Availability
            {expandedSections.availability ? <ChevronUp /> : <ChevronDown />}
          </button>
          {expandedSections.availability && (
            <div className="space-y-2 pl-2">
              {['In Stock', 'Out of Stock'].map((status) => (
                <label key={status} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={filters.availability.includes(status)}
                    onCheckedChange={() => handleAvailabilityChange(status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Rating */}
        <section>
          <button
            className="flex items-center justify-between w-full font-semibold text-left text-base sm:text-lg mb-2"
            onClick={() => toggleSection('rating')}
          >
            Rating
            {expandedSections.rating ? <ChevronUp /> : <ChevronDown />}
          </button>
          {expandedSections.rating && (
            <div className="space-y-2 pl-2">
              {RATINGS.map((rating, index) => (
                <label key={rating} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={filters.rating === index + 1}
                    onCheckedChange={() => handleRatingChange(index + 1)}
                  />
                  {rating}
                </label>
              ))}
            </div>
          )}
        </section>
      </aside>
    </>
  );
}
