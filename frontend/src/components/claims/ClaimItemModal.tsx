import React, { useState } from 'react';
import type { ItemDetail } from '../../types';
import { claimService } from '../../services/claimService';
import {
  X,
  ShieldCheck,
  Package,
  AlertCircle,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ClaimItemModalProps {
  item: ItemDetail;
  isOpen: boolean;
  onClose: () => void;
  onClaimSubmitted: () => void;
}

export const ClaimItemModal: React.FC<ClaimItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onClaimSubmitted,
}) => {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Please provide your verification answer or proof of ownership details.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await claimService.submitClaim(item.id, { answer: answer.trim() });
      onClaimSubmitted();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to submit claim. You may already have a pending claim for this item.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
    >
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-surface rounded-xl shadow-xl border border-surface-border overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="claim-modal-title" className="font-semibold text-ink text-sm">
                Claim Item
              </h2>
              <p className="text-xs text-ink-secondary">
                Submit verification details to verify your ownership.
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Preview Card */}
          <div className="p-3 rounded-lg bg-surface-secondary border border-surface-border flex items-center gap-3">
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[0].publicUrl}
                alt={item.title}
                className="w-12 h-12 rounded-lg object-cover border border-surface-border shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-ink-muted shrink-0">
                <Package className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-ink text-xs truncate">{item.title}</h4>
              <p className="text-[11px] text-ink-secondary mt-0.5 truncate">
                {item.category?.name} • {item.location?.name}
              </p>
            </div>
          </div>

          {/* Verification Challenge Card */}
          {item.verificationQuestion && (
            <div className="p-3.5 rounded-lg bg-surface-secondary border border-surface-border space-y-1.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-semibold text-ink">
                  Verification Question
                </span>
              </div>
              <p className="text-xs text-ink-secondary bg-surface p-2.5 rounded-lg border border-surface-border">
                {item.verificationQuestion}
              </p>
            </div>
          )}

          {/* Claimant Proof Input */}
          <div className="space-y-1">
            <label htmlFor="verification-answer" className="block text-xs font-medium text-ink flex items-center justify-between">
              <span>Your Answer / Ownership Proof <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-ink-muted flex items-center gap-1 font-normal">
                <Lock className="w-3 h-3 text-ink-muted" /> Confidential
              </span>
            </label>
            <textarea
              id="verification-answer"
              rows={4}
              required
              disabled={loading}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Describe distinguishing features, contents, serial numbers, case characteristics, or answer the question..."
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-surface-secondary border border-surface-border text-[11px] text-ink-secondary flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
            <span>
              The finder or authorized campus personnel will review your response before releasing the item.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg border border-surface-border text-ink-secondary text-xs font-medium hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !answer.trim()}
              className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Claim</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

