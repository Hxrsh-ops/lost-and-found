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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ItemRepositoryTest {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationZoneRepository locationZoneRepository;

    private User testReporter;
    private Category testCategory;
    private LocationZone testLocation;

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

        testReporter = userRepository.saveAndFlush(new User(
                null, "Anjankumar", "anjan@srm.edu", "hash", UserRole.STUDENT, UserStatus.ACTIVE
        ));

        testCategory = categoryRepository.saveAndFlush(new Category(
                null, "Bags & Backpacks", "Backpacks and bags", true
        ));

        testLocation = locationZoneRepository.saveAndFlush(new LocationZone(
                null, "Central Library", "Library building", true
        ));
    }

    @Test
    @DisplayName("Should persist FOUND item with relationships, images, and verification secret")
    void shouldPersistFoundItemWithImagesAndVerification() {
        Item item = new Item(
                null,
                testReporter,
                ItemType.FOUND,
                "Black Backpack",
                "Found near 2nd floor study tables",
                testCategory,
                testLocation,
                "2nd floor reading hall",
                Instant.now(),
                "What identifying mark is inside the front compartment?",
                "Small red keychain with letter A"
        );

        ItemImage image1 = new ItemImage(null, item, "items/uuid/img1.webp", "https://storage.local/img1.webp", "image/webp", 102400L, 0);
        item.addImage(image1);

        Item savedItem = itemRepository.saveAndFlush(item);

        assertThat(savedItem.getId()).isNotNull();
        assertThat(savedItem.getStatus()).isEqualTo(ItemStatus.OPEN);
        assertThat(savedItem.getType()).isEqualTo(ItemType.FOUND);
        assertThat(savedItem.getReporter().getEmail()).isEqualTo("anjan@srm.edu");
        assertThat(savedItem.getCategory().getName()).isEqualTo("Bags & Backpacks");
        assertThat(savedItem.getLocationZone().getName()).isEqualTo("Central Library");
        assertThat(savedItem.getVerificationQuestion()).isEqualTo("What identifying mark is inside the front compartment?");
        assertThat(savedItem.getVerificationAnswer()).isEqualTo("Small red keychain with letter A");
        assertThat(savedItem.getImages()).hasSize(1);
        assertThat(savedItem.getImages().get(0).getStorageKey()).isEqualTo("items/uuid/img1.webp");
    }

    @Test
    @DisplayName("Should query items by status and type with pagination")
    void shouldQueryItemsByStatusAndType() {
        Item item1 = new Item(null, testReporter, ItemType.FOUND, "Item 1", "Desc 1", testCategory, testLocation, null, Instant.now(), null, null);
        Item item2 = new Item(null, testReporter, ItemType.LOST, "Item 2", "Desc 2", testCategory, testLocation, null, Instant.now(), null, null);

        itemRepository.saveAndFlush(item1);
        itemRepository.saveAndFlush(item2);

        Page<Item> foundItems = itemRepository.findByStatusAndType(ItemStatus.OPEN, ItemType.FOUND, PageRequest.of(0, 10));
        assertThat(foundItems.getContent()).hasSize(1);
        assertThat(foundItems.getContent().get(0).getTitle()).isEqualTo("Item 1");
    }
}
