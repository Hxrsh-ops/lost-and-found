import React, { useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import type { Category, LocationZone, ItemType } from '../../types';

interface ItemFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: ItemType | 'ALL';
  onTypeFilterChange: (type: ItemType | 'ALL') => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  selectedLocation: string;
  onLocationChange: (locationId: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  categories: Category[];
  locationZones: LocationZone[];
  onResetFilters: () => void;
  totalCount?: number;
}

export const ItemFilterBar: React.FC<ItemFilterBarProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  selectedCategory,
  onCategoryChange,
  selectedLocation,
  onLocationChange,
  sort,
  onSortChange,
  categories,
  locationZones,
  onResetFilters,
  totalCount,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'ALL' ||
    selectedCategory !== '' ||
    selectedLocation !== '' ||
    sort !== 'createdAt,desc';

  return (
    <div className="space-y-3">
      {/* Primary Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, categories, locations..."
            className="w-full pl-9 pr-14 py-2 bg-surface border border-surface-border rounded-md text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-0.5 rounded text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-secondary border border-surface-border text-[10px] font-mono text-ink-muted">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            )}
          </div>
        </div>

        {/* Type Segmented Control */}
        <div className="flex items-center p-0.5 bg-surface-secondary rounded-md border border-surface-border shrink-0 self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onTypeFilterChange('ALL')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === 'ALL'
                ? 'bg-surface text-ink shadow-subtle font-semibold'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('LOST')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === 'LOST'
                ? 'bg-lost-bg text-lost-text border border-lost-border font-semibold shadow-subtle'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            Lost
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('FOUND')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === 'FOUND'
                ? 'bg-found-bg text-found-text border border-found-border font-semibold shadow-subtle'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            Found
          </button>
        </div>
      </div>

      {/* Filter Row: Category, Location, Sort */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter by Category"
              className="appearance-none pl-2.5 pr-7 py-1.5 bg-surface border border-surface-border rounded-md text-xs text-ink-secondary hover:text-ink focus:outline-none focus:border-accent cursor-pointer transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Location Dropdown */}
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              aria-label="Filter by Location"
              className="appearance-none pl-2.5 pr-7 py-1.5 bg-surface border border-surface-border rounded-md text-xs text-ink-secondary hover:text-ink focus:outline-none focus:border-accent cursor-pointer transition-colors"
            >
              <option value="">All Locations</option>
              {locationZones.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort items by"
              className="appearance-none pl-2.5 pr-7 py-1.5 bg-surface border border-surface-border rounded-md text-xs text-ink-secondary hover:text-ink focus:outline-none focus:border-accent cursor-pointer transition-colors"
            >
              <option value="createdAt,desc">Newest first</option>
              <option value="createdAt,asc">Oldest first</option>
              <option value="occurredAt,desc">Recently occurred</option>
              <option value="title,asc">Title (A–Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {totalCount !== undefined && (
          <div className="text-xs text-ink-muted">
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>
    </div>
  );
};
