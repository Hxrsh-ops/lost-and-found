import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AppNotification } from '../../types';
import { notificationService } from '../../services/notificationService';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Inbox,
  ShieldCheck,
  Clock,
  Check,
} from 'lucide-react';

interface NotificationDropdownProps {
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onNavigateToTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.unreadCount);
    } catch {
      // Quietly ignore background poll failures
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ page: 0, size: 20 });
      setNotifications(res.content);
      const count = res.content.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    setIsOpen(false);

    if (onNavigateToTab) {
      if (
        notification.type === 'CLAIM_SUBMITTED' ||
        notification.type === 'CLAIM_APPROVED' ||
        notification.type === 'CLAIM_REJECTED'
      ) {
        if (notification.type === 'CLAIM_SUBMITTED') {
          onNavigateToTab('review-claims');
        } else {
          onNavigateToTab('my-claims');
        }
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CLAIM_SUBMITTED':
        return (
          <div className="w-6 h-6 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Inbox className="w-3 h-3" />
          </div>
        );
      case 'CLAIM_APPROVED':
        return (
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3 h-3" />
          </div>
        );
      case 'CLAIM_REJECTED':
        return (
          <div className="w-6 h-6 rounded-md bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-3 h-3" />
          </div>
        );
      case 'ITEM_RESOLVED':
        return (
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3 h-3" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-md bg-surface-secondary text-ink-secondary flex items-center justify-center shrink-0">
            <Bell className="w-3 h-3" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative p-2 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-surface" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-surface rounded-xl shadow-xl border border-surface-border z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink text-xs">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-accent/10 text-accent">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[340px] divide-y divide-surface-border">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-ink-muted text-xs flex flex-col items-center gap-2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span>Checking notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-ink-muted text-xs flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-ink-muted">
                  <Bell className="w-4 h-4" />
                </div>
                <span>No notifications</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex gap-3 p-3 transition-colors cursor-pointer text-left ${
                    n.read ? 'hover:bg-surface-secondary' : 'bg-surface-secondary/60 hover:bg-surface-secondary'
                  }`}
                >
                  {getNotificationIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-xs truncate ${n.read ? 'font-normal text-ink' : 'font-medium text-ink'}`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-ink-secondary mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-ink-muted mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

