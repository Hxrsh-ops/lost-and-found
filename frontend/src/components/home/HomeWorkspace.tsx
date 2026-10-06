import React, { useState, useEffect, useRef } from 'react';
import type { Category, LocationZone, ItemSummary, ItemType, PaginatedResponse } from '../../types';
import { ItemCard } from '../items/ItemCard';
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
  Compass,
  Sparkles,
  Layers,
  ArrowUpRight,
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
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

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
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header & Unified Search Console */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-surface-border shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                Lost &amp; Found Hub
              </h1>
              <span className="text-[11px] font-medium text-ink-secondary bg-surface-secondary px-2 py-0.5 rounded-full border border-surface-border">
                SRM Ramapuram
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              Campus directory for reporting lost belongings, returning found items, and verified ownership claims.
            </p>
          </div>

          {/* Quick Action Pills on Desktop Header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenReport('LOST')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lost-bg border border-lost-border text-lost-text text-xs font-semibold hover:bg-lost-border/40 transition-colors cursor-pointer shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Report Lost</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenReport('FOUND')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-found-bg border border-found-border text-found-text text-xs font-semibold hover:bg-found-border/40 transition-colors cursor-pointer shadow-xs"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Report Found</span>
            </button>
          </div>
        </div>

        {/* Deep Search & Segment Console */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by keyword, item name, or description..."
              className="w-full pl-9.5 pr-20 py-2.5 bg-surface-secondary/50 hover:bg-surface border border-surface-border focus:bg-surface focus:border-ink rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none transition-colors"
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
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-surface-border text-[10px] font-mono text-ink-muted hover:text-ink cursor-pointer"
                  title="Open Command Palette"
                >
                  <span>{isMac ? '⌘K' : 'Ctrl K'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Type Segment Control */}
          <div className="flex items-center p-1 bg-surface-secondary/80 rounded-xl border border-surface-border shrink-0">
            <button
              type="button"
              onClick={() => onTypeFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-surface text-ink font-semibold shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => onTypeFilterChange('LOST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'LOST'
                  ? 'bg-lost-bg text-lost-text border border-lost-border font-semibold shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Lost
            </button>
            <button
              type="button"
              onClick={() => onTypeFilterChange('FOUND')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'FOUND'
                  ? 'bg-found-bg text-found-text border border-found-border font-semibold shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Found
            </button>
          </div>

          {/* Sort Selector */}
          <div className="relative shrink-0">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort items by"
              className="w-full sm:w-auto appearance-none pl-3 pr-7 py-2 bg-surface-secondary/80 hover:bg-surface border border-surface-border rounded-xl text-xs text-ink-secondary hover:text-ink focus:outline-none focus:border-ink cursor-pointer transition-colors"
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
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary border border-surface-border transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Asymmetric Workspace Layout (Main Feed + Right Utility Rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Editorial Feed / Rich Zero-State (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Filter Tags Row */}
          {(selectedCategory || selectedLocation) && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-surface border border-surface-border text-xs">
              <span className="text-[11px] text-ink-muted font-medium ml-1">Filtered by:</span>
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
              <button
                type="button"
                onClick={onResetFilters}
                className="text-[11px] text-accent hover:underline ml-auto mr-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Feed Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {/* Lead / Showcase Item (First item given prominent editorial presentation) */}
              {leadItem && (
                <div
                  onClick={() => onSelectItem(leadItem.id)}
                  className="group relative rounded-2xl bg-surface border border-surface-border overflow-hidden hover:border-ink/40 shadow-xs hover:shadow-card-hover transition-all duration-200 cursor-pointer"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                    <div className="md:col-span-5 relative aspect-4/3 md:aspect-auto bg-surface-secondary overflow-hidden border-b md:border-b-0 md:border-r border-surface-border">
                      {leadItem.primaryImageUrl ? (
                        <img
                          src={leadItem.primaryImageUrl}
                          alt={leadItem.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center text-ink-muted p-4">
                          <Package className="w-8 h-8 stroke-1 opacity-50 mb-1" />
                          <span className="text-xs">No photo</span>
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
                          Featured
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
                          <span className="font-medium text-ink-secondary">{leadItem.category?.name}</span>
                          <span>{new Date(leadItem.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-ink group-hover:text-accent transition-colors leading-snug line-clamp-1">
                          {leadItem.title}
                        </h3>
                        <p className="text-xs text-ink-secondary mt-1.5 line-clamp-2 leading-relaxed">
                          {leadItem.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-ink-secondary truncate">
                          <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                          <span className="font-medium">{leadItem.location?.name}</span>
                          {leadItem.locationDetail && (
                            <span className="text-ink-muted truncate">· {leadItem.locationDetail}</span>
                          )}
                        </div>
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-ink group-hover:text-accent transition-colors shrink-0">
                          <span>View item</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Supporting Item Grid */}
              {supportingItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                      More Active Reports ({supportingItems.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {supportingItems.map((item) => (
                      <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination Bar */}
              {itemsResponse && itemsResponse.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-surface-border text-xs text-ink-secondary">
                  <div>
                    Page <span className="font-semibold text-ink">{currentPage + 1}</span> of{' '}
                    <span className="font-semibold text-ink">{itemsResponse.totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                      disabled={itemsResponse.first}
                      className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-secondary disabled:opacity-40 font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={() => onPageChange(Math.min(itemsResponse.totalPages - 1, currentPage + 1))}
                      disabled={itemsResponse.last}
                      className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-secondary disabled:opacity-40 font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* RICH ARCHITECTURAL ZERO-STATE (Never an empty blank void) */
            <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-border">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-secondary text-[11px] font-semibold text-ink">
                    <Compass className="w-3 h-3" />
                    <span>Campus Registry Status</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                    {hasActiveFilters ? 'No items match your active filters' : 'Campus Property Registry is Clear'}
                  </h3>
                  <p className="text-xs text-ink-secondary max-w-md">
                    {hasActiveFilters
                      ? 'Try adjusting your search terms, selecting another location zone, or clearing applied filters.'
                      : 'No lost or found property is currently awaiting recovery. When someone reports an item on campus, it will appear here.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="px-3.5 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-surface-border text-xs font-semibold text-ink transition-colors cursor-pointer"
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

              {/* 3 Interactive Campus Guidance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => onOpenReport('LOST')}
                  className="p-4 rounded-xl bg-surface-secondary/40 border border-surface-border hover:border-lost-border hover:bg-lost-bg/20 transition-all cursor-pointer group space-y-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-lost-bg border border-lost-border flex items-center justify-center text-lost-text group-hover:scale-105 transition-transform">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink group-hover:text-lost-text transition-colors">
                      Report Lost Item
                    </h4>
                    <p className="text-[11px] text-ink-secondary mt-0.5 leading-relaxed">
                      Register details of misplaced items to notify campus reviewers.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => onOpenReport('FOUND')}
                  className="p-4 rounded-xl bg-surface-secondary/40 border border-surface-border hover:border-found-border hover:bg-found-bg/20 transition-all cursor-pointer group space-y-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-found-bg border border-found-border flex items-center justify-center text-found-text group-hover:scale-105 transition-transform">
                    <PackagePlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink group-hover:text-found-text transition-colors">
                      Report Found Item
                    </h4>
                    <p className="text-[11px] text-ink-secondary mt-0.5 leading-relaxed">
                      Found property on campus? Securely register it with confidential verification.
                    </p>
                  </div>
                </div>

                <div
                  onClick={onOpenCommandPalette}
                  className="p-4 rounded-xl bg-surface-secondary/40 border border-surface-border hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group space-y-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-ink group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                      Quick Command Directory
                    </h4>
                    <p className="text-[11px] text-ink-secondary mt-0.5 leading-relaxed">
                      Press <kbd className="px-1 py-0.2 bg-surface rounded border text-[10px] font-mono">{isMac ? '⌘K' : 'Ctrl+K'}</kbd> anytime to jump to any category, location, or report.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Utility Studio & Campus Directory (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Action Studio Cards */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onOpenReport('LOST')}
              className="w-full group p-4 rounded-2xl bg-surface hover:bg-surface-secondary/50 border border-surface-border hover:border-lost-border transition-all flex items-center justify-between shadow-xs cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-lost-bg border border-lost-border flex items-center justify-center text-lost-text shrink-0 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-ink group-hover:text-lost-text transition-colors">
                    Report Lost Belonging
                  </div>
                  <p className="text-[11px] text-ink-secondary">
                    Provide descriptions &amp; photos
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-lost-text group-hover:translate-x-1 transition-all shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onOpenReport('FOUND')}
              className="w-full group p-4 rounded-2xl bg-surface hover:bg-surface-secondary/50 border border-surface-border hover:border-found-border transition-all flex items-center justify-between shadow-xs cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-found-bg border border-found-border flex items-center justify-center text-found-text shrink-0 group-hover:scale-105 transition-transform">
                  <PackagePlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-ink group-hover:text-found-text transition-colors">
                    Report Found Property
                  </div>
                  <p className="text-[11px] text-ink-secondary">
                    Set secret verification proof
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-found-text group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          </div>

          {/* Personal Activity Radar */}
          {isAuthenticated && userStats ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-surface-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-ink-secondary" />
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    My Activity
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('my-items')}
                  className="text-[11px] text-accent hover:underline font-medium cursor-pointer"
                >
                  View all →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => onNavigateToTab('my-items')}
                  className="p-3 rounded-xl bg-surface-secondary/60 hover:bg-surface border border-surface-border hover:border-ink/20 transition-all cursor-pointer"
                >
                  <div className="text-[10px] text-ink-secondary font-medium uppercase">Reports</div>
                  <div className="text-xl font-extrabold text-ink font-mono mt-0.5">
                    <AnimatedNumber value={userStats.reportsCount} />
                  </div>
                </div>

                <div
                  onClick={() => onNavigateToTab('my-claims')}
                  className="p-3 rounded-xl bg-surface-secondary/60 hover:bg-surface border border-surface-border hover:border-ink/20 transition-all cursor-pointer"
                >
                  <div className="text-[10px] text-ink-secondary font-medium uppercase">Claims</div>
                  <div className="text-xl font-extrabold text-ink font-mono mt-0.5">
                    <AnimatedNumber value={userStats.claimsCount} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-secondary/60 border border-surface-border">
                  <div className="text-[10px] text-found-text font-medium uppercase">Resolved</div>
                  <div className="text-xl font-extrabold text-found-text font-mono mt-0.5">
                    <AnimatedNumber value={userStats.resolvedCount} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-secondary/60 border border-surface-border">
                  <div className="text-[10px] text-amber-700 font-medium uppercase">Pending</div>
                  <div className="text-xl font-extrabold text-amber-700 font-mono mt-0.5">
                    <AnimatedNumber value={userStats.pendingCount} />
                  </div>
                </div>
              </div>
            </div>
          ) : !isAuthenticated && (
            <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink">Campus Member Portal</h4>
                  <p className="text-[11px] text-ink-secondary">
                    Sign in to track your submissions and claim property.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="w-full py-2 px-3 rounded-xl bg-ink text-surface text-xs font-semibold hover:bg-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with SRM Mail</span>
              </button>
            </div>
          )}

          {/* Categories Navigation Tree */}
          {categories.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-surface-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Categories
                </h3>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => onCategoryChange('')}
                    className="text-[11px] text-ink-muted hover:text-ink flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onCategoryChange(isSelected ? '' : cat.id)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-ink text-surface font-semibold border-ink'
                          : 'bg-surface-secondary/50 hover:bg-surface border-surface-border text-ink'
                      }`}
                    >
                      <div className={isSelected ? 'text-surface' : 'text-ink-secondary'}>
                        {getCategoryIcon(cat.name)}
                      </div>
                      <span className="text-[11px] truncate font-medium">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campus Location Zones Grid */}
          {locationZones.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-surface-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Campus Locations
                </h3>
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={() => onLocationChange('')}
                    className="text-[11px] text-ink-muted hover:text-ink flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {locationZones.map((zone) => {
                  const isSelected = selectedLocation === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => onLocationChange(isSelected ? '' : zone.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-ink text-surface shadow-xs'
                          : 'bg-surface-secondary/60 hover:bg-surface border border-surface-border text-ink-secondary hover:text-ink'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-ink-muted" />
                      <span>{zone.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
