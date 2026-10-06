import React from 'react';
import type { ItemSummary } from '../../types';
import { formatDate } from '../../lib/utils';
import { ImageIcon } from 'lucide-react';

interface ItemCardProps {
  item: ItemSummary;
  onSelect: (itemId: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
  const isLost = item.type === 'LOST';

  return (
    <article
      onClick={() => onSelect(item.id)}
      className="group bg-surface rounded-lg border border-surface-border shadow-card hover:shadow-card-hover hover:border-surface-border-strong transition-all duration-150 cursor-pointer flex flex-col overflow-hidden"
    >
      {/* Image container */}
      <div className="relative aspect-4/3 w-full bg-surface-secondary overflow-hidden border-b border-surface-border">
        {item.primaryImageUrl ? (
          <img
            src={item.primaryImageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted">
            <ImageIcon className="w-6 h-6 stroke-1 mb-1 opacity-50" />
            <span className="text-[11px]">No photo</span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
              isLost
                ? 'bg-lost-bg text-lost-text border border-lost-border'
                : 'bg-found-bg text-found-text border border-found-border'
            }`}
          >
            {item.type}
          </span>
          {item.status !== 'OPEN' && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-secondary text-ink-secondary border border-surface-border">
              {item.status.toLowerCase()}
            </span>
          )}
        </div>

        {item.imageCount > 1 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
            {item.imageCount}
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-ink-muted mb-1">
            <span>{item.category?.name}</span>
            <span>{formatDate(item.occurredAt || item.createdAt)}</span>
          </div>
          <h3 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors line-clamp-1 leading-snug">
            {item.title}
          </h3>
          <p className="mt-0.5 text-xs text-ink-secondary line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="text-[11px] text-ink-secondary truncate pt-2 border-t border-surface-border-subtle">
          <span>{item.location?.name}</span>
          {item.locationDetail && (
            <span className="text-ink-muted"> · {item.locationDetail}</span>
          )}
        </div>
      </div>
    </article>
  );
};
