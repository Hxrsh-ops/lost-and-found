import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Category, LocationZone, ItemSummary, ItemType } from '../../types';
import {
  Search,
  X,
  HelpCircle,
  PackagePlus,
  Bookmark,
  FileCheck,
  Shield,
  Tag,
  MapPin,
  Laptop,
  Briefcase,
  FileText,
  Key,
  Shirt,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'feed' | 'my-items' | 'my-claims' | 'review-claims' | 'admin') => void;
  onOpenReport: (type: ItemType) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectLocation: (locationId: string) => void;
  onPerformSearch: (searchQuery: string) => void;
  categories: Category[];
  locationZones: LocationZone[];
  items?: ItemSummary[];
  onSelectItem?: (itemId: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('elec') || lower.includes('phone') || lower.includes('laptop')) {
    return <Laptop className="w-3.5 h-3.5" />;
  }
  if (lower.includes('bag') || lower.includes('backpack')) {
    return <Briefcase className="w-3.5 h-3.5" />;
  }
  if (lower.includes('doc') || lower.includes('id') || lower.includes('card')) {
    return <FileText className="w-3.5 h-3.5" />;
  }
  if (lower.includes('key')) {
    return <Key className="w-3.5 h-3.5" />;
  }
  if (lower.includes('cloth')) {
    return <Shirt className="w-3.5 h-3.5" />;
  }
  if (lower.includes('book')) {
    return <BookOpen className="w-3.5 h-3.5" />;
  }
  return <Tag className="w-3.5 h-3.5" />;
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenReport,
  onSelectCategory,
  onSelectLocation,
  onPerformSearch,
  categories,
  locationZones,
  items = [],
  onSelectItem,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = useMemo(() => {
    const list: CommandItem[] = [];

    // Quick Actions
    list.push({
      id: 'act-report-lost',
      title: 'Report Lost Item',
      subtitle: 'Create a report for misplaced or missing belongings',
      category: 'Actions',
      icon: <HelpCircle className="w-4 h-4 text-lost-text" />,
      action: () => {
        onClose();
        onOpenReport('LOST');
      },
    });

    list.push({
      id: 'act-report-found',
      title: 'Report Found Item',
      subtitle: 'Help return found campus property to its owner',
      category: 'Actions',
      icon: <PackagePlus className="w-4 h-4 text-found-text" />,
      action: () => {
        onClose();
        onOpenReport('FOUND');
      },
    });

    // Navigation Commands
    list.push({
      id: 'nav-feed',
      title: 'Go to Feed & Workspace',
      subtitle: 'Browse all active campus lost and found reports',
      category: 'Navigation',
      icon: <Search className="w-4 h-4 text-accent" />,
      action: () => {
        onClose();
        onSelectTab('feed');
      },
    });

    if (isAuthenticated) {
      list.push({
        id: 'nav-my-items',
        title: 'Open My Reports',
        subtitle: 'View items you reported on campus',
        category: 'Navigation',
        icon: <Bookmark className="w-4 h-4 text-ink-secondary" />,
        action: () => {
          onClose();
          onSelectTab('my-items');
        },
      });

      list.push({
        id: 'nav-my-claims',
        title: 'Open My Claims',
        subtitle: 'Track your ownership claims and verification status',
        category: 'Navigation',
        icon: <FileCheck className="w-4 h-4 text-ink-secondary" />,
        action: () => {
          onClose();
          onSelectTab('my-claims');
        },
      });

      if (user?.role === 'SECURITY' || user?.role === 'ADMIN') {
        list.push({
          id: 'nav-review-queue',
          title: 'Open Review Queue',
          subtitle: 'Evaluate pending ownership claims for verification',
          category: 'Navigation',
          icon: <Shield className="w-4 h-4 text-amber-600" />,
          action: () => {
            onClose();
            onSelectTab('review-claims');
          },
        });
      }

      if (user?.role === 'ADMIN') {
        list.push({
          id: 'nav-admin',
          title: 'Open Admin Console',
          subtitle: 'Governance, user management, and audit log inspection',
          category: 'Navigation',
          icon: <Shield className="w-4 h-4 text-purple-600" />,
          action: () => {
            onClose();
            onSelectTab('admin');
          },
        });
      }
    }

    // Categories
    for (const cat of categories) {
      list.push({
        id: `cat-${cat.id}`,
        title: `Filter: ${cat.name}`,
        subtitle: 'Filter reports by category',
        category: 'Categories',
        icon: getCategoryIcon(cat.name),
        action: () => {
          onClose();
          onSelectTab('feed');
          onSelectCategory(cat.id);
        },
      });
    }

    // Location Zones
    for (const zone of locationZones) {
      list.push({
        id: `loc-${zone.id}`,
        title: `Location: ${zone.name}`,
        subtitle: 'Filter reports by campus location',
        category: 'Locations',
        icon: <MapPin className="w-3.5 h-3.5 text-ink-muted" />,
        action: () => {
          onClose();
          onSelectTab('feed');
          onSelectLocation(zone.id);
        },
      });
    }

    // Feed Items matches if query exists
    if (query.trim()) {
      for (const item of items) {
        if (
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
        ) {
          list.push({
            id: `item-${item.id}`,
            title: item.title,
            subtitle: `${item.type} · ${item.location?.name || 'Campus'}`,
            category: 'Items',
            icon: (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  item.type === 'LOST'
                    ? 'bg-lost-bg text-lost-text'
                    : 'bg-found-bg text-found-text'
                }`}
              >
                {item.type}
              </span>
            ),
            action: () => {
              onClose();
              if (onSelectItem) {
                onSelectItem(item.id);
              }
            },
          });
        }
      }
    }

    return list;
  }, [
    categories,
    locationZones,
    items,
    query,
    isAuthenticated,
    user?.role,
    onClose,
    onOpenReport,
    onSelectTab,
    onSelectCategory,
    onSelectLocation,
    onSelectItem,
  ]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commands;
    }
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        } else if (query.trim()) {
          onClose();
          onSelectTab('feed');
          onPerformSearch(query.trim());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    filteredCommands,
    selectedIndex,
    query,
    onClose,
    onSelectTab,
    onPerformSearch,
  ]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-surface rounded-xl shadow-2xl border border-surface-border overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-surface-border gap-3">
          <Search className="w-4 h-4 text-ink-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search items, or filter..."
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-ink-muted hover:text-ink cursor-pointer"
              aria-label="Clear query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-secondary border border-surface-border text-[10px] font-mono text-ink-muted">
              ESC to exit
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto p-2 divide-y divide-surface-border/40"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-muted space-y-2">
              <p>No commands or items found for "{query}"</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectTab('feed');
                  onPerformSearch(query.trim());
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white font-medium text-xs hover:bg-accent-hover transition-colors cursor-pointer"
              >
                <span>Search feed for "{query}"</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  data-index={idx}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'hover:bg-surface-secondary text-ink'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-accent text-white'
                          : 'bg-surface-secondary text-ink-muted'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{cmd.title}</div>
                      {cmd.subtitle && (
                        <div className="text-[11px] text-ink-secondary truncate">
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-accent/20 text-accent'
                        : 'bg-surface-secondary text-ink-muted'
                    }`}
                  >
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-surface-border bg-surface-secondary/60 flex items-center justify-between text-[11px] text-ink-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-surface rounded border border-surface-border font-mono text-[10px]">
                ↑
              </kbd>{' '}
              <kbd className="px-1 py-0.5 bg-surface rounded border border-surface-border font-mono text-[10px]">
                ↓
              </kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-surface rounded border border-surface-border font-mono text-[10px]">
                ↵
              </kbd>{' '}
              select
            </span>
          </div>
          <span>SRM Lost &amp; Found</span>
        </div>
      </div>
    </div>
  );
};
