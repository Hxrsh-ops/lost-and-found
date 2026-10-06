package com.campus.lostfound;

import com.campus.lostfound.entity.User;
import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;
import com.campus.lostfound.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should persist user with UUID, timestamps, and default ACTIVE status")
    void shouldPersistUserSuccessfully() {
        User user = new User();
        user.setName("Harshanth");
        user.setEmail("harshanth.repo@srm.edu");
        user.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
        user.setRole(UserRole.STUDENT);

        User savedUser = userRepository.saveAndFlush(user);

        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getName()).isEqualTo("Harshanth");
        assertThat(savedUser.getEmail()).isEqualTo("harshanth.repo@srm.edu");
        assertThat(savedUser.getRole()).isEqualTo(UserRole.STUDENT);
        assertThat(savedUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();

        Optional<User> found = userRepository.findByEmail("harshanth.repo@srm.edu");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(savedUser.getId());
    }

    @Test
    @DisplayName("Should enforce unique email constraint")
    void shouldEnforceUniqueEmailConstraint() {
        User user1 = new User();
        user1.setName("User One");
        user1.setEmail("duplicate@srm.edu");
        user1.setPasswordHash("hash1");
        user1.setRole(UserRole.STUDENT);
        userRepository.saveAndFlush(user1);

        User user2 = new User();
        user2.setName("User Two");
        user2.setEmail("duplicate@srm.edu");
        user2.setPasswordHash("hash2");
        user2.setRole(UserRole.STUDENT);

        assertThatThrownBy(() -> userRepository.saveAndFlush(user2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Should correctly handle BLOCKED user status")
    void shouldHandleBlockedUserStatus() {
        User user = new User();
        user.setName("Blocked Student");
        user.setEmail("blocked@srm.edu");
        user.setPasswordHash("hash");
        user.setRole(UserRole.STUDENT);
        user.setStatus(UserStatus.BLOCKED);

        User saved = userRepository.saveAndFlush(user);
        assertThat(saved.getStatus()).isEqualTo(UserStatus.BLOCKED);
    }
}
