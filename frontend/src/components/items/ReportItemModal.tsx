import React, { useState } from 'react';
import type { ItemType, Category, LocationZone, CreateItemPayload } from '../../types';
import { itemService } from '../../services/itemService';
import {
  X,
  ImageIcon,
  AlertCircle,
  Trash2,
  Lock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface ReportItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdItemId: string) => void;
  categories: Category[];
  locationZones: LocationZone[];
  defaultType?: ItemType;
}

export const ReportItemModal: React.FC<ReportItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  locationZones,
  defaultType = 'LOST',
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [type, setType] = useState<ItemType>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationZoneId, setLocationZoneId] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [verificationQuestion, setVerificationQuestion] = useState('');
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`${file.name} is not a valid JPEG, PNG, or WebP image.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds 10MB limit.`);
        continue;
      }
      if (selectedFiles.length + validFiles.length >= 5) {
        alert('Maximum 5 images allowed.');
        break;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number) => {
    setError(null);
    if (step === 1) {
      return true;
    }
    if (step === 2) {
      if (!title.trim()) {
        setError('Please enter a title');
        return false;
      }
      if (!categoryId) {
        setError('Please select a category');
        return false;
      }
      if (!description.trim()) {
        setError('Please enter a description');
        return false;
      }
    }
    if (step === 3) {
      if (!locationZoneId) {
        setError('Please select a campus location');
        return false;
      }
    }
    if (step === 4) {
      if (type === 'FOUND') {
        if (!verificationQuestion.trim()) {
          setError('Please provide a verification question');
          return false;
        }
        if (!verificationAnswer.trim()) {
          setError('Please provide the secret verification answer');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1) as any);
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1) as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !categoryId || !locationZoneId) {
      setError('Please complete all required fields.');
      return;
    }

    if (type === 'FOUND') {
      if (!verificationQuestion.trim() || !verificationAnswer.trim()) {
        setError('Please provide the verification question and answer.');
        return;
      }
    }

    try {
      setLoading(true);

      const payload: CreateItemPayload = {
        type,
        title: title.trim(),
        description: description.trim(),
        categoryId,
        locationZoneId,
        locationDetail: locationDetail.trim() || undefined,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
        verificationQuestion: type === 'FOUND' ? verificationQuestion.trim() : undefined,
        verificationAnswer: type === 'FOUND' ? verificationAnswer.trim() : undefined,
      };

      const createdItem = await itemService.createItem(payload);

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            await itemService.uploadImage(createdItem.id, file);
          } catch (uploadErr) {
            console.error('Failed to upload photo:', uploadErr);
          }
        }
      }

      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      onSuccess(createdItem.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Type', 'Details', 'Location', 'Photos & Security', 'Review'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-surface rounded-xl shadow-modal border border-surface-border overflow-hidden z-10 my-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface">
          <div>
            <h3 className="font-semibold text-ink text-sm">Report an item</h3>
            <p className="text-xs text-ink-muted">Step {currentStep} of 5: {stepLabels[currentStep - 1]}</p>
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

        {/* Progress bar */}
        <div className="h-0.5 w-full bg-surface-secondary">
          <div
            className="h-full bg-accent transition-all duration-200"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-md bg-lost-bg border border-lost-border text-lost-text text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-ink">
                What are you reporting?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('LOST')}
                  className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                    type === 'LOST'
                      ? 'border-lost-text bg-lost-bg/30 text-ink'
                      : 'border-surface-border bg-surface hover:bg-surface-secondary text-ink-secondary'
                  }`}
                >
                  <div className="font-semibold text-sm text-lost-text mb-0.5">I lost an item</div>
                  <p className="text-xs text-ink-secondary">Report something you are looking for.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setType('FOUND')}
                  className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                    type === 'FOUND'
                      ? 'border-found-text bg-found-bg/30 text-ink'
                      : 'border-surface-border bg-surface hover:bg-surface-secondary text-ink-secondary'
                  }`}
                >
                  <div className="font-semibold text-sm text-found-text mb-0.5">I found an item</div>
                  <p className="text-xs text-ink-secondary">Report an item you discovered on campus.</p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Item Details */}
          {currentStep === 2 && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="report-title" className="block text-xs font-semibold text-ink">
                  Title <span className="text-lost-text">*</span>
                </label>
                <input
                  id="report-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'LOST' ? 'e.g., MacBook Pro 14" Space Grey' : 'e.g., Casio Calculator'}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="report-category" className="block text-xs font-semibold text-ink">
                  Category <span className="text-lost-text">*</span>
                </label>
                <select
                  id="report-category"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="report-description" className="block text-xs font-semibold text-ink">
                  Description <span className="text-lost-text">*</span>
                </label>
                <textarea
                  id="report-description"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe distinguishing marks, color, stickers, model, or condition..."
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Location & Time */}
          {currentStep === 3 && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="report-location" className="block text-xs font-semibold text-ink">
                  Campus Location Zone <span className="text-lost-text">*</span>
                </label>
                <select
                  id="report-location"
                  required
                  value={locationZoneId}
                  onChange={(e) => setLocationZoneId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">Select campus zone</option>
                  {locationZones.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="report-location-detail" className="block text-xs font-semibold text-ink">
                  Specific spot <span className="text-ink-muted font-normal">(Optional)</span>
                </label>
                <input
                  id="report-location-detail"
                  type="text"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  placeholder="e.g., Lab 304, Desk 12"
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="report-occurred-at" className="block text-xs font-semibold text-ink">
                  Date &amp; Time <span className="text-ink-muted font-normal">(Optional)</span>
                </label>
                <input
                  id="report-occurred-at"
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-xs sm:text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Photos & Verification (if Found) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {type === 'FOUND' && (
                <div className="p-3.5 rounded-md bg-surface-secondary border border-surface-border space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-ink">Ownership verification challenge</h4>
                    <p className="text-[11px] text-ink-muted">
                      Specify a question and secret answer that only the true owner can verify.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="report-verify-question" className="block text-xs font-medium text-ink">
                      Verification Question <span className="text-lost-text">*</span>
                    </label>
                    <input
                      id="report-verify-question"
                      type="text"
                      required
                      value={verificationQuestion}
                      onChange={(e) => setVerificationQuestion(e.target.value)}
                      placeholder="e.g., What keychain or sticker is attached?"
                      className="w-full px-3 py-1.5 bg-surface border border-surface-border rounded-md text-xs text-ink focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="report-verify-answer" className="block text-xs font-medium text-ink flex items-center justify-between">
                      <span>Secret Answer <span className="text-lost-text">*</span></span>
                      <span className="text-[10px] text-ink-muted flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Confidential
                      </span>
                    </label>
                    <input
                      id="report-verify-answer"
                      type="text"
                      required
                      value={verificationAnswer}
                      onChange={(e) => setVerificationAnswer(e.target.value)}
                      placeholder="e.g., Red Pikachu keychain"
                      className="w-full px-3 py-1.5 bg-surface border border-surface-border rounded-md text-xs text-ink focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}

              {/* Photos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink">
                    Photos <span className="text-ink-muted font-normal">(Optional, up to 5)</span>
                  </label>
                  <span className="text-xs text-ink-muted font-mono">{selectedFiles.length}/5</span>
                </div>

                {previewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-surface-border">
                        <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="absolute top-1 right-1 p-0.5 rounded bg-black/70 text-white hover:bg-lost-text cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedFiles.length < 5 && (
                  <label className="border border-dashed border-surface-border hover:border-accent hover:bg-surface-secondary rounded-md p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                    <ImageIcon className="w-6 h-6 text-ink-muted mb-1 stroke-1" />
                    <span className="text-xs font-medium text-ink">Upload photo</span>
                    <span className="text-[11px] text-ink-muted">JPEG, PNG, WebP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-md bg-surface-secondary border border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Report type:</span>
                  <span className={`font-semibold uppercase ${type === 'LOST' ? 'text-lost-text' : 'text-found-text'}`}>
                    {type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Title:</span>
                  <span className="font-semibold text-ink text-right">{title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Category:</span>
                  <span className="text-ink">{categories.find((c) => c.id === categoryId)?.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Location:</span>
                  <span className="text-ink">{locationZones.find((l) => l.id === locationZoneId)?.name || '—'}</span>
                </div>
                {locationDetail && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Specific spot:</span>
                    <span className="text-ink">{locationDetail}</span>
                  </div>
                )}
                {occurredAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Date &amp; Time:</span>
                    <span className="text-ink">{new Date(occurredAt).toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-surface-border">
                  <span className="text-ink-muted block mb-1">Description:</span>
                  <p className="text-ink-secondary">{description}</p>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="pt-1 text-ink-muted">
                    {selectedFiles.length} {selectedFiles.length === 1 ? 'photo' : 'photos'} attached
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-3 border-t border-surface-border flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-surface-border text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md border border-surface-border text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-ink text-white text-xs font-medium hover:bg-black transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-subtle cursor-pointer"
              >
                {loading ? 'Submitting...' : 'Submit report'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
