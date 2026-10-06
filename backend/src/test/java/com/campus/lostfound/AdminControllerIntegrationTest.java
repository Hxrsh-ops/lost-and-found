package com.campus.lostfound;

import com.campus.lostfound.dto.admin.UpdateUserRoleRequest;
import com.campus.lostfound.dto.admin.UpdateUserStatusRequest;
import com.campus.lostfound.entity.*;
import com.campus.lostfound.repository.*;
import com.campus.lostfound.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationZoneRepository locationZoneRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User admin;
    private User securityUser;
    private User student;
    private String adminToken;
    private String securityToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        claimRepository.deleteAll();
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        itemImageRepository.deleteAll();
        itemRepository.deleteAll();
        categoryRepository.deleteAll();
        locationZoneRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.saveAndFlush(new User(
                null, "Campus Admin", "admin-ctrl@srm.edu", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
                UserRole.ADMIN, UserStatus.ACTIVE
        ));

        securityUser = userRepository.saveAndFlush(new User(
                null, "Campus Security", "security-ctrl@srm.edu", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
                UserRole.SECURITY, UserStatus.ACTIVE
        ));

        student = userRepository.saveAndFlush(new User(
                null, "Student User", "student-ctrl@srm.edu", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
                UserRole.STUDENT, UserStatus.ACTIVE
        ));

        adminToken = jwtTokenProvider.generateToken(admin);
        securityToken = jwtTokenProvider.generateToken(securityUser);
        studentToken = jwtTokenProvider.generateToken(student);
    }

    @Test
    @DisplayName("Admin can list users with pagination and search")
    void adminCanListUsers() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", "Student")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].email", is(student.getEmail())))
                .andExpect(jsonPath("$.content[0].passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("Student receives 403 Forbidden on /api/admin/users")
    void studentCannotAccessAdminUsers() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security user receives 403 Forbidden on /api/admin/users")
    void securityCannotAccessAdminUsers() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + securityToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can block and unblock a student, recording audit logs")
    void adminCanBlockAndUnblockUser() throws Exception {
        // 1. Block user
        UpdateUserStatusRequest blockReq = new UpdateUserStatusRequest(UserStatus.BLOCKED);

        mockMvc.perform(patch("/api/admin/users/" + student.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("BLOCKED")));

        User blocked = userRepository.findById(student.getId()).orElseThrow();
        assertThat(blocked.getStatus()).isEqualTo(UserStatus.BLOCKED);

        // Verify audit log
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        assertThat(auditLogs).anyMatch(a -> a.getAction() == AuditAction.USER_BLOCKED && a.getEntityId().equals(student.getId()));

        // 2. Unblock user
        UpdateUserStatusRequest unblockReq = new UpdateUserStatusRequest(UserStatus.ACTIVE);

        mockMvc.perform(patch("/api/admin/users/" + student.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unblockReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")));

        User unblocked = userRepository.findById(student.getId()).orElseThrow();
        assertThat(unblocked.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("Self-protection: Admin cannot block their own account")
    void adminCannotBlockOwnAccount() throws Exception {
        UpdateUserStatusRequest blockReq = new UpdateUserStatusRequest(UserStatus.BLOCKED);

        mockMvc.perform(patch("/api/admin/users/" + admin.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot block their own account")));
    }

    @Test
    @DisplayName("Admin can change user role, recording audit log")
    void adminCanChangeUserRole() throws Exception {
        UpdateUserRoleRequest roleReq = new UpdateUserRoleRequest(UserRole.SECURITY);

        mockMvc.perform(patch("/api/admin/users/" + student.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("SECURITY")));

        User updated = userRepository.findById(student.getId()).orElseThrow();
        assertThat(updated.getRole()).isEqualTo(UserRole.SECURITY);

        List<AuditLog> auditLogs = auditLogRepository.findAll();
        assertThat(auditLogs).anyMatch(a -> a.getAction() == AuditAction.ROLE_CHANGED && a.getEntityId().equals(student.getId()));
    }

    @Test
    @DisplayName("Self-protection: Admin cannot demote their own role")
    void adminCannotDemoteOwnRole() throws Exception {
        UpdateUserRoleRequest roleReq = new UpdateUserRoleRequest(UserRole.STUDENT);

        mockMvc.perform(patch("/api/admin/users/" + admin.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot remove their own administrative role")));
    }

    @Test
    @DisplayName("Admin can view audit logs and filter by action")
    void adminCanViewAuditLogs() throws Exception {
        AuditLog audit = new AuditLog(admin, AuditAction.ADMIN_ACTION, "SYSTEM", admin.getId(), "{\"note\":\"System check\"}");
        auditLogRepository.saveAndFlush(audit);

        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("action", "ADMIN_ACTION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", not(empty())))
                .andExpect(jsonPath("$.content[0].action", is("ADMIN_ACTION")))
                .andExpect(jsonPath("$.content[0].actorEmail", is(admin.getEmail())));
    }

    @Test
    @DisplayName("Student cannot view audit logs (403 Forbidden)")
    void studentCannotViewAuditLogs() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can archive an item manually and receive 200 OK")
    void adminCanArchiveItem() throws Exception {
        Category category = categoryRepository.saveAndFlush(new Category(null, "Electronics", "Devices", true));
        LocationZone location = locationZoneRepository.saveAndFlush(new LocationZone(null, "Library", "Main", true));
        Item item = itemRepository.saveAndFlush(new Item(
                null, student, ItemType.LOST, "Blue Notebook", "Notes", category, location, "Desk 1", Instant.now(), null, null
        ));

        mockMvc.perform(post("/api/admin/items/" + item.getId() + "/archive")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ARCHIVED")));

        Item refreshed = itemRepository.findById(item.getId()).orElseThrow();
        assertThat(refreshed.getStatus()).isEqualTo(ItemStatus.ARCHIVED);
    }

    @Test
    @DisplayName("Security: Blocked user existing JWT is immediately denied item creation")
    void blockedUserExistingJwtCannotCreateItem() throws Exception {
        Category category = categoryRepository.saveAndFlush(new Category(null, "Electronics", "Devices", true));
        LocationZone location = locationZoneRepository.saveAndFlush(new LocationZone(null, "Library", "Main", true));

        // 1. Admin blocks the student
        student.setStatus(UserStatus.BLOCKED);
        userRepository.saveAndFlush(student);

        // 2. Student attempts to create an item using their existing JWT
        String itemPayload = "{" +
                "\"type\":\"LOST\"," +
                "\"title\":\"Black Umbrella\"," +
                "\"description\":\"Left in hall\"," +
                "\"categoryId\":\"" + category.getId() + "\"," +
                "\"locationZoneId\":\"" + location.getId() + "\"," +
                "\"locationDetail\":\"Auditorium\"" +
                "}";

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(itemPayload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security: Blocked user existing JWT is immediately denied claim submission")
    void blockedUserExistingJwtCannotSubmitClaim() throws Exception {
        Category category = categoryRepository.saveAndFlush(new Category(null, "Electronics", "Devices", true));
        LocationZone location = locationZoneRepository.saveAndFlush(new LocationZone(null, "Library", "Main", true));
        Item foundItem = itemRepository.saveAndFlush(new Item(
                null, admin, ItemType.FOUND, "Calculus Textbook", "Math book", category, location, "Desk 4", Instant.now(), "What edition?", "9th"
        ));

        // 1. Admin blocks student
        student.setStatus(UserStatus.BLOCKED);
        userRepository.saveAndFlush(student);

        // 2. Blocked student attempts to submit claim with existing JWT
        String claimPayload = "{\"verificationAnswer\":\"9th\"}";

        mockMvc.perform(post("/api/items/" + foundItem.getId() + "/claims")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(claimPayload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security: Role change takes effect immediately without restart or re-login")
    void roleChangeTakesEffectImmediatelyWithoutRestart() throws Exception {
        // 1. Student initially gets 403 on security-gated endpoint
        mockMvc.perform(get("/api/test/security")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        // 2. Admin promotes student to SECURITY
        UpdateUserRoleRequest roleReq = new UpdateUserRoleRequest(UserRole.SECURITY);
        mockMvc.perform(patch("/api/admin/users/" + student.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("SECURITY")));

        // 3. Same student token now immediately succeeds on security-gated endpoint
        mockMvc.perform(get("/api/test/security")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Security access authorized")));
    }

    @Test
    @DisplayName("Security: Blocked user promoted to SECURITY remains blocked and denied")
    void blockedUserRoleChangeStillDenied() throws Exception {
        // 1. Block student
        student.setStatus(UserStatus.BLOCKED);
        userRepository.saveAndFlush(student);

        // 2. Admin promotes to SECURITY
        UpdateUserRoleRequest roleReq = new UpdateUserRoleRequest(UserRole.SECURITY);
        mockMvc.perform(patch("/api/admin/users/" + student.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("SECURITY")))
                .andExpect(jsonPath("$.status", is("BLOCKED")));

        // 3. Blocked user still receives 401 on protected requests
        mockMvc.perform(get("/api/test/security")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isUnauthorized());
    }
}
