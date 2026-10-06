import React, { useState, useEffect, useRef } from 'react';
import type { Category, LocationZone, ItemSummary, ItemType, PaginatedResponse } from '../../types';
import { ItemCard } from '../items/ItemCard';
import { HeroWorld } from './HeroWorld';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import {
  Search,
  X,
  Plus,
  ArrowRight,
  MapPin,
  Laptop,
  Briefcase,
  FileText,
  Key,
  Shirt,
  BookOpen,
  Tag,
  Package,
  HelpCircle,
  PackagePlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  LogIn,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface UserStats {
  reportsCount: number;
  claimsCount: number;
  resolvedCount: number;
  pendingCount: number;
}

interface HomeWorkspaceProps {
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
  itemsResponse: PaginatedResponse<ItemSummary> | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectItem: (itemId: string) => void;
  onOpenReport: (type: ItemType) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  isAuthenticated: boolean;
  userStats: UserStats | null;
  onNavigateToTab: (tab: 'my-items' | 'my-claims') => void;
  onOpenCommandPalette?: () => void;
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('elec') || lower.includes('phone') || lower.includes('laptop') || lower.includes('gadget')) {
    return <Laptop className="w-3.5 h-3.5" />;
  }
  if (lower.includes('bag') || lower.includes('backpack') || lower.includes('wallet') || lower.includes('purse')) {
    return <Briefcase className="w-3.5 h-3.5" />;
  }
  if (lower.includes('doc') || lower.includes('id') || lower.includes('card') || lower.includes('passport')) {
    return <FileText className="w-3.5 h-3.5" />;
  }
  if (lower.includes('key')) {
    return <Key className="w-3.5 h-3.5" />;
  }
  if (lower.includes('cloth') || lower.includes('wear') || lower.includes('jacket')) {
    return <Shirt className="w-3.5 h-3.5" />;
  }
  if (lower.includes('book') || lower.includes('stationery') || lower.includes('note')) {
    return <BookOpen className="w-3.5 h-3.5" />;
  }
  return <Tag className="w-3.5 h-3.5" />;
};

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || value === 0) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 450;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue}</span>;
};

