package com.campus.lostfound;

import com.campus.lostfound.dto.CreateClaimRequest;
import com.campus.lostfound.entity.*;
import com.campus.lostfound.exception.ConflictException;
import com.campus.lostfound.repository.*;
import com.campus.lostfound.service.ArchivalService;
import com.campus.lostfound.service.ClaimService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.lifecycle.archive-after-days=30"
})
@Transactional
class ArchivalServiceIntegrationTest {

    @Autowired
    private ArchivalService archivalService;

    @Autowired
    private ClaimService claimService;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationZoneRepository locationZoneRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

    private User finder;
    private User claimant;
    private User admin;
    private Category category;
    private LocationZone location;

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

        finder = userRepository.saveAndFlush(new User(
                null, "Finder User", "finder-archival@srm.edu", "hash", UserRole.STUDENT, UserStatus.ACTIVE
        ));

        claimant = userRepository.saveAndFlush(new User(
                null, "Claimant User", "claimant-archival@srm.edu", "hash", UserRole.STUDENT, UserStatus.ACTIVE
        ));

        admin = userRepository.saveAndFlush(new User(
                null, "Admin User", "admin-archival@srm.edu", "hash", UserRole.ADMIN, UserStatus.ACTIVE
        ));

        category = categoryRepository.saveAndFlush(new Category(
                null, "Electronics", "Devices", true
        ));

        location = locationZoneRepository.saveAndFlush(new LocationZone(
                null, "Library", "Central Library", true
        ));
    }

    @Test
    @DisplayName("Should archive items older than 30 days and leave newer items OPEN")
    void shouldArchiveEligibleItemsOnly() {
        // Old item (40 days old)
        Item oldItem = new Item(
                null, finder, ItemType.FOUND, "Old Umbrella", "Found on bench",
                category, location, "Bench 2", Instant.now().minus(40, ChronoUnit.DAYS),
                "Color of handle?", "Brown wood"
        );
        oldItem.setCreatedAt(Instant.now().minus(40, ChronoUnit.DAYS));
        final Item savedOld = itemRepository.saveAndFlush(oldItem);

        // Recent item (5 days old)
        Item recentItem = new Item(
                null, finder, ItemType.FOUND, "Recent Water Bottle", "Blue bottle",
                category, location, "Desk 4", Instant.now().minus(5, ChronoUnit.DAYS),
                null, null
        );
        recentItem.setCreatedAt(Instant.now().minus(5, ChronoUnit.DAYS));
        final Item savedRecent = itemRepository.saveAndFlush(recentItem);

        // Execute archival
        int archivedCount = archivalService.archiveEligibleItems();

        assertThat(archivedCount).isEqualTo(1);

        Item refreshedOld = itemRepository.findById(savedOld.getId()).orElseThrow();
        assertThat(refreshedOld.getStatus()).isEqualTo(ItemStatus.ARCHIVED);
        assertThat(refreshedOld.getArchivedAt()).isNotNull();

        Item refreshedRecent = itemRepository.findById(savedRecent.getId()).orElseThrow();
        assertThat(refreshedRecent.getStatus()).isEqualTo(ItemStatus.OPEN);
        assertThat(refreshedRecent.getArchivedAt()).isNull();

        // Check audit log
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        assertThat(auditLogs).anyMatch(a -> a.getAction() == AuditAction.ITEM_ARCHIVED && a.getEntityId().equals(savedOld.getId()));
    }

    @Test
    @DisplayName("Archival job should be idempotent and safe to run multiple times")
    void shouldBeIdempotentOnRepeatedRuns() {
        Item oldItem = new Item(
                null, finder, ItemType.FOUND, "Old Calculator", "Casio calculator",
                category, location, "Room 302", Instant.now().minus(35, ChronoUnit.DAYS),
                null, null
        );
        oldItem.setCreatedAt(Instant.now().minus(35, ChronoUnit.DAYS));
        final Item savedOld = itemRepository.saveAndFlush(oldItem);

        int firstRun = archivalService.archiveEligibleItems();
        assertThat(firstRun).isEqualTo(1);

        int secondRun = archivalService.archiveEligibleItems();
        assertThat(secondRun).isEqualTo(0);

        Item refreshed = itemRepository.findById(savedOld.getId()).orElseThrow();
        assertThat(refreshed.getStatus()).isEqualTo(ItemStatus.ARCHIVED);
    }

    @Test
    @DisplayName("Archived items cannot receive claims")
    void archivedItemsCannotReceiveClaims() {
        Item oldItem = new Item(
                null, finder, ItemType.FOUND, "Old Headphones", "Black headphones",
                category, location, "Gym", Instant.now().minus(35, ChronoUnit.DAYS),
                "Brand name?", "Sony"
        );
        oldItem.setCreatedAt(Instant.now().minus(35, ChronoUnit.DAYS));
        final Item savedOld = itemRepository.saveAndFlush(oldItem);

        archivalService.archiveEligibleItems();

        CreateClaimRequest request = new CreateClaimRequest("Sony WH-1000XM4");

        assertThatThrownBy(() -> claimService.createClaim(savedOld.getId(), request, claimant.getEmail()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ARCHIVED");
    }

    @Test
    @DisplayName("Admin manual archival should archive item and create audit record")
    void adminCanManuallyArchiveItem() {
        Item item = itemRepository.saveAndFlush(new Item(
                null, finder, ItemType.LOST, "My Lost Wallet", "Leather wallet",
                category, location, "Cafeteria", Instant.now(), null, null
        ));

        archivalService.manuallyArchiveItem(item.getId(), admin.getEmail());

        Item refreshed = itemRepository.findById(item.getId()).orElseThrow();
        assertThat(refreshed.getStatus()).isEqualTo(ItemStatus.ARCHIVED);
        assertThat(refreshed.getArchivedAt()).isNotNull();

        List<AuditLog> auditLogs = auditLogRepository.findAll();
        assertThat(auditLogs).anyMatch(a -> a.getAction() == AuditAction.ITEM_ARCHIVED
                && a.getActorUser() != null && a.getActorUser().getId().equals(admin.getId()));
    }
}
