package com.campus.lostfound;

import com.campus.lostfound.entity.AuditAction;
import com.campus.lostfound.entity.AuditLog;
import com.campus.lostfound.entity.User;
import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;
import com.campus.lostfound.repository.AuditLogRepository;
import com.campus.lostfound.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuditLogRepositoryTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should persist audit record with actor, action, entity details, and non-secret metadata")
    void shouldPersistAuditLog() {
        User admin = userRepository.saveAndFlush(new User(
                null, "Admin User", "admin@srm.edu", "hash", UserRole.ADMIN, UserStatus.ACTIVE
        ));

        UUID targetItemId = UUID.randomUUID();
        AuditLog log = new AuditLog(
                null, admin, AuditAction.ITEM_CREATED, "ITEM", targetItemId,
                "{\"type\":\"FOUND\",\"title\":\"Black Backpack\"}"
        );
        AuditLog savedLog = auditLogRepository.saveAndFlush(log);

        assertThat(savedLog.getId()).isNotNull();
        assertThat(savedLog.getActorUser().getId()).isEqualTo(admin.getId());
        assertThat(savedLog.getAction()).isEqualTo(AuditAction.ITEM_CREATED);
        assertThat(savedLog.getEntityType()).isEqualTo("ITEM");
        assertThat(savedLog.getEntityId()).isEqualTo(targetItemId);
        assertThat(savedLog.getCreatedAt()).isNotNull();

        Page<AuditLog> results = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                "ITEM", targetItemId, PageRequest.of(0, 10)
        );
        assertThat(results.getContent()).hasSize(1);
    }
}
