import React from 'react';
import { PackageSearch, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode | LucideIcon;
  actionLabel?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  actionText,
  onAction,
}) => {
  const buttonLabel = actionLabel || actionText;

  const renderIcon = () => {
    if (!icon) {
      return <PackageSearch className="w-6 h-6 text-ink-muted" />;
    }
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-6 h-6 text-ink-muted" />;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-surface rounded-xl border border-surface-border shadow-xs max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-surface-border flex items-center justify-center mb-3.5 text-ink-secondary">
        {renderIcon()}
      </div>
      <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
      <p className="text-xs text-ink-secondary max-w-sm mb-4 leading-relaxed">{description}</p>
      {buttonLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-accent hover:bg-accent-hover transition-colors shadow-xs cursor-pointer"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

