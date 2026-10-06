import React, { useState, useEffect } from 'react';
import type { ItemDetail, ItemImage } from '../../types';
import { itemService } from '../../services/itemService';
import {
  X,
  MapPin,
  Calendar,
  Edit3,
  ImageIcon,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Upload,
  Trash2,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface ItemDetailModalProps {
  itemId: string | null;
  onClose: () => void;
  onEdit: (item: ItemDetail) => void;
  onClaim?: (item: ItemDetail) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  itemId,
  onClose,
  onEdit,
  onClaim,
}) => {
  const { user } = useAuth();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    if (!itemId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    itemService
      .getItemById(itemId)
      .then((data) => {
        if (isMounted) {
          setItem(data);
          setActiveImageIndex(0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'Failed to load item details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!itemId) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !item) return;
    const file = e.target.files[0];

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    try {
      setUploadingImage(true);
      const newImage: ItemImage = await itemService.uploadImage(item.id, file);
      setItem({
        ...item,
        images: [...item.images, newImage],
      });
      setActiveImageIndex(item.images.length);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        alert((err as { message: string }).message);
      } else {
        alert('Failed to upload image');
      }
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!item || !confirm('Are you sure you want to remove this photo?')) return;
    try {
      await itemService.deleteImage(item.id, imageId);
      const updatedImages = item.images.filter((img) => img.id !== imageId);
      setItem({
        ...item,
        images: updatedImages,
      });
      if (activeImageIndex >= updatedImages.length) {
        setActiveImageIndex(Math.max(0, updatedImages.length - 1));
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        alert((err as { message: string }).message);
      } else {
        alert('Failed to delete image');
      }
    }
  };

  const isLost = item?.type === 'LOST';
  const isOwnerOrStaff = item?.isOwner || user?.role === 'SECURITY' || user?.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-surface rounded-xl shadow-modal border border-surface-border overflow-hidden z-10 my-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface shrink-0">
          <div className="flex items-center gap-2">
            {item && (
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                  isLost
                    ? 'bg-lost-bg text-lost-text border border-lost-border'
                    : 'bg-found-bg text-found-text border border-found-border'
                }`}
              >
                {item.type}
              </span>
            )}
            {item && (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-surface-secondary text-ink-secondary border border-surface-border">
                {item.status.toLowerCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-xs text-ink-muted flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span>Loading details...</span>
          </div>
        ) : error || !item ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-lost-text" />
            <h4 className="text-sm font-semibold text-ink">Failed to load item</h4>
            <p className="text-xs text-ink-secondary">{error || 'Item not found'}</p>
            <button
              onClick={onClose}
              className="mt-2 px-3 py-1.5 bg-ink text-white rounded-md text-xs font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Image Viewer (5 cols) */}
              <div className="md:col-span-5 space-y-2.5">
                <div className="relative rounded-lg bg-surface-secondary border border-surface-border overflow-hidden aspect-4/3 flex items-center justify-center group">
                  {item.images && item.images.length > 0 ? (
                    <>
                      <img
                        src={item.images[activeImageIndex].publicUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {item.images.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setActiveImageIndex((prev) =>
                                prev === 0 ? item.images.length - 1 : prev - 1
                              )
                            }
                            aria-label="Previous image"
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setActiveImageIndex((prev) =>
                                prev === item.images.length - 1 ? 0 : prev + 1
                              )
                            }
                            aria-label="Next image"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {isOwnerOrStaff && (
                        <button
                          onClick={() => handleDeleteImage(item.images[activeImageIndex].id)}
                          className="absolute top-2 right-2 p-1 rounded bg-black/60 text-white hover:bg-lost-text transition-colors cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-ink-muted p-6">
                      <ImageIcon className="w-8 h-8 stroke-1 mb-1 opacity-50" />
                      <p className="text-xs">No photo attached</p>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {item.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-12 h-12 rounded-md overflow-hidden shrink-0 border transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-accent ring-1 ring-accent'
                          : 'border-surface-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.publicUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}

                  {isOwnerOrStaff && (
                    <label className="w-12 h-12 rounded-md border border-dashed border-surface-border hover:border-accent hover:bg-surface-secondary flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 text-ink-muted hover:text-ink">
                      <Upload className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-[9px] uppercase font-mono">
                        {uploadingImage ? '...' : 'Add'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Information & Actions (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <span className="text-xs text-ink-muted">{item.category?.name}</span>
                  <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight mt-0.5">
                    {item.title}
                  </h2>
                </div>

                {/* Location & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-md bg-surface-secondary border border-surface-border">
                    <div className="flex items-center gap-1.5 text-ink-muted text-[11px] mb-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>Location</span>
                    </div>
                    <div className="font-medium text-ink truncate">{item.location?.name}</div>
                    {item.locationDetail && (
                      <div className="text-ink-secondary text-[11px] truncate">{item.locationDetail}</div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-md bg-surface-secondary border border-surface-border">
                    <div className="flex items-center gap-1.5 text-ink-muted text-[11px] mb-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>Date &amp; Time</span>
                    </div>
                    <div className="font-medium text-ink">{formatDate(item.occurredAt || item.createdAt)}</div>
                    <div className="text-ink-secondary text-[11px]">
                      {formatDateTime(item.createdAt).split(',')[1] || ''}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-ink">Description</span>
                  <p className="text-xs text-ink-secondary leading-relaxed bg-surface-secondary/60 p-3 rounded-md border border-surface-border whitespace-pre-line">
                    {item.description}
                  </p>
                </div>

                {/* Verification Question Display */}
                {item.verificationRequired && item.verificationQuestion && (
                  <div className="p-3 rounded-md bg-surface-secondary border border-surface-border space-y-1">
                    <span className="text-xs font-semibold text-ink">Verification challenge</span>
                    <p className="text-xs text-ink-secondary italic">
                      "{item.verificationQuestion}"
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Claimants must provide proof matching this question to verify ownership.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  {item.isOwner && (
                    <button
                      onClick={() => {
                        onEdit(item);
                        onClose();
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-surface border border-surface-border text-ink text-xs font-medium hover:bg-surface-secondary transition-colors cursor-pointer w-full sm:w-auto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                  )}

                  {!item.isOwner && item.type === 'FOUND' && item.status === 'OPEN' && onClaim && (
                    <button
                      onClick={() => {
                        onClaim(item);
                        onClose();
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors shadow-subtle cursor-pointer w-full sm:w-auto"
                    >
                      <span>Claim this item</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reporter Footer */}
            <div className="pt-3 border-t border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Reported {formatDateTime(item.createdAt)}</span>
              </div>
              {item.reporterName && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Reported by {item.reporterName}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
