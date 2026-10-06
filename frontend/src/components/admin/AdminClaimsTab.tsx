import React, { useState, useEffect, useCallback } from 'react';
import type { ClaimDetail, ClaimStatus } from '../../types';
import { adminService } from '../../services/adminService';
import { EmptyState } from '../common/EmptyState';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  User,
} from 'lucide-react';

interface AdminClaimsTabProps {
  onOpenClaimReview: (claimId: string) => void;
}

export const AdminClaimsTab: React.FC<AdminClaimsTabProps> = ({ onOpenClaimReview }) => {
  const [claims, setClaims] = useState<ClaimDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAdminClaims({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        size: 20,
      });
      setClaims(res.content);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to load campus claims.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const getStatusBadge = (status: ClaimStatus) => {
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
    <div className="space-y-3">
      {/* Filters */}
      <div className="p-3 sm:p-4 rounded-xl bg-surface border border-surface-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="font-semibold text-ink text-xs">Claims Oversight</span>

        <div className="flex items-center bg-surface-secondary p-0.5 rounded-lg border border-surface-border">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(0);
              }}
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

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Claims Table */}
      {loading ? (
        <div className="p-10 text-center text-ink-muted text-xs flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading claims...</span>
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          title="No claims found"
          description={
            statusFilter === 'ALL'
              ? 'No claims have been submitted on campus yet.'
              : `No claims with status "${statusFilter}".`
          }
        />
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary border-b border-surface-border text-ink-secondary text-[11px] font-medium">
                  <th className="py-2.5 px-3.5 font-medium">Item</th>
                  <th className="py-2.5 px-3.5 font-medium">Claimant</th>
                  <th className="py-2.5 px-3.5 font-medium">Status</th>
                  <th className="py-2.5 px-3.5 font-medium">Submitted</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-ink">{claim.itemTitle}</div>
                      <div className="text-[11px] text-ink-muted">Item Status: {claim.itemStatus}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-ink flex items-center gap-1">
                        <User className="w-3 h-3 text-accent" /> {claim.claimantName}
                      </div>
                      <div className="text-ink-muted text-[11px]">{claim.claimantEmail}</div>
                    </td>
                    <td className="py-3 px-3.5">{getStatusBadge(claim.status)}</td>
                    <td className="py-3 px-3.5 text-ink-muted text-[11px]">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenClaimReview(claim.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer ${
                          claim.status === 'PENDING'
                            ? 'bg-accent hover:bg-accent-hover text-white shadow-xs'
                            : 'border border-surface-border text-ink-secondary hover:text-ink hover:bg-surface-secondary'
                        }`}
                      >
                        <span>{claim.status === 'PENDING' ? 'Evaluate' : 'Details'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
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

