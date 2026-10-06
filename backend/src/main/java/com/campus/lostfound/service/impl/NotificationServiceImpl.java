package com.campus.lostfound.service.impl;

import com.campus.lostfound.dto.NotificationDto;
import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.entity.Notification;
import com.campus.lostfound.entity.NotificationType;
import com.campus.lostfound.entity.User;
import com.campus.lostfound.exception.ForbiddenException;
import com.campus.lostfound.exception.ResourceNotFoundException;
import com.campus.lostfound.repository.NotificationRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Notification createNotification(User user, NotificationType type, String title, String message) {
        Notification notification = new Notification(null, user, type, title, message);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> getUserNotifications(String userEmail, Boolean unreadOnly, int page, int size) {
        User user = findUserByEmail(userEmail);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));

        Page<Notification> notificationPage;
        if (Boolean.TRUE.equals(unreadOnly)) {
            notificationPage = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(user.getId(), false, pageable);
        } else {
            notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        }

        List<NotificationDto> content = notificationPage.getContent().stream()
                .map(this::mapToDto)
                .toList();

        return new PageResponse<>(
                content,
                notificationPage.getNumber(),
                notificationPage.getSize(),
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages(),
                notificationPage.isFirst(),
                notificationPage.isLast()
        );
    }

    @Override
    public NotificationDto markAsRead(UUID notificationId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You are not authorized to access this notification");
        }

        if (!notification.isRead()) {
            notification.markAsRead();
            notification = notificationRepository.save(notification);
        }

        return mapToDto(notification);
    }

    @Override
    public void markAllAsRead(String userEmail) {
        User user = findUserByEmail(userEmail);
        Pageable pageable = PageRequest.of(0, 100);
        Page<Notification> unreadPage = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(user.getId(), false, pageable);
        while (unreadPage.hasContent()) {
            for (Notification n : unreadPage.getContent()) {
                n.markAsRead();
            }
            notificationRepository.saveAll(unreadPage.getContent());
            if (unreadPage.hasNext()) {
                unreadPage = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(user.getId(), false, unreadPage.nextPageable());
            } else {
                break;
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = findUserByEmail(userEmail);
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private NotificationDto mapToDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt(),
                n.getReadAt()
        );
    }
}
