import React, { useState, useEffect, useCallback } from 'react';
import type { ItemStatus, ItemSummary, ItemType } from '../../types';
import { adminService } from '../../services/adminService';
import { EmptyState } from '../common/EmptyState';
import {
  Search,
  Package,
  MapPin,
  Tag,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AdminItemsTabProps {
  onSelectItem: (itemId: string) => void;
}

export const AdminItemsTab: React.FC<AdminItemsTabProps> = ({ onSelectItem }) => {
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAdminItems({
        search: search.trim() || undefined,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        size: 20,
      });
      setItems(res.content);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to load campus items.');
      }
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleArchive = async (item: ItemSummary) => {
    if (!window.confirm(`Are you sure you want to archive "${item.title}"? It will no longer appear in public searches.`)) {
      return;
    }

    try {
      await adminService.archiveItem(item.id);
      fetchItems();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        alert((err as { message: string }).message);
      } else {
        alert('Failed to archive item.');
      }
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-700 border border-blue-500/20">
            Open
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            Resolved
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-secondary text-ink-secondary border border-surface-border">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-secondary text-ink-secondary border border-surface-border">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: ItemType) => {
    return type === 'LOST' ? (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-lost border border-red-500/20">
        LOST
      </span>
    ) : (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-found border border-emerald-500/20">
        FOUND
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search & Filters */}
      <div className="p-3 sm:p-4 rounded-xl bg-surface border border-surface-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
          <input
            type="text"
            className="w-full pl-8.5 pr-3 py-1.5 bg-surface border border-surface-border rounded-lg text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="Search all items..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="px-2.5 py-1.5 bg-surface border border-surface-border rounded-lg text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as ItemType | 'ALL');
              setPage(0);
            }}
          >
            <option value="ALL">All Types</option>
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
          </select>

          <select
            className="px-2.5 py-1.5 bg-surface border border-surface-border rounded-lg text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ItemStatus | 'ALL');
              setPage(0);
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Item Table */}
      {loading ? (
        <div className="p-10 text-center text-ink-muted text-xs flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading items...</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No items found"
          description="Try adjusting your filters or search keywords."
        />
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary border-b border-surface-border text-ink-secondary text-[11px] font-medium">
                  <th className="py-2.5 px-3.5 font-medium">Item</th>
                  <th className="py-2.5 px-3.5 font-medium">Type</th>
                  <th className="py-2.5 px-3.5 font-medium">Category & Location</th>
                  <th className="py-2.5 px-3.5 font-medium">Status</th>
                  <th className="py-2.5 px-3.5 font-medium">Reported</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        {item.primaryImageUrl ? (
                          <img
                            src={item.primaryImageUrl}
                            alt={item.title}
                            className="w-9 h-9 rounded-lg object-cover border border-surface-border shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-surface-border flex items-center justify-center text-ink-muted shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate max-w-[200px]">{item.title}</div>
                          <div className="text-[11px] text-ink-muted truncate max-w-[240px]">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">{getTypeBadge(item.type)}</td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-ink flex items-center gap-1">
                        <Tag className="w-3 h-3 text-ink-muted" /> {item.category?.name}
                      </div>
                      <div className="text-ink-muted text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-ink-muted" /> {item.location?.name}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-3.5 text-ink-muted text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectItem(item.id)}
                          className="px-2.5 py-1 rounded-md border border-surface-border text-ink-secondary hover:text-ink hover:bg-surface-secondary text-xs font-medium transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        {item.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => handleArchive(item)}
                            title="Archive item"
                            className="px-2.5 py-1 rounded-md border border-surface-border text-ink-secondary hover:text-ink hover:bg-surface-secondary text-xs font-medium transition-colors cursor-pointer"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border shadow-xs text-xs text-ink-secondary">
          <div>
            Page <span className="font-medium text-ink">{page + 1}</span> of{' '}
            <span className="font-medium text-ink">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2.5 py-1 rounded-md border border-surface-border hover:bg-surface-secondary disabled:opacity-40 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-2.5 py-1 rounded-md border border-surface-border hover:bg-surface-secondary disabled:opacity-40 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

