package com.campus.lostfound;

import com.campus.lostfound.entity.Notification;
import com.campus.lostfound.entity.NotificationType;
import com.campus.lostfound.entity.User;
import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;
import com.campus.lostfound.repository.NotificationRepository;
import com.campus.lostfound.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NotificationRepositoryTest {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    private User recipient;

    @BeforeEach
    void setUp() {
        recipient = userRepository.saveAndFlush(new User(
                null, "Siddarth", "siddarth@srm.edu", "hash", UserRole.STUDENT, UserStatus.ACTIVE
        ));
    }

    @Test
    @DisplayName("Should persist notification scoped to user and track unread status")
    void shouldPersistAndQueryNotifications() {
        Notification notification = new Notification(
                null, recipient, NotificationType.CLAIM_SUBMITTED,
                "New Claim Received", "A student submitted a claim for your found item."
        );
        notificationRepository.saveAndFlush(notification);

        long unreadCount = notificationRepository.countByUserIdAndReadFalse(recipient.getId());
        assertThat(unreadCount).isEqualTo(1L);

        Page<Notification> userNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(
                recipient.getId(), PageRequest.of(0, 10)
        );
        assertThat(userNotifications.getContent()).hasSize(1);
        assertThat(userNotifications.getContent().get(0).getType()).isEqualTo(NotificationType.CLAIM_SUBMITTED);
        assertThat(userNotifications.getContent().get(0).isRead()).isFalse();

        // Mark as read
        Notification toUpdate = userNotifications.getContent().get(0);
        toUpdate.markAsRead();
        notificationRepository.saveAndFlush(toUpdate);

        assertThat(notificationRepository.countByUserIdAndReadFalse(recipient.getId())).isEqualTo(0L);
    }
}
