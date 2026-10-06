import React, { useState, useEffect, useCallback } from 'react';
import type { ClaimDetail } from '../../types';
import { claimService } from '../../services/claimService';
import {
  X,
  ShieldCheck,
  Package,
  AlertCircle,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';

interface ClaimReviewModalProps {
  claimId: string;
  isOpen: boolean;
  onClose: () => void;
  onClaimUpdated: () => void;
}

export const ClaimReviewModal: React.FC<ClaimReviewModalProps> = ({
  claimId,
  isOpen,
  onClose,
  onClaimUpdated,
}) => {
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchClaim = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await claimService.getClaimById(claimId);
      setClaim(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to load claim details.');
      }
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    if (isOpen && claimId) {
      fetchClaim();
      setShowRejectInput(false);
      setRejectionNote('');
    }
  }, [isOpen, claimId, fetchClaim]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this claim? The item will be marked as RESOLVED and all other pending claims will be rejected.')) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await claimService.approveClaim(claimId);
      onClaimUpdated();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to approve claim.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionNote.trim()) {
      setError('Please provide a reason for rejecting this claim.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await claimService.rejectClaim(claimId, { reviewNote: rejectionNote.trim() });
      onClaimUpdated();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to reject claim.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending Review
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-review-title"
    >
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-surface rounded-xl shadow-xl border border-surface-border overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="claim-review-title" className="font-semibold text-ink text-sm">
                  Claim Review
                </h2>
                {claim && renderStatusBadge(claim.status)}
              </div>
              <p className="text-xs text-ink-secondary">
                Review claimant identity and ownership verification response.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-ink-muted text-xs flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>Loading claim details...</span>
            </div>
          ) : claim ? (
            <>
              {/* Item Info Summary */}
              <div className="p-3 rounded-lg bg-surface-secondary border border-surface-border flex items-center gap-3">
                {claim.primaryImageUrl ? (
                  <img
                    src={claim.primaryImageUrl}
                    alt={claim.itemTitle}
                    className="w-12 h-12 rounded-lg object-cover border border-surface-border shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-ink-muted shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-ink text-xs truncate">{claim.itemTitle}</h4>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    Item Status: <span className="font-semibold text-ink">{claim.itemStatus}</span>
                  </p>
                </div>
              </div>

              {/* Claimant Information */}
              <div className="p-3.5 rounded-lg bg-surface-secondary border border-surface-border space-y-1">
                <div className="text-[11px] font-medium text-ink-muted flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent" /> Claimant Details
                </div>
                <div className="font-semibold text-ink text-xs">{claim.claimantName}</div>
                {claim.claimantEmail && (
                  <div className="text-[11px] text-ink-secondary font-mono">{claim.claimantEmail}</div>
                )}
                <div className="text-[11px] text-ink-muted flex items-center gap-1.5 pt-0.5">
                  <Calendar className="w-3 h-3" />
                  Submitted on {new Date(claim.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Claimant's Answer / Verification Proof */}
              {claim.answer ? (
                <div className="p-3.5 rounded-lg bg-surface-secondary border border-surface-border space-y-1.5">
                  <div className="text-[11px] font-medium text-ink">
                    Claimant's Verification Answer
                  </div>
                  <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed bg-surface p-2.5 rounded-lg border border-surface-border">
                    {claim.answer}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-surface-secondary border border-surface-border italic text-ink-muted text-xs">
                  (Verification answer is confidential and visible only to item owners and security staff)
                </div>
              )}

              {/* Decision Note if already decided */}
              {claim.reviewNote && (
                <div className="p-3.5 rounded-lg bg-red-500/5 border border-red-500/20 space-y-1">
                  <div className="text-[11px] font-semibold text-red-700">
                    Rejection Reason
                  </div>
                  <p className="text-xs text-red-700">{claim.reviewNote}</p>
                </div>
              )}

              {/* Action Buttons for Reviewer */}
              {claim.status === 'PENDING' && claim.canReview && (
                <div className="pt-2">
                  {!showRejectInput ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={submitting}
                        className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Resolve Item</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(true)}
                        disabled={submitting}
                        className="py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-700 border border-red-500/20 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Claim</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleReject} className="space-y-2.5 p-3.5 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="space-y-1">
                        <label htmlFor="rejection-reason" className="block text-xs font-medium text-red-700">
                          Rejection Reason <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          id="rejection-reason"
                          rows={3}
                          required
                          disabled={submitting}
                          value={rejectionNote}
                          onChange={(e) => setRejectionNote(e.target.value)}
                          placeholder="State why the proof is insufficient or does not match..."
                          className="w-full px-3 py-1.5 bg-surface border border-red-500/30 rounded-lg text-xs text-ink focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(false)}
                          disabled={submitting}
                          className="px-3 py-1 rounded-lg border border-surface-border text-xs text-ink-secondary hover:bg-surface-secondary transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3 inline mr-1" />
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || !rejectionNote.trim()}
                          className="px-3.5 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="px-5 py-3 border-t border-surface-border bg-surface-secondary flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-1.5 rounded-lg border border-surface-border text-ink-secondary text-xs font-medium hover:bg-surface transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

