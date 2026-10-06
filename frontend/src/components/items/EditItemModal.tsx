import React, { useState, useEffect } from 'react';
import type { ItemDetail, Category, LocationZone, UpdateItemPayload } from '../../types';
import { itemService } from '../../services/itemService';
import {
  X,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface EditItemModalProps {
  item: ItemDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItemId: string) => void;
  categories: Category[];
  locationZones: LocationZone[];
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
  categories,
  locationZones,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationZoneId, setLocationZoneId] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [verificationQuestion, setVerificationQuestion] = useState('');
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setCategoryId(item.category?.id || '');
      setLocationZoneId(item.location?.id || '');
      setLocationDetail(item.locationDetail || '');
      setOccurredAt(
        item.occurredAt
          ? new Date(item.occurredAt).toISOString().slice(0, 16)
          : ''
      );
      setVerificationQuestion(item.verificationQuestion || '');
      setVerificationAnswer('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (!locationZoneId) {
      setError('Please select a location zone');
      return;
    }

    try {
      setLoading(true);

      const payload: UpdateItemPayload = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        locationZoneId,
        locationDetail: locationDetail.trim() || undefined,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
      };

      if (item.type === 'FOUND') {
        if (verificationQuestion.trim()) {
          payload.verificationQuestion = verificationQuestion.trim();
        }
        if (verificationAnswer.trim()) {
          payload.verificationAnswer = verificationAnswer.trim();
        }
      }

      await itemService.updateItem(item.id, payload);
      onSuccess(item.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-surface rounded-xl shadow-modal border border-surface-border overflow-hidden z-10 my-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface">
          <div>
            <h3 className="font-semibold text-ink text-sm">Edit Item</h3>
            <p className="text-xs text-ink-muted">Update listing information</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-md bg-lost-bg border border-lost-border text-lost-text text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="edit-item-title" className="block text-xs font-semibold text-ink">
              Title <span className="text-lost-text">*</span>
            </label>
            <input
              id="edit-item-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-item-category" className="block text-xs font-semibold text-ink">
                Category <span className="text-lost-text">*</span>
              </label>
              <select
                id="edit-item-category"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink focus:outline-none focus:border-accent cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-item-location" className="block text-xs font-semibold text-ink">
                Location Zone <span className="text-lost-text">*</span>
              </label>
              <select
                id="edit-item-location"
                required
                value={locationZoneId}
                onChange={(e) => setLocationZoneId(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink focus:outline-none focus:border-accent cursor-pointer"
              >
                {locationZones.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-item-location-detail" className="block text-xs font-semibold text-ink">
                Specific spot
              </label>
              <input
                id="edit-item-location-detail"
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-item-occurred-at" className="block text-xs font-semibold text-ink">
                Date &amp; Time
              </label>
              <input
                id="edit-item-occurred-at"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-item-description" className="block text-xs font-semibold text-ink">
              Description <span className="text-lost-text">*</span>
            </label>
            <textarea
              id="edit-item-description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink focus:outline-none focus:border-accent"
            />
          </div>

          {item.type === 'FOUND' && (
            <div className="p-3.5 rounded-md bg-surface-secondary border border-surface-border space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-ink">Verification challenge</h4>
                <p className="text-[11px] text-ink-muted">
                  Used by claimants to verify ownership.
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-verification-question" className="block text-xs font-medium text-ink">
                  Verification Question
                </label>
                <input
                  id="edit-verification-question"
                  type="text"
                  value={verificationQuestion}
                  onChange={(e) => setVerificationQuestion(e.target.value)}
                  placeholder="e.g., What keychain is attached?"
                  className="w-full px-3 py-1.5 bg-surface border border-surface-border rounded-md text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-verification-answer" className="block text-xs font-medium text-ink flex items-center justify-between">
                  <span>Secret Answer (leave blank to keep unchanged)</span>
                  <span className="text-[10px] text-ink-muted flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Confidential
                  </span>
                </label>
                <input
                  id="edit-verification-answer"
                  type="text"
                  value={verificationAnswer}
                  onChange={(e) => setVerificationAnswer(e.target.value)}
                  placeholder="Enter new secret answer only if changing"
                  className="w-full px-3 py-1.5 bg-surface border border-surface-border rounded-md text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-surface-border text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-subtle cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
