package com.campus.lostfound;

import com.campus.lostfound.dto.auth.LoginRequest;
import com.campus.lostfound.dto.auth.RegisterRequest;
import com.campus.lostfound.entity.User;
import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;
import com.campus.lostfound.repository.AuditLogRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.security.JwtTokenProvider;
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
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

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

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void cleanDatabase() {
        auditLogRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully register a new student and return JWT token without exposing password hash")
    void shouldRegisterNewStudentSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest("Harshanth", "harshanth@srm.edu", "StrongPassword123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.id", notNullValue()))
                .andExpect(jsonPath("$.user.name", is("Harshanth")))
                .andExpect(jsonPath("$.user.email", is("harshanth@srm.edu")))
                .andExpect(jsonPath("$.user.role", is("STUDENT")))
                .andExpect(jsonPath("$.user.status", is("ACTIVE")))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());

        User saved = userRepository.findByEmail("harshanth@srm.edu").orElse(null);
        assertNotNull(saved);
        assertTrue(passwordEncoder.matches("StrongPassword123!", saved.getPasswordHash()));
    }

    @Test
    @DisplayName("Should reject registration with duplicate email with 409 Conflict")
    void shouldRejectDuplicateEmailRegistration() throws Exception {
        User existing = new User("Existing User", "existing@srm.edu", passwordEncoder.encode("pwd12345"), UserRole.STUDENT, UserStatus.ACTIVE);
        userRepository.save(existing);

        RegisterRequest request = new RegisterRequest("Duplicate User", "existing@srm.edu", "AnotherPassword123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("Should reject invalid registration payloads with 400 Bad Request")
    void shouldRejectInvalidRegistrationPayloads() throws Exception {
        // Invalid email, short password, empty name
        RegisterRequest request = new RegisterRequest("", "invalid-email-format", "short");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.name", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.email", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.password", notNullValue()));
    }

    @Test
    @DisplayName("Should successfully login with valid credentials")
    void shouldLoginSuccessfully() throws Exception {
        User user = new User("Test Student", "student@srm.edu", passwordEncoder.encode("SecretPass123!"), UserRole.STUDENT, UserStatus.ACTIVE);
        userRepository.save(user);

        LoginRequest request = new LoginRequest("student@srm.edu", "SecretPass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("student@srm.edu")))
                .andExpect(jsonPath("$.user.role", is("STUDENT")))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("Should reject login with wrong password without leaking user details")
    void shouldRejectWrongPassword() throws Exception {
        User user = new User("Test Student", "student@srm.edu", passwordEncoder.encode("SecretPass123!"), UserRole.STUDENT, UserStatus.ACTIVE);
        userRepository.save(user);

        LoginRequest request = new LoginRequest("student@srm.edu", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("Should reject login for non-existent account with generic 401 to prevent enumeration")
    void shouldRejectNonExistentAccount() throws Exception {
        LoginRequest request = new LoginRequest("nonexistent@srm.edu", "AnyPassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("Should reject login for BLOCKED account with 403 Forbidden")
    void shouldRejectBlockedUserLogin() throws Exception {
        User user = new User("Blocked Student", "blocked@srm.edu", passwordEncoder.encode("SecretPass123!"), UserRole.STUDENT, UserStatus.BLOCKED);
        userRepository.save(user);

        LoginRequest request = new LoginRequest("blocked@srm.edu", "SecretPass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("blocked")));
    }

    @Test
    @DisplayName("Should reject unauthenticated access to /api/auth/me with 401")
    void shouldRejectUnauthenticatedMe() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("Should return authenticated user profile for /api/auth/me with valid Bearer token")
    void shouldReturnUserProfileWithValidToken() throws Exception {
        User user = new User("Harshanth", "harshanth@srm.edu", passwordEncoder.encode("SecretPass123!"), UserRole.STUDENT, UserStatus.ACTIVE);
        User saved = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(saved);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(saved.getId().toString())))
                .andExpect(jsonPath("$.name", is("Harshanth")))
                .andExpect(jsonPath("$.email", is("harshanth@srm.edu")))
                .andExpect(jsonPath("$.role", is("STUDENT")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("Should reject /api/auth/me if user becomes BLOCKED after token was issued")
    void shouldRejectBlockedUserWithValidToken() throws Exception {
        User user = new User("Harshanth", "harshanth@srm.edu", passwordEncoder.encode("SecretPass123!"), UserRole.STUDENT, UserStatus.BLOCKED);
        User saved = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(saved);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }
}
