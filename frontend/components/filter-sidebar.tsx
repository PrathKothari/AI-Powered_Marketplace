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
  categories?: string[];
  onFilterChange?: (filters: FilterState) => void;
}

const RATINGS = ['4★ & above', '3★ & above', '2★ & above', '1★ & above'];

export default function FilterSidebar({ categories = [], onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 2000],
    availability: [],
    rating: 0,
  });

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    availability: true,
    rating: true,
  });

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
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Categories */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full font-semibold text-gray-900 hover:text-blue-600"
          >
            <span>Categories</span>
            {expandedSections.categories ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.categories && (
            <div className="space-y-2 pl-2">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Loading...</p>
              ) : (
                categories.map((category) => (
                  <label key={category} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => handleCategoryChange(category)}
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full font-semibold text-gray-900 hover:text-blue-600"
          >
            <span>Price Range</span>
            {expandedSections.price ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.price && (
            <div className="space-y-3 pl-2">
              <div>
                <label className="text-xs text-gray-600">Min: ₹{filters.priceRange[0]}</label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange(e, 0)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Max: ₹{filters.priceRange[1]}</label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange(e, 1)}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('availability')}
            className="flex items-center justify-between w-full font-semibold text-gray-900 hover:text-blue-600"
          >
            <span>Availability</span>
            {expandedSections.availability ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.availability && (
            <div className="space-y-2 pl-2">
              {['In Stock', 'Out of Stock'].map((status) => (
                <label key={status} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={filters.availability.includes(status)}
                    onCheckedChange={() => handleAvailabilityChange(status)}
                  />
                  <span className="text-sm text-gray-700">{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full font-semibold text-gray-900 hover:text-blue-600"
          >
            <span>Rating</span>
            {expandedSections.rating ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.rating && (
            <div className="space-y-2 pl-2">
              {RATINGS.map((rating, index) => (
                <label key={rating} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={filters.rating === index + 1}
                    onCheckedChange={() => handleRatingChange(index + 1)}
                  />
                  <span className="text-sm text-gray-700">{rating}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
