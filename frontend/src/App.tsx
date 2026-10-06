import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, type NavTab } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomeWorkspace } from './components/home/HomeWorkspace';
import { ItemCard } from './components/items/ItemCard';
import { ItemDetailModal } from './components/items/ItemDetailModal';
import { ReportItemModal } from './components/items/ReportItemModal';
import { EditItemModal } from './components/items/EditItemModal';
import { ClaimItemModal } from './components/claims/ClaimItemModal';
import { ClaimReviewModal } from './components/claims/ClaimReviewModal';
import { MyClaimsView } from './components/claims/MyClaimsView';
import { ReviewClaimsView } from './components/claims/ReviewClaimsView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AuthModal } from './components/auth/AuthModal';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { EmptyState } from './components/common/EmptyState';
import { CommandPalette } from './components/common/CommandPalette';
import type {
  ItemSummary,
  ItemDetail,
  Category,
  LocationZone,
  ItemType,
  PaginatedResponse,
} from './types';
import { itemService } from './services/itemService';
import { claimService } from './services/claimService';
import { categoryService } from './services/categoryService';
import { locationService } from './services/locationService';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface UserStats {
  reportsCount: number;
  claimsCount: number;
  resolvedCount: number;
  pendingCount: number;
}

const MainAppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('feed');

  const [categories, setCategories] = useState<Category[]>([]);
  const [locationZones, setLocationZones] = useState<LocationZone[]>([]);

  // Feed & Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sort, setSort] = useState('createdAt,desc');
  const [currentPage, setCurrentPage] = useState(0);

  // Cached responses to prevent transition flicker
  const [feedResponse, setFeedResponse] = useState<PaginatedResponse<ItemSummary> | null>(null);
  const [myItemsResponse, setMyItemsResponse] = useState<PaginatedResponse<ItemSummary> | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [myItemsLoading, setMyItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real User Stats
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register'>('login');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDefaultType, setReportDefaultType] = useState<ItemType>('LOST');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ItemDetail | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Claim State
  const [claimingItem, setClaimingItem] = useState<ItemDetail | null>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [reviewingClaimId, setReviewingClaimId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial lookup data
  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
    locationService.getLocationZones().then(setLocationZones).catch(console.error);
  }, []);

  // Fetch user stats when authenticated
  const fetchUserStats = useCallback(async () => {
    if (!isAuthenticated) {
      setUserStats(null);
      return;
    }
    try {
      const [itemsRes, claimsRes] = await Promise.all([
        itemService.getMyItems({ size: 100 }),
        claimService.getMyClaims({ size: 100 }),
      ]);
      const resolvedItemsCount = itemsRes.content.filter((i) => i.status === 'RESOLVED').length;
      const pendingClaimsCount = claimsRes.content.filter((c) => c.status === 'PENDING').length;

      setUserStats({
        reportsCount: itemsRes.totalElements,
        claimsCount: claimsRes.totalElements,
        resolvedCount: resolvedItemsCount,
        pendingCount: pendingClaimsCount,
      });
    } catch {
      // Quietly ignore stat failures
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  // Fetch Feed Items
  const fetchFeedItems = useCallback(async () => {
    setError(null);
    try {
      const data = await itemService.getItems({
        search: search.trim() || undefined,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        categoryId: selectedCategory || undefined,
        locationZoneId: selectedLocation || undefined,
        page: currentPage,
        size: 12,
        sort,
      });
      setFeedResponse(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to load items from server');
      }
    } finally {
      setFeedLoading(false);
    }
  }, [search, typeFilter, selectedCategory, selectedLocation, currentPage, sort]);

  // Fetch My Items
  const fetchMyItems = useCallback(async () => {
    if (!isAuthenticated) {
      setMyItemsResponse(null);
      return;
    }
    setMyItemsLoading(true);
    try {
      const data = await itemService.getMyItems({
        page: currentPage,
        size: 12,
        sort,
      });
      setMyItemsResponse(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      }
    } finally {
      setMyItemsLoading(false);
    }
  }, [isAuthenticated, currentPage, sort]);

  // Trigger feed query on feed filter changes
  useEffect(() => {
    fetchFeedItems();
  }, [fetchFeedItems]);

  // Trigger my items on tab or auth change
  useEffect(() => {
    if (currentTab === 'my-items') {
      fetchMyItems();
    }
  }, [currentTab, fetchMyItems]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setSelectedCategory('');
    setSelectedLocation('');
    setSort('createdAt,desc');
    setCurrentPage(0);
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthDefaultMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenReport = (type: ItemType = 'LOST') => {
    if (!isAuthenticated) {
      setAuthDefaultMode('login');
      setAuthModalOpen(true);
      return;
    }
    setReportDefaultType(type);
    setReportModalOpen(true);
  };

  const handleReportSuccess = (createdItemId: string) => {
    fetchFeedItems();
    fetchUserStats();
    if (currentTab === 'my-items') {
      fetchMyItems();
    }
    setSelectedItemId(createdItemId);
  };

  const handleEditItem = (item: ItemDetail) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleEditSuccess = (updatedItemId: string) => {
    fetchFeedItems();
    fetchUserStats();
    if (currentTab === 'my-items') {
      fetchMyItems();
    }
    setSelectedItemId(updatedItemId);
  };

  const handleStartClaim = (item: ItemDetail) => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setClaimingItem(item);
    setClaimModalOpen(true);
  };

  const handleOpenClaimReview = (claimId: string) => {
    setReviewingClaimId(claimId);
    setReviewModalOpen(true);
  };

  const handleSelectTab = (tab: NavTab) => {
    if (tab !== 'feed' && !isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setCurrentTab(tab);
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col justify-between text-ink font-sans antialiased pb-16 md:pb-0">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenReport={handleOpenReport}
        onOpenAuth={handleOpenAuth}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Feed / Home Workspace */}
        {currentTab === 'feed' && (
          <HomeWorkspace
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setCurrentPage(0);
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={(type) => {
              setTypeFilter(type);
              setCurrentPage(0);
            }}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              setCurrentPage(0);
            }}
            selectedLocation={selectedLocation}
            onLocationChange={(loc) => {
              setSelectedLocation(loc);
              setCurrentPage(0);
            }}
            sort={sort}
            onSortChange={(s) => {
              setSort(s);
              setCurrentPage(0);
            }}
            categories={categories}
            locationZones={locationZones}
            onResetFilters={handleResetFilters}
            itemsResponse={feedResponse}
            loading={feedLoading}
            error={error}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onSelectItem={(id) => setSelectedItemId(id)}
            onOpenReport={handleOpenReport}
            onOpenAuth={handleOpenAuth}
            isAuthenticated={isAuthenticated}
            userStats={userStats}
            onNavigateToTab={(t) => handleSelectTab(t)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />
        )}

        {/* 2. My Reports View */}
        {currentTab === 'my-items' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-surface-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-base font-semibold text-ink">My Reports</h1>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Items you have reported on campus.
                </p>
              </div>
              <button
                onClick={() => handleOpenReport('LOST')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white font-medium text-xs shadow-xs hover:bg-accent-hover transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Item</span>
              </button>
            </div>

            {myItemsLoading && !myItemsResponse ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <LoadingSkeleton key={i} />
                ))}
              </div>
            ) : myItemsResponse && myItemsResponse.content.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {myItemsResponse.content.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onSelect={(id) => setSelectedItemId(id)}
                    />
                  ))}
                </div>

                {myItemsResponse.totalPages > 1 && (
                  <div className="flex items-center justify-between py-3 border-t border-surface-border text-xs text-ink-secondary">
                    <div>
                      Page <span className="font-semibold text-ink">{currentPage + 1}</span> of{' '}
                      <span className="font-semibold text-ink">{myItemsResponse.totalPages}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={myItemsResponse.first}
                        className="px-2.5 py-1 rounded border border-surface-border bg-surface hover:bg-surface-secondary disabled:opacity-40 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(myItemsResponse.totalPages - 1, p + 1))}
                        disabled={myItemsResponse.last}
                        className="px-2.5 py-1 rounded border border-surface-border bg-surface hover:bg-surface-secondary disabled:opacity-40 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No reports yet"
                description="You have not reported any lost or found items on campus yet."
                actionLabel="Report an item"
                onAction={() => handleOpenReport('LOST')}
              />
            )}
          </div>
        )}

        {/* 3. My Claims View */}
        {currentTab === 'my-claims' && (
          <div className="animate-in fade-in duration-150">
            <MyClaimsView
              onOpenClaimReview={handleOpenClaimReview}
              onNavigateToFeed={() => handleSelectTab('feed')}
            />
          </div>
        )}

        {/* 4. Review Queue View */}
        {currentTab === 'review-claims' && (
          <div className="animate-in fade-in duration-150">
            <ReviewClaimsView
              onOpenClaimReview={handleOpenClaimReview}
              onNavigateToFeed={() => handleSelectTab('feed')}
            />
          </div>
        )}

        {/* 5. Admin Governance View */}
        {currentTab === 'admin' && (
          <div className="animate-in fade-in duration-150">
            <AdminDashboardView
              onSelectItem={(id) => setSelectedItemId(id)}
              onOpenClaimReview={handleOpenClaimReview}
            />
          </div>
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authDefaultMode}
      />

      <ReportItemModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={handleReportSuccess}
        categories={categories}
        locationZones={locationZones}
        defaultType={reportDefaultType}
      />

      <ItemDetailModal
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onEdit={handleEditItem}
        onClaim={handleStartClaim}
      />

      <EditItemModal
        item={editingItem}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleEditSuccess}
        categories={categories}
        locationZones={locationZones}
      />

      {claimingItem && (
        <ClaimItemModal
          item={claimingItem}
          isOpen={claimModalOpen}
          onClose={() => {
            setClaimModalOpen(false);
            setClaimingItem(null);
          }}
          onClaimSubmitted={() => {
            fetchFeedItems();
            fetchUserStats();
            handleSelectTab('my-claims');
          }}
        />
      )}

      {reviewingClaimId && (
        <ClaimReviewModal
          claimId={reviewingClaimId}
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setReviewingClaimId(null);
          }}
          onClaimUpdated={() => {
            fetchFeedItems();
            fetchUserStats();
          }}
        />
      )}

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTab={handleSelectTab}
        onOpenReport={handleOpenReport}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setCurrentPage(0);
        }}
        onSelectLocation={(locId) => {
          setSelectedLocation(locId);
          setCurrentPage(0);
        }}
        onPerformSearch={(q) => {
          setSearch(q);
          setCurrentPage(0);
        }}
        categories={categories}
        locationZones={locationZones}
        items={feedResponse?.content || []}
        onSelectItem={(id) => setSelectedItemId(id)}
      />

      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;

