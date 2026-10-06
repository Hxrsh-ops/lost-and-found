package com.campus.lostfound;

import com.campus.lostfound.entity.User;
import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;
import com.campus.lostfound.repository.AuditLogRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RbacAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String studentToken;
    private String securityToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        userRepository.deleteAll();

        User student = new User("Student User", "student.rbac@srm.edu", passwordEncoder.encode("pwd12345"), UserRole.STUDENT, UserStatus.ACTIVE);
        User savedStudent = userRepository.save(student);
        studentToken = jwtTokenProvider.generateToken(savedStudent);

        User security = new User("Security Officer", "security.rbac@srm.edu", passwordEncoder.encode("pwd12345"), UserRole.SECURITY, UserStatus.ACTIVE);
        User savedSecurity = userRepository.save(security);
        securityToken = jwtTokenProvider.generateToken(savedSecurity);

        User admin = new User("Admin User", "admin.rbac@srm.edu", passwordEncoder.encode("pwd12345"), UserRole.ADMIN, UserStatus.ACTIVE);
        User savedAdmin = userRepository.save(admin);
        adminToken = jwtTokenProvider.generateToken(savedAdmin);
    }

    @Test
    @DisplayName("Public endpoint should be accessible without token")
    void publicEndpointAccessibleWithoutToken() throws Exception {
        mockMvc.perform(get("/api/test/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Public endpoint accessible by all")));
    }

    @Test
    @DisplayName("Protected endpoint without token should return 401 Unauthorized")
    void protectedEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/test/authenticated"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("STUDENT cannot access ADMIN endpoint (403 Forbidden)")
    void studentCannotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("STUDENT cannot access SECURITY endpoint (403 Forbidden)")
    void studentCannotAccessSecurityEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/security")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("SECURITY officer cannot access ADMIN-only endpoint (403 Forbidden)")
    void securityOfficerCannotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + securityToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("SECURITY officer can access SECURITY endpoint (200 OK)")
    void securityOfficerCanAccessSecurityEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/security")
                        .header("Authorization", "Bearer " + securityToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Security access authorized")));
    }

    @Test
    @DisplayName("ADMIN can access ADMIN endpoint (200 OK)")
    void adminCanAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Admin access authorized")));
    }

    @Test
    @DisplayName("ADMIN can access SECURITY endpoint (200 OK)")
    void adminCanAccessSecurityEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/security")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Security access authorized")));
    }

    @Test
    @DisplayName("STUDENT can access STUDENT endpoint (200 OK)")
    void studentCanAccessStudentEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/student")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Student access authorized")));
    }
}
