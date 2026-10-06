import React from 'react';
import type { ItemSummary } from '../../types';
import { formatDate } from '../../lib/utils';
import { Package, MapPin, ArrowUpRight } from 'lucide-react';

interface ItemCardProps {
  item: ItemSummary;
  onSelect: (itemId: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
  const isLost = item.type === 'LOST';

  return (
    <article
      onClick={() => onSelect(item.id)}
      className="group bg-surface rounded-2xl border border-surface-border hover:border-ink/30 shadow-xs hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col overflow-hidden text-left"
    >
      {/* Image container */}
      <div className="relative aspect-4/3 w-full bg-surface-secondary overflow-hidden border-b border-surface-border">
        {item.primaryImageUrl ? (
          <img
            src={item.primaryImageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted">
            <Package className="w-7 h-7 stroke-1 mb-1 opacity-40" />
            <span className="text-[11px]">No photo</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
          <span
            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
              isLost
                ? 'bg-lost-bg text-lost-text border border-lost-border'
                : 'bg-found-bg text-found-text border border-found-border'
            }`}
          >
            {item.type}
          </span>
          {item.status !== 'OPEN' && (
            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface/90 backdrop-blur-xs text-ink-secondary border border-surface-border">
              {item.status.toLowerCase()}
            </span>
          )}
        </div>

        {item.imageCount > 1 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
            {item.imageCount} photos
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          <div className="flex items-center justify-between text-[11px] text-ink-muted mb-1">
            <span className="font-medium text-ink-secondary">{item.category?.name}</span>
            <span>{formatDate(item.occurredAt || item.createdAt)}</span>
          </div>
          <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors line-clamp-1 leading-snug">
            {item.title}
          </h3>
          <p className="mt-1 text-xs text-ink-secondary line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="text-[11px] text-ink-secondary pt-2.5 border-t border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-1 truncate max-w-[80%]">
            <MapPin className="w-3 h-3 text-ink-muted shrink-0" />
            <span className="truncate">{item.location?.name}</span>
            {item.locationDetail && (
              <span className="text-ink-muted truncate">· {item.locationDetail}</span>
            )}
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-accent transition-colors shrink-0" />
        </div>
      </div>
    </article>
  );
};
