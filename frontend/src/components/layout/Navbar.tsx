import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  Plus,
  Bookmark,
  LogIn,
  LogOut,
  Shield,
  FileCheck,
  CheckSquare,
  User as UserIcon,
} from 'lucide-react';
import type { ItemType } from '../../types';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

export type NavTab = 'feed' | 'my-items' | 'my-claims' | 'review-claims' | 'admin';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenReport: (type?: ItemType) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenReport,
  onOpenAuth,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleReportClick = () => {
    if (!isAuthenticated) {
      onOpenAuth('login');
    } else {
      onOpenReport('LOST');
    }
  };

  const handleTabClick = (tab: NavTab) => {
    if (!isAuthenticated && tab !== 'feed') {
      onOpenAuth('login');
    } else {
      onSelectTab(tab);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-nav border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Product Identity */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => onSelectTab('feed')}
            >
              <div className="w-7 h-7 rounded-md bg-ink text-surface flex items-center justify-center text-xs font-bold">
                LF
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-ink leading-tight">
                  Lost &amp; Found
                </span>
                <span className="text-[11px] text-ink-muted leading-tight">
                  SRM Ramapuram
                </span>
              </div>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => handleTabClick('feed')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  currentTab === 'feed'
                    ? 'bg-surface-secondary text-ink font-semibold'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary/60'
                }`}
              >
                Feed
              </button>

              {isAuthenticated && (
                <>
                  <button
                    onClick={() => handleTabClick('my-items')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      currentTab === 'my-items'
                        ? 'bg-surface-secondary text-ink font-semibold'
                        : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary/60'
                    }`}
                  >
                    My Reports
                  </button>

                  <button
                    onClick={() => handleTabClick('my-claims')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      currentTab === 'my-claims'
                        ? 'bg-surface-secondary text-ink font-semibold'
                        : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary/60'
                    }`}
                  >
                    My Claims
                  </button>

                  {(user?.role === 'SECURITY' || user?.role === 'ADMIN') && (
                    <button
                      onClick={() => handleTabClick('review-claims')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        currentTab === 'review-claims'
                          ? 'bg-surface-secondary text-ink font-semibold'
                          : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary/60'
                      }`}
                    >
                      Review Queue
                    </button>
                  )}

                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleTabClick('admin')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        currentTab === 'admin'
                          ? 'bg-surface-secondary text-ink font-semibold'
                          : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary/60'
                      }`}
                    >
                      Admin
                    </button>
                  )}
                </>
              )}
            </nav>

            {/* Right: Actions & User */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleReportClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-accent hover:bg-accent-hover transition-colors shadow-subtle cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Report Item</span>
              </button>

              {isAuthenticated && (
                <NotificationDropdown onNavigateToTab={(t) => onSelectTab(t as NavTab)} />
              )}

              {isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-md hover:bg-surface-secondary transition-colors cursor-pointer"
                    aria-label="User profile menu"
                  >
                    <div className="w-7 h-7 rounded-md bg-surface-secondary border border-surface-border flex items-center justify-center text-[11px] font-semibold text-ink">
                      {getInitials(user.name)}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-52 rounded-lg bg-surface p-1.5 shadow-dropdown border border-surface-border z-50 animate-in fade-in duration-100">
                      <div className="px-2.5 py-2 border-b border-surface-border">
                        <p className="text-xs font-semibold text-ink truncate">{user.name}</p>
                        <p className="text-[11px] text-ink-secondary truncate">{user.email}</p>
                        <span className="mt-1 inline-block text-[10px] font-mono text-ink-muted uppercase">
                          {user.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            onSelectTab('my-items');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer text-left"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>My Reports</span>
                        </button>
                        <button
                          onClick={() => {
                            onSelectTab('my-claims');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer text-left"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>My Claims</span>
                        </button>
                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => {
                              onSelectTab('admin');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer text-left"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Admin</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-1 border-t border-surface-border">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-lost-text hover:bg-lost-bg transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onOpenAuth('login')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-ink bg-surface hover:bg-surface-secondary border border-surface-border transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-ink-secondary" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40">
        <div className="bg-surface/95 backdrop-blur-md rounded-xl shadow-dropdown px-2 py-1.5 flex items-center justify-around border border-surface-border">
          <button
            onClick={() => handleTabClick('feed')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-md text-[10px] font-medium transition-colors ${
              currentTab === 'feed' ? 'text-accent font-semibold' : 'text-ink-secondary'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => handleTabClick('my-items')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-md text-[10px] font-medium transition-colors ${
              currentTab === 'my-items' ? 'text-accent font-semibold' : 'text-ink-secondary'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Reports</span>
          </button>

          <button
            onClick={handleReportClick}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-white shadow-subtle -mt-3"
            aria-label="Report item"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={() => handleTabClick('my-claims')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-md text-[10px] font-medium transition-colors ${
              currentTab === 'my-claims' ? 'text-accent font-semibold' : 'text-ink-secondary'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Claims</span>
          </button>

          <button
            onClick={() => {
              if (isAuthenticated) {
                if (user?.role === 'ADMIN') {
                  handleTabClick('admin');
                } else if (user?.role === 'SECURITY') {
                  handleTabClick('review-claims');
                } else {
                  setUserDropdownOpen(!userDropdownOpen);
                }
              } else {
                onOpenAuth('login');
              }
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-md text-[10px] font-medium transition-colors ${
              currentTab === 'admin' || currentTab === 'review-claims' ? 'text-accent font-semibold' : 'text-ink-secondary'
            }`}
          >
            {user?.role === 'ADMIN' ? (
              <Shield className="w-4 h-4" />
            ) : user?.role === 'SECURITY' ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
            <span>{isAuthenticated ? (user?.role === 'ADMIN' ? 'Admin' : user?.role === 'SECURITY' ? 'Queue' : 'Account') : 'Sign In'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
