import React from 'react';

export const ItemCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-3.5 flex flex-col gap-2.5 shadow-xs overflow-hidden">
      <div className="w-full aspect-4/3 bg-surface-secondary rounded-lg relative overflow-hidden skeleton-shimmer" />
      <div className="flex items-center gap-2">
        <div className="w-12 h-4 bg-surface-secondary rounded" />
        <div className="w-16 h-4 bg-surface-secondary rounded" />
      </div>
      <div className="w-3/4 h-4 bg-surface-secondary rounded" />
      <div className="w-full h-3 bg-surface-secondary/70 rounded" />
      <div className="flex items-center justify-between pt-2.5 border-t border-surface-border mt-auto">
        <div className="w-16 h-3 bg-surface-secondary rounded" />
        <div className="w-12 h-3 bg-surface-secondary rounded" />
      </div>
    </div>
  );
};

export const LoadingSkeleton = ItemCardSkeleton;

export const ItemGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
};

