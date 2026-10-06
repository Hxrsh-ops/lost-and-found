import React, { useState, useEffect, useCallback } from 'react';
import type { ClaimSummary, ClaimStatus } from '../../types';
import { claimService } from '../../services/claimService';
import { EmptyState } from '../common/EmptyState';
import {
  ShieldCheck,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface MyClaimsViewProps {
  onOpenClaimReview: (claimId: string) => void;
  onNavigateToFeed: () => void;
}

export const MyClaimsView: React.FC<MyClaimsViewProps> = ({
  onOpenClaimReview,
  onNavigateToFeed,
}) => {
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'ALL'>('ALL');

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await claimService.getMyClaims({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: 0,
        size: 50,
      });
      setClaims(res.content);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to load your submitted claims.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const renderStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-700 border border-red-500/20">
            <XCircle className="w-3 h-3" /> Rejected
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

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface border border-surface-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-ink">My Claims</h2>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Track verification status for recovered items you claimed.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-surface-secondary p-0.5 rounded-lg border border-surface-border">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-surface rounded-xl border border-surface-border animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface-secondary rounded-lg" />
                <div className="space-y-1.5">
                  <div className="w-40 h-3.5 bg-surface-secondary rounded" />
                  <div className="w-28 h-3 bg-surface-secondary rounded" />
                </div>
              </div>
              <div className="w-20 h-7 bg-surface-secondary rounded-lg" />
            </div>
          ))}
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          title="No claims found"
          description={
            statusFilter === 'ALL'
              ? "You haven't submitted any ownership claims on found items yet."
              : `No claims currently found with status "${statusFilter}".`
          }
          actionLabel="Browse Items"
          onAction={onNavigateToFeed}
        />
      ) : (
        <div className="space-y-2.5">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="p-3.5 sm:p-4 rounded-xl bg-surface border border-surface-border shadow-xs hover:border-ink-muted transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {claim.primaryImageUrl ? (
                  <img
                    src={claim.primaryImageUrl}
                    alt={claim.itemTitle}
                    className="w-12 h-12 rounded-lg object-cover border border-surface-border shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-surface-secondary border border-surface-border flex items-center justify-center text-ink-muted shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink text-xs sm:text-sm truncate">
                      {claim.itemTitle}
                    </span>
                    {renderStatusBadge(claim.status)}
                  </div>
                  <div className="text-[11px] text-ink-muted flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Submitted {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {claim.decidedAt && (
                    <div className="text-[11px] text-ink-secondary mt-0.5">
                      Decision made: {new Date(claim.decidedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenClaimReview(claim.id)}
                  className="px-3 py-1.5 rounded-lg bg-surface-secondary hover:bg-surface border border-surface-border text-ink text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

