package com.campus.lostfound;

import com.campus.lostfound.entity.User;
import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;
import com.campus.lostfound.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final String testSecret = "dGhpcy1pcy1hLXRlc3Qtand0LXNlY3JldC1rZXktZm9yLXVuaXQtdGVzdGluZy0yMDI2";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(testSecret, 3600000); // 1 hour
    }

    @Test
    @DisplayName("Should generate and validate a valid JWT token")
    void shouldGenerateAndValidateValidToken() {
        User user = new User("Test Student", "student@srm.edu", "hashed_pwd", UserRole.STUDENT, UserStatus.ACTIVE);
        UUID userId = UUID.randomUUID();
        user.setId(userId);

        String token = tokenProvider.generateToken(user);
        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));

        assertEquals(userId, tokenProvider.getUserIdFromToken(token));
        assertEquals("student@srm.edu", tokenProvider.getEmailFromToken(token));
        assertEquals("STUDENT", tokenProvider.getRoleFromToken(token));
    }

    @Test
    @DisplayName("Should reject malformed JWT token")
    void shouldRejectMalformedToken() {
        assertFalse(tokenProvider.validateToken("invalid.token.structure"));
    }

    @Test
    @DisplayName("Should reject token signed with a different key")
    void shouldRejectTokenWithDifferentSecret() {
        JwtTokenProvider attackerProvider = new JwtTokenProvider("YXR0YWNrZXItc2VjcmV0LWtleS1mb3ItZm9yZ2luZy10b2tlbnMtMjAyNg==", 3600000);
        User user = new User("Attacker", "attacker@srm.edu", "pwd", UserRole.ADMIN, UserStatus.ACTIVE);
        user.setId(UUID.randomUUID());

        String forgedToken = attackerProvider.generateToken(user);
        assertFalse(tokenProvider.validateToken(forgedToken));
    }

    @Test
    @DisplayName("Should reject expired JWT token")
    void shouldRejectExpiredToken() {
        JwtTokenProvider expiredTokenProvider = new JwtTokenProvider(testSecret, -1000); // Expired 1 second ago
        User user = new User("Expired User", "expired@srm.edu", "pwd", UserRole.STUDENT, UserStatus.ACTIVE);
        user.setId(UUID.randomUUID());

        String token = expiredTokenProvider.generateToken(user);
        assertFalse(tokenProvider.validateToken(token));
    }
}
