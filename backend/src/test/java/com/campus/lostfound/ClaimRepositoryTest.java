package com.campus.lostfound;

import com.campus.lostfound.entity.*;
import com.campus.lostfound.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ClaimRepositoryTest {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationZoneRepository locationZoneRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

    private User finder;
    private User claimant;
    private Item foundItem;

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
                null, "Finder User", "finder-claimrepo@srm.edu", "hash", UserRole.STUDENT, UserStatus.ACTIVE
        ));

        claimant = userRepository.saveAndFlush(new User(
                null, "Claimant User", "claimant-claimrepo@srm.edu", "hash", UserRole.STUDENT, UserStatus.ACTIVE
        ));

        Category category = categoryRepository.saveAndFlush(new Category(
                null, "Electronics", "Devices", true
        ));

        LocationZone location = locationZoneRepository.saveAndFlush(new LocationZone(
                null, "Canteen", "Main Food Court", true
        ));

        foundItem = itemRepository.saveAndFlush(new Item(
                null, finder, ItemType.FOUND, "Wireless Earbuds", "White case found on table",
                category, location, "Table 14", Instant.now(),
                "What is written on the back of the case?", "My initials SS"
        ));
    }

    @Test
    @DisplayName("Should persist claim in PENDING state associated with item and claimant")
    void shouldPersistPendingClaim() {
        Claim claim = new Claim(null, foundItem, claimant, "The back has initials SS engraved.");
        Claim savedClaim = claimRepository.saveAndFlush(claim);

        assertThat(savedClaim.getId()).isNotNull();
        assertThat(savedClaim.getStatus()).isEqualTo(ClaimStatus.PENDING);
        assertThat(savedClaim.getItem().getId()).isEqualTo(foundItem.getId());
        assertThat(savedClaim.getClaimant().getId()).isEqualTo(claimant.getId());
        assertThat(savedClaim.getAnswer()).isEqualTo("The back has initials SS engraved.");

        boolean existsActive = claimRepository.existsByItemIdAndClaimantIdAndStatus(
                foundItem.getId(), claimant.getId(), ClaimStatus.PENDING
        );
        assertThat(existsActive).isTrue();

        Optional<Claim> activeClaim = claimRepository.findByItemIdAndClaimantIdAndStatus(
                foundItem.getId(), claimant.getId(), ClaimStatus.PENDING
        );
        assertThat(activeClaim).isPresent();
    }
}
