package com.campus.lostfound.service;

import com.campus.lostfound.dto.NotificationDto;
import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.entity.Notification;
import com.campus.lostfound.entity.NotificationType;
import com.campus.lostfound.entity.User;

import java.util.UUID;

public interface NotificationService {

    Notification createNotification(User user, NotificationType type, String title, String message);

    PageResponse<NotificationDto> getUserNotifications(String userEmail, Boolean unreadOnly, int page, int size);

    NotificationDto markAsRead(UUID notificationId, String userEmail);

    void markAllAsRead(String userEmail);

    long getUnreadCount(String userEmail);
}
