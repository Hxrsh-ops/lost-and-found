import { apiClient } from './apiClient';
import type { AppNotification, PaginatedResponse } from '../types';

export const notificationService = {
  async getNotifications(params?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<AppNotification>> {
    return apiClient.get<PaginatedResponse<AppNotification>>(
      '/notifications',
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
  },

  async markAsRead(notificationId: string): Promise<AppNotification> {
    return apiClient.patch<AppNotification>(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    return apiClient.patch<void>('/notifications/read-all');
  },
};
