import React from 'react';
import type { Category, LocationZone, ItemSummary, ItemType, PaginatedResponse } from '../../types';
import { ItemCard } from '../items/ItemCard';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
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
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('elec') || lower.includes('phone') || lower.includes('laptop') || lower.includes('gadget')) {
    return <Laptop className="w-4 h-4" />;
  }
  if (lower.includes('bag') || lower.includes('backpack') || lower.includes('wallet') || lower.includes('purse')) {
    return <Briefcase className="w-4 h-4" />;
  }
  if (lower.includes('doc') || lower.includes('id') || lower.includes('card') || lower.includes('passport')) {
    return <FileText className="w-4 h-4" />;
  }
  if (lower.includes('key')) {
    return <Key className="w-4 h-4" />;
  }
  if (lower.includes('cloth') || lower.includes('wear') || lower.includes('jacket')) {
    return <Shirt className="w-4 h-4" />;
  }
  if (lower.includes('book') || lower.includes('stationery') || lower.includes('note')) {
    return <BookOpen className="w-4 h-4" />;
  }
  return <Tag className="w-4 h-4" />;
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
}) => {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  React.useEffect(() => {
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
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. Header Zone & Primary Search */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Lost &amp; Found
            </h1>
            <span className="text-[11px] font-medium text-ink-muted bg-surface-secondary border border-surface-border px-2 py-0.5 rounded-md">
              SRM Ramapuram
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Find reported items or report something you've lost or found.
          </p>
        </div>

        {/* Primary Search Surface */}
        <div className="relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, categories or locations..."
            className="w-full pl-10 pr-20 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-xs transition-colors"
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
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-secondary border border-surface-border text-[10px] font-mono text-ink-muted">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* 2. Quick Actions: Dual Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => onOpenReport('LOST')}
          className="group p-4 bg-surface hover:bg-surface-secondary/40 border border-surface-border hover:border-lost/30 rounded-xl text-left shadow-xs transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-lost-bg border border-lost-border flex items-center justify-center text-lost-text shrink-0 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs sm:text-sm text-ink group-hover:text-lost-text transition-colors">
                Report Lost Item
              </div>
              <p className="text-[11px] text-ink-secondary truncate">
                Tell us what you lost.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-lost-text group-hover:translate-x-1 transition-all shrink-0 ml-2" />
        </button>

        <button
          type="button"
          onClick={() => onOpenReport('FOUND')}
          className="group p-4 bg-surface hover:bg-surface-secondary/40 border border-surface-border hover:border-found/30 rounded-xl text-left shadow-xs transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-found-bg border border-found-border flex items-center justify-center text-found-text shrink-0 group-hover:scale-105 transition-transform">
              <PackagePlus className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs sm:text-sm text-ink group-hover:text-found-text transition-colors">
                Report Found Item
              </div>
              <p className="text-[11px] text-ink-secondary truncate">
                Help return an item.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-found-text group-hover:translate-x-1 transition-all shrink-0 ml-2" />
        </button>
      </div>

      {/* 3. User Activity Overview */}
      {isAuthenticated && userStats ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              My Activity
            </h2>
            <button
              onClick={() => onNavigateToTab('my-items')}
              className="text-[11px] text-accent hover:text-accent-hover font-medium cursor-pointer"
            >
              View all reports →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              onClick={() => onNavigateToTab('my-items')}
              className="p-3 bg-surface border border-surface-border rounded-lg shadow-xs cursor-pointer hover:border-ink-muted transition-colors"
            >
              <div className="text-[11px] text-ink-secondary font-medium">Reports</div>
              <div className="text-lg font-bold text-ink mt-0.5 font-mono">
                {userStats.reportsCount}
              </div>
            </div>

            <div
              onClick={() => onNavigateToTab('my-claims')}
              className="p-3 bg-surface border border-surface-border rounded-lg shadow-xs cursor-pointer hover:border-ink-muted transition-colors"
            >
              <div className="text-[11px] text-ink-secondary font-medium">Claims</div>
              <div className="text-lg font-bold text-ink mt-0.5 font-mono">
                {userStats.claimsCount}
              </div>
            </div>

            <div className="p-3 bg-surface border border-surface-border rounded-lg shadow-xs">
              <div className="text-[11px] text-ink-secondary font-medium">Resolved</div>
              <div className="text-lg font-bold text-found font-mono mt-0.5">
                {userStats.resolvedCount}
              </div>
            </div>

            <div className="p-3 bg-surface border border-surface-border rounded-lg shadow-xs">
              <div className="text-[11px] text-ink-secondary font-medium">Pending</div>
              <div className="text-lg font-bold text-amber-600 font-mono mt-0.5">
                {userStats.pendingCount}
              </div>
            </div>
          </div>
        </div>
      ) : !isAuthenticated && (
        <div className="p-3.5 bg-surface border border-surface-border rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-ink">Sign in with campus email</p>
              <p className="text-[11px] text-ink-secondary">
                Track your reported property and submit ownership claims securely.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary hover:bg-surface border border-surface-border text-xs font-medium text-ink transition-colors self-start sm:self-auto cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-ink-muted" />
            <span>Sign In</span>
          </button>
        </div>
      )}

      {/* 4. Browse by Category */}
      {categories.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              Browse Categories
            </h2>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => onCategoryChange('')}
                className="text-[11px] text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Clear category
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(isSelected ? '' : cat.id)}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-accent/10 border-accent text-accent font-medium'
                      : 'bg-surface border-surface-border text-ink hover:bg-surface-secondary/60'
                  }`}
                >
                  <div className={`p-1 rounded ${isSelected ? 'text-accent' : 'text-ink-muted'}`}>
                    {getCategoryIcon(cat.name)}
                  </div>
                  <span className="text-xs truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Campus Location Zones */}
      {locationZones.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              Campus Locations
            </h2>
            {selectedLocation && (
              <button
                type="button"
                onClick={() => onLocationChange('')}
                className="text-[11px] text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Clear location
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {locationZones.map((zone) => {
              const isSelected = selectedLocation === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => onLocationChange(isSelected ? '' : zone.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-ink text-surface font-medium'
                      : 'bg-surface border border-surface-border text-ink-secondary hover:text-ink hover:bg-surface-secondary'
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

      {/* 6. Filter Controls & Recently Reported Feed */}
      <div className="space-y-4 pt-2 border-t border-surface-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">
              Recently Reported
            </h2>
            {itemsResponse && (
              <span className="text-xs text-ink-muted">
                ({itemsResponse.totalElements} {itemsResponse.totalElements === 1 ? 'item' : 'items'})
              </span>
            )}
          </div>

          {/* Type Segmented Control & Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-0.5 bg-surface-secondary rounded-md border border-surface-border">
              <button
                type="button"
                onClick={() => onTypeFilterChange('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === 'ALL'
                    ? 'bg-surface text-ink shadow-xs font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => onTypeFilterChange('LOST')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
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
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === 'FOUND'
                    ? 'bg-found-bg text-found-text border border-found-border font-semibold shadow-xs'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Found
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                aria-label="Sort items by"
                className="appearance-none pl-2.5 pr-6 py-1 bg-surface border border-surface-border rounded-md text-xs text-ink-secondary hover:text-ink focus:outline-none focus:border-accent cursor-pointer transition-colors"
              >
                <option value="createdAt,desc">Newest first</option>
                <option value="createdAt,asc">Oldest first</option>
                <option value="occurredAt,desc">Recently occurred</option>
                <option value="title,asc">Title (A–Z)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-ink-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Item Grid or Loading or In-Section Empty State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Unable to load items"
            description={error}
            actionLabel="Try again"
            onAction={onResetFilters}
          />
        ) : itemsResponse && itemsResponse.content.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {itemsResponse.content.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onSelect={(id) => onSelectItem(id)}
                />
              ))}
            </div>

            {itemsResponse.totalPages > 1 && (
              <div className="flex items-center justify-between py-3 border-t border-surface-border text-xs text-ink-secondary">
                <div>
                  Page <span className="font-semibold text-ink">{currentPage + 1}</span> of{' '}
                  <span className="font-semibold text-ink">{itemsResponse.totalPages}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                    disabled={itemsResponse.first}
                    className="px-2.5 py-1 rounded border border-surface-border bg-surface hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => onPageChange(Math.min(itemsResponse.totalPages - 1, currentPage + 1))}
                    disabled={itemsResponse.last}
                    className="px-2.5 py-1 rounded border border-surface-border bg-surface hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 sm:p-10 rounded-xl bg-surface border border-surface-border text-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-surface-secondary border border-surface-border flex items-center justify-center mx-auto text-ink-muted">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">No items reported yet</h3>
              <p className="text-xs text-ink-secondary max-w-sm mx-auto mt-1">
                {hasActiveFilters
                  ? 'No reports match your active search and filter selections.'
                  : "There aren't any active lost or found reports right now. When someone reports an item, it will appear here."}
              </p>
            </div>
            <div className="pt-1 flex items-center justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-secondary hover:bg-surface border border-surface-border text-ink text-xs font-medium transition-colors cursor-pointer"
                >
                  Reset filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenReport('LOST')}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Report an item</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
