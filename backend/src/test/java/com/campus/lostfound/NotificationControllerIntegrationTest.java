package com.campus.lostfound;

import com.campus.lostfound.entity.*;
import com.campus.lostfound.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationZoneRepository locationZoneRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User user1;
    private User user2;
    private String user1Token;
    private String user2Token;

    @BeforeEach
    void setUp() throws Exception {
        claimRepository.deleteAll();
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        itemImageRepository.deleteAll();
        itemRepository.deleteAll();
        categoryRepository.deleteAll();
        locationZoneRepository.deleteAll();
        userRepository.deleteAll();

        user1 = userRepository.save(new User(null, "User One", "user1@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.STUDENT, UserStatus.ACTIVE));
        user2 = userRepository.save(new User(null, "User Two", "user2@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.STUDENT, UserStatus.ACTIVE));

        user1Token = obtainJwt("user1@srm.edu", "Password123!");
        user2Token = obtainJwt("user2@srm.edu", "Password123!");
    }

    private String obtainJwt(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    @Test
    @DisplayName("User can retrieve their own notifications and unread count")
    void testGetNotifications() throws Exception {
        notificationRepository.save(new Notification(null, user1, NotificationType.CLAIM_SUBMITTED, "Title 1", "Message 1"));
        notificationRepository.save(new Notification(null, user1, NotificationType.CLAIM_APPROVED, "Title 2", "Message 2"));
        notificationRepository.save(new Notification(null, user2, NotificationType.CLAIM_REJECTED, "Title 3", "Message 3"));

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(2));

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(2));
    }

    @Test
    @DisplayName("User can mark a notification as read")
    void testMarkAsRead() throws Exception {
        Notification n = notificationRepository.save(new Notification(null, user1, NotificationType.CLAIM_SUBMITTED, "Title", "Message"));

        mockMvc.perform(patch("/api/notifications/" + n.getId() + "/read")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true))
                .andExpect(jsonPath("$.readAt").isNotEmpty());

        Notification updated = notificationRepository.findById(n.getId()).orElseThrow();
        assertTrue(updated.isRead());
    }

    @Test
    @DisplayName("User cannot mark another user's notification as read")
    void testCannotMarkOtherUserNotificationAsRead() throws Exception {
        Notification n = notificationRepository.save(new Notification(null, user2, NotificationType.CLAIM_SUBMITTED, "Title", "Message"));

        mockMvc.perform(patch("/api/notifications/" + n.getId() + "/read")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User can mark all notifications as read")
    void testMarkAllAsRead() throws Exception {
        notificationRepository.save(new Notification(null, user1, NotificationType.CLAIM_SUBMITTED, "Title 1", "Message 1"));
        notificationRepository.save(new Notification(null, user1, NotificationType.CLAIM_APPROVED, "Title 2", "Message 2"));

        mockMvc.perform(patch("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk());

        assertEquals(0, notificationRepository.countByUserIdAndReadFalse(user1.getId()));
    }
}