export const HomeWorkspace: React.FC<HomeWorkspaceProps> = ({
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
  itemsResponse,
  loading,
  error,
  currentPage,
  onPageChange,
  onSelectItem,
  onOpenReport,
  onOpenAuth,
  isAuthenticated,
  userStats,
  onNavigateToTab,
  onOpenCommandPalette,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const feedSectionRef = useRef<HTMLDivElement>(null);
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  const handleHeroCategoryClick = (categoryName: string) => {
    const matched = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase() ||
             c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
             categoryName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (matched) {
      onCategoryChange(matched.id);
    } else {
      onSearchChange(categoryName);
    }
    // Smoothly scroll to feed
    feedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'ALL' ||
    selectedCategory !== '' ||
    selectedLocation !== '' ||
    sort !== 'createdAt,desc';

  const items = itemsResponse?.content || [];
  const leadItem = items.length > 0 ? items[0] : null;
  const supportingItems = items.length > 1 ? items.slice(1) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. VISUAL PRODUCT HERO EXPERIENCE */}
      <div className="relative rounded-3xl bg-surface border border-surface-border p-6 sm:p-8 lg:p-10 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Column: Copy, Search, and Action Buttons (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-surface-border text-xs font-semibold text-ink">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SRM Institute of Science and Technology · Ramapuram</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight">
                Lost &amp; Found Hub
              </h1>
              <p className="text-sm sm:text-base text-ink-secondary max-w-lg leading-relaxed">
                Find what you're looking for. Return what you discovered on campus with verified ownership verification.
              </p>
            </div>

            {/* Hero Search Surface */}
            <div className="relative">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search items, locations, categories..."
                className="w-full pl-10 pr-24 py-3 bg-surface-secondary/60 hover:bg-surface border border-surface-border focus:bg-surface focus:border-ink rounded-2xl text-sm text-ink placeholder:text-ink-muted focus:outline-none shadow-xs transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {search ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="p-1 rounded text-ink-muted hover:text-ink cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenCommandPalette}
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface border border-surface-border text-[10px] font-mono text-ink-muted hover:text-ink cursor-pointer shadow-xs"
                    title="Open Command Palette"
                  >
                    <span>{isMac ? '⌘K' : 'Ctrl K'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dual Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onOpenReport('LOST')}
                className="group p-4 rounded-2xl bg-lost-bg/60 hover:bg-lost-bg border border-lost-border/80 hover:border-lost transition-all flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-lost-bg border border-lost-border flex items-center justify-center text-lost-text group-hover:scale-105 transition-transform shrink-0">
                    <HelpCircle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-lost-text">
                      I Lost Something
                    </div>
                    <p className="text-[11px] text-ink-secondary">
                      Create a search report →
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-lost-text group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => onOpenReport('FOUND')}
                className="group p-4 rounded-2xl bg-found-bg/60 hover:bg-found-bg border border-found-border/80 hover:border-found transition-all flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-found-bg border border-found-border flex items-center justify-center text-found-text group-hover:scale-105 transition-transform shrink-0">
                    <PackagePlus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-found-text">
                      I Found Something
                    </div>
                    <p className="text-[11px] text-ink-secondary">
                      Help return to owner →
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-found-text group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>
          </div>

          {/* Right Hero Column: Interactive Item World (6 cols) */}
          <div className="lg:col-span-6">
            <HeroWorld
              onSelectCategoryName={handleHeroCategoryClick}
              onOpenReport={onOpenReport}
            />
          </div>
        </div>
      </div>

      {/* 2. PERSONAL ACTIVITY RADAR (Real Live Data) */}
      {isAuthenticated && userStats ? (
        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                My Campus Activity
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('my-items')}
              className="text-xs text-accent hover:underline font-medium cursor-pointer"
            >
              View all reports &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => onNavigateToTab('my-items')}
              className="p-3.5 rounded-xl bg-surface-secondary/50 hover:bg-surface border border-surface-border hover:border-ink/30 transition-all cursor-pointer"
            >
              <div className="text-[11px] text-ink-secondary font-medium">My Reports</div>
              <div className="text-2xl font-extrabold text-ink font-mono mt-0.5">
                <AnimatedNumber value={userStats.reportsCount} />
              </div>
            </div>

            <div
              onClick={() => onNavigateToTab('my-claims')}
              className="p-3.5 rounded-xl bg-surface-secondary/50 hover:bg-surface border border-surface-border hover:border-ink/30 transition-all cursor-pointer"
            >
              <div className="text-[11px] text-ink-secondary font-medium">My Claims</div>
              <div className="text-2xl font-extrabold text-ink font-mono mt-0.5">
                <AnimatedNumber value={userStats.claimsCount} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary/50 border border-surface-border">
              <div className="text-[11px] text-found-text font-medium">Resolved</div>
              <div className="text-2xl font-extrabold text-found font-mono mt-0.5">
                <AnimatedNumber value={userStats.resolvedCount} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary/50 border border-surface-border">
              <div className="text-[11px] text-amber-700 font-medium">Pending Review</div>
              <div className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5">
                <AnimatedNumber value={userStats.pendingCount} />
              </div>
            </div>
          </div>
        </div>
      ) : !isAuthenticated && (
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-surface-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Campus Community Access</p>
              <p className="text-[11px] text-ink-secondary">
                Sign in with your campus email to track reported property and file ownership claims.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-surface hover:bg-black text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      )}

      {/* 3. RECENT ACTIVITY & MAIN FEED SECTION */}
      <div ref={feedSectionRef} className="space-y-6">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-surface-border shadow-xs">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-ink">
              Recent Campus Reports
            </h2>
            {itemsResponse && (
              <span className="text-xs text-ink-muted">
                ({itemsResponse.totalElements} active)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="flex items-center p-0.5 bg-surface-secondary rounded-xl border border-surface-border">
              <button
                type="button"
                onClick={() => onTypeFilterChange('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === 'ALL'
                    ? 'bg-surface text-ink font-bold shadow-xs'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => onTypeFilterChange('LOST')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === 'LOST'
                    ? 'bg-lost-bg text-lost-text border border-lost-border font-bold shadow-xs'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Lost
              </button>
              <button
                type="button"
                onClick={() => onTypeFilterChange('FOUND')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === 'FOUND'
                    ? 'bg-found-bg text-found-text border border-found-border font-bold shadow-xs'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Found
              </button>
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                aria-label="Sort items by"
                className="appearance-none pl-3 pr-7 py-1.5 bg-surface-secondary hover:bg-surface border border-surface-border rounded-xl text-xs text-ink-secondary hover:text-ink focus:outline-none focus:border-ink cursor-pointer transition-colors"
              >
                <option value="createdAt,desc">Newest first</option>
                <option value="createdAt,asc">Oldest first</option>
                <option value="occurredAt,desc">Recently occurred</option>
                <option value="title,asc">Title (A–Z)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-ink-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer border border-surface-border"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {(selectedCategory || selectedLocation) && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-surface border border-surface-border text-xs">
            <span className="text-[11px] text-ink-muted font-medium ml-1">Applied:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-ink text-surface text-[11px] font-medium">
                {categories.find((c) => c.id === selectedCategory)?.name || 'Category'}
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-80"
                  onClick={() => onCategoryChange('')}
                />
              </span>
            )}
            {selectedLocation && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-ink text-surface text-[11px] font-medium">
                <MapPin className="w-3 h-3" />
                {locationZones.find((l) => l.id === selectedLocation)?.name || 'Location'}
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-80"
                  onClick={() => onLocationChange('')}
                />
              </span>
            )}
          </div>
        )}

        {/* Feed Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-surface border border-surface-border text-center space-y-3">
            <p className="text-sm text-lost-text font-medium">{error}</p>
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-surface-border text-xs font-medium text-ink cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-6">
            {/* Lead / Showcase Item */}
            {leadItem && (
              <div
                onClick={() => onSelectItem(leadItem.id)}
                className="group relative rounded-3xl bg-surface border border-surface-border overflow-hidden hover:border-ink/40 shadow-xs hover:shadow-card-hover transition-all duration-200 cursor-pointer"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                  <div className="md:col-span-5 relative aspect-4/3 md:aspect-auto bg-surface-secondary overflow-hidden border-b md:border-b-0 md:border-r border-surface-border">
                    {leadItem.primaryImageUrl ? (
                      <img
                        src={leadItem.primaryImageUrl}
                        alt={leadItem.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center text-ink-muted p-4">
                        <Package className="w-8 h-8 stroke-1 opacity-50 mb-1" />
                        <span className="text-xs">No photo attached</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          leadItem.type === 'LOST'
                            ? 'bg-lost-bg text-lost-text border border-lost-border'
                            : 'bg-found-bg text-found-text border border-found-border'
                        }`}
                      >
                        {leadItem.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-ink text-surface">
                        Featured Report
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
                        <span className="font-semibold text-ink-secondary">{leadItem.category?.name}</span>
                        <span>{new Date(leadItem.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-ink group-hover:text-accent transition-colors leading-snug line-clamp-1">
                        {leadItem.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-ink-secondary mt-2 line-clamp-2 leading-relaxed">
                        {leadItem.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-surface-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-ink-secondary truncate">
                        <MapPin className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                        <span className="font-medium">{leadItem.location?.name}</span>
                        {leadItem.locationDetail && (
                          <span className="text-ink-muted truncate">· {leadItem.locationDetail}</span>
                        )}
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-ink group-hover:text-accent transition-colors shrink-0">
                        <span>View item details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Supporting Item Grid */}
            {supportingItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {supportingItems.map((item) => (
                  <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
                ))}
              </div>
            )}

            {/* Pagination Bar */}
            {itemsResponse && itemsResponse.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-surface-border text-xs text-ink-secondary">
                <div>
                  Page <span className="font-semibold text-ink">{currentPage + 1}</span> of{' '}
                  <span className="font-semibold text-ink">{itemsResponse.totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                    disabled={itemsResponse.first}
                    className="px-3 py-1.5 rounded-xl border border-surface-border bg-surface hover:bg-surface-secondary disabled:opacity-40 font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => onPageChange(Math.min(itemsResponse.totalPages - 1, currentPage + 1))}
                    disabled={itemsResponse.last}
                    className="px-3 py-1.5 rounded-xl border border-surface-border bg-surface hover:bg-surface-secondary disabled:opacity-40 font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* DESIGNED ZERO-STATE (Never an empty blank void) */
          <div className="p-8 sm:p-10 rounded-3xl bg-surface border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-ink tracking-tight">
                  {hasActiveFilters ? 'No reports match your filters' : 'No items reported right now'}
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary max-w-md">
                  {hasActiveFilters
                    ? 'Try clearing your search keyword, adjusting location filters, or resetting categories.'
                    : 'The campus registry is currently clear. When someone reports an item, it will appear here.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-surface-border text-xs font-semibold text-ink transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenReport('LOST')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-surface text-xs font-semibold hover:bg-black transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Report an Item</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3 Guided Action Modules */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div
                onClick={() => onOpenReport('LOST')}
                className="p-4 rounded-2xl bg-surface-secondary/40 border border-surface-border hover:border-lost-border hover:bg-lost-bg/20 transition-all cursor-pointer group space-y-2"
              >
                <div className="w-8 h-8 rounded-xl bg-lost-bg border border-lost-border flex items-center justify-center text-lost-text group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink group-hover:text-lost-text transition-colors">
                    Report Lost Item
                  </h4>
                  <p className="text-[11px] text-ink-secondary mt-0.5 leading-relaxed">
                    Misplaced a bag, calculator, or keys? Submit a report so finders can reach you.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onOpenReport('FOUND')}
                className="p-4 rounded-2xl bg-surface-secondary/40 border border-surface-border hover:border-found-border hover:bg-found-bg/20 transition-all cursor-pointer group space-y-2"
              >
                <div className="w-8 h-8 rounded-xl bg-found-bg border border-found-border flex items-center justify-center text-found-text group-hover:scale-105 transition-transform">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink group-hover:text-found-text transition-colors">
                    Report Found Item
                  </h4>
                  <p className="text-[11px] text-ink-secondary mt-0.5 leading-relaxed">
                    Found property on campus? Securely register it with a confidential verification challenge.
                  </p>
                </div>
              </div>

              <div
                onClick={onOpenCommandPalette}
                className="p-4 rounded-2xl bg-surface-secondary/40 border border-surface-border hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group space-y-2"
              >
                <div className="w-8 h-8 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-ink group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                    Command Palette
                  </h4>
                  <p className="text-[11px] text-ink-secondary mt-0.5 leading-relaxed">
                    Press <kbd className="px-1.5 py-0.5 bg-surface rounded border text-[10px] font-mono">{isMac ? '⌘K' : 'Ctrl+K'}</kbd> anytime to search or navigate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. EXPLORATION DIRECTORY (Categories & Campus Locations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-surface-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Browse by Category
                </h3>
                <p className="text-xs text-ink-secondary">
                  Filter campus items by item type
                </p>
              </div>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => onCategoryChange('')}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryChange(isSelected ? '' : cat.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-surface font-semibold border-ink shadow-xs'
                        : 'bg-surface-secondary/50 hover:bg-surface border-surface-border text-ink'
                    }`}
                  >
                    <div className={isSelected ? 'text-surface' : 'text-ink-secondary'}>
                      {getCategoryIcon(cat.name)}
                    </div>
                    <span className="text-xs truncate font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Campus Location Zones */}
        {locationZones.length > 0 && (
          <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-surface-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Campus Location Zones
                </h3>
                <p className="text-xs text-ink-secondary">
                  Locate items by campus area
                </p>
              </div>
              {selectedLocation && (
                <button
                  type="button"
                  onClick={() => onLocationChange('')}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {locationZones.map((zone) => {
                const isSelected = selectedLocation === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => onLocationChange(isSelected ? '' : zone.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-surface shadow-xs'
                        : 'bg-surface-secondary/60 hover:bg-surface border border-surface-border text-ink-secondary hover:text-ink'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                    <span>{zone.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
