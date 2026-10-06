package com.campus.lostfound;

import com.campus.lostfound.dto.item.CreateItemRequest;
import com.campus.lostfound.dto.item.UpdateItemRequest;
import com.campus.lostfound.entity.Category;
import com.campus.lostfound.entity.Item;
import com.campus.lostfound.entity.ItemStatus;
import com.campus.lostfound.entity.ItemType;
import com.campus.lostfound.entity.LocationZone;
import com.campus.lostfound.entity.User;
import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ItemControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private User studentA;
    private User studentB;
    private User blockedStudent;
    private String tokenA;
    private String tokenB;
    private String tokenBlocked;
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

        studentA = userRepository.save(new User("Student A", "student.a@srm.edu", passwordEncoder.encode("pass1234"), UserRole.STUDENT, UserStatus.ACTIVE));
        studentB = userRepository.save(new User("Student B", "student.b@srm.edu", passwordEncoder.encode("pass1234"), UserRole.STUDENT, UserStatus.ACTIVE));
        blockedStudent = userRepository.save(new User("Blocked User", "blocked.student@srm.edu", passwordEncoder.encode("pass1234"), UserRole.STUDENT, UserStatus.BLOCKED));

        tokenA = jwtTokenProvider.generateToken(studentA);
        tokenB = jwtTokenProvider.generateToken(studentB);
        tokenBlocked = jwtTokenProvider.generateToken(blockedStudent);

        testCategory = categoryRepository.save(new Category(UUID.randomUUID(), "Electronics", "Laptops, phones, chargers", true));
        testLocation = locationZoneRepository.save(new LocationZone(UUID.randomUUID(), "Central Library", "Main library building and reading halls", true));
    }

    @Test
    @DisplayName("Should successfully create a LOST item report with default OPEN status")
    void shouldCreateLostItemSuccessfully() throws Exception {
        CreateItemRequest request = new CreateItemRequest(
                ItemType.LOST,
                "Silver Dell XPS Laptop",
                "Left it on the second floor study table near the charging port.",
                testCategory.getId(),
                testLocation.getId(),
                "2nd Floor Desk 4B",
                Instant.now(),
                null,
                null
        );

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("Silver Dell XPS Laptop")))
                .andExpect(jsonPath("$.type", is("LOST")))
                .andExpect(jsonPath("$.status", is("OPEN")))
                .andExpect(jsonPath("$.category.name", is("Electronics")))
                .andExpect(jsonPath("$.location.name", is("Central Library")))
                .andExpect(jsonPath("$.reporterId", is(studentA.getId().toString())))
                .andExpect(jsonPath("$.isOwner", is(true)))
                .andExpect(jsonPath("$.verificationAnswer").doesNotExist());
    }

    @Test
    @DisplayName("Should create FOUND item with verification question and NEVER expose verification answer in response")
    void shouldCreateFoundItemAndNeverExposeVerificationAnswer() throws Exception {
        CreateItemRequest request = new CreateItemRequest(
                ItemType.FOUND,
                "Blue Hydro Flask Bottle",
                "Found a blue water bottle on the library bench.",
                testCategory.getId(),
                testLocation.getId(),
                "Ground Floor Bench",
                Instant.now(),
                "What sticker is placed on the side of the bottle?",
                "NASA logo sticker with slight scratches"
        );

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.verificationRequired", is(true)))
                .andExpect(jsonPath("$.verificationQuestion", is("What sticker is placed on the side of the bottle?")))
                .andExpect(jsonPath("$.verificationAnswer").doesNotExist());

        // Verify that database holds the answer securely
        Item saved = itemRepository.findAll().get(0);
        assertEquals("NASA logo sticker with slight scratches", saved.getVerificationAnswer());
    }

    @Test
    @DisplayName("Should reject unauthenticated item creation with 401")
    void shouldRejectUnauthenticatedItemCreation() throws Exception {
        CreateItemRequest request = new CreateItemRequest(
                ItemType.LOST,
                "Keys with red tag",
                "Lost keys somewhere near canteen.",
                testCategory.getId(),
                testLocation.getId(),
                "Canteen",
                Instant.now(),
                null,
                null
        );

        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should reject item creation by BLOCKED user with 401/403")
    void shouldRejectBlockedUserItemCreation() throws Exception {
        CreateItemRequest request = new CreateItemRequest(
                ItemType.LOST,
                "Black Wallet",
                "Lost black wallet with student ID card.",
                testCategory.getId(),
                testLocation.getId(),
                "Hostel Lobby",
                Instant.now(),
                null,
                null
        );

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + tokenBlocked)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Public browse /api/items should paginate and never reveal verification answers")
    void shouldBrowseItemsPubliclyWithoutVerificationAnswer() throws Exception {
        Item item = new Item(
                studentA,
                ItemType.FOUND,
                "Sony Headphones",
                "Found black over-ear headphones in the library.",
                testCategory,
                testLocation,
                "Desk 10",
                Instant.now(),
                "What color is the audio cable?",
                "Gold-plated braided black cable"
        );
        itemRepository.save(item);

        mockMvc.perform(get("/api/items?type=FOUND&page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].title", is("Sony Headphones")))
                .andExpect(jsonPath("$.content[0].verificationRequired", is(true)))
                .andExpect(jsonPath("$.content[0].verificationAnswer").doesNotExist())
                .andExpect(jsonPath("$.content[0].category.name", is("Electronics")));
    }

    @Test
    @DisplayName("Search /api/items?search=... should find item by keyword in title/desc")
    void shouldSearchItemsByKeyword() throws Exception {
        itemRepository.save(new Item(studentA, ItemType.LOST, "Titan Watch", "Black leather strap watch lost near gym", testCategory, testLocation, "Gym Entrance", Instant.now(), null, null));
        itemRepository.save(new Item(studentB, ItemType.FOUND, "Scientific Calculator", "Casio fx-991EX found in class 302", testCategory, testLocation, "Class 302", Instant.now(), null, null));

        mockMvc.perform(get("/api/items?search=titan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].title", is("Titan Watch")));

        mockMvc.perform(get("/api/items?search=casio"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].title", is("Scientific Calculator")));
    }

    @Test
    @DisplayName("GET /api/items/{itemId} should return details without secret answer")
    void shouldGetItemDetailsWithoutVerificationAnswer() throws Exception {
        Item item = itemRepository.save(new Item(
                studentA,
                ItemType.FOUND,
                "Leather Jacket",
                "Brown leather jacket left on auditorium seat.",
                testCategory,
                testLocation,
                "Row J Seat 12",
                Instant.now(),
                "What brand name is on the inner tag?",
                "Zara Man Size L"
        ));

        mockMvc.perform(get("/api/items/" + item.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Leather Jacket")))
                .andExpect(jsonPath("$.verificationQuestion", is("What brand name is on the inner tag?")))
                .andExpect(jsonPath("$.verificationAnswer").doesNotExist())
                .andExpect(jsonPath("$.isOwner", is(false)));
    }

    @Test
    @DisplayName("Owner should be able to update permitted fields of their own item")
    void ownerCanUpdatePermittedFields() throws Exception {
        Item item = itemRepository.save(new Item(
                studentA,
                ItemType.LOST,
                "Earbuds in White Case",
                "Lost earbuds in white charging case.",
                testCategory,
                testLocation,
                "Food Court",
                Instant.now(),
                null,
                null
        ));

        UpdateItemRequest update = new UpdateItemRequest(
                "Apple AirPods Pro 2",
                "Lost white AirPods Pro 2 in food court near counter 3.",
                testCategory.getId(),
                testLocation.getId(),
                "Near Counter 3",
                Instant.now(),
                null,
                null
        );

        mockMvc.perform(patch("/api/items/" + item.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Apple AirPods Pro 2")))
                .andExpect(jsonPath("$.description", is("Lost white AirPods Pro 2 in food court near counter 3.")));
    }

    @Test
    @DisplayName("Non-owner should receive 403 Forbidden when attempting to modify another user's item")
    void nonOwnerCannotUpdateItem() throws Exception {
        Item item = itemRepository.save(new Item(
                studentA,
                ItemType.LOST,
                "Original Title",
                "Original description text here.",
                testCategory,
                testLocation,
                "Location",
                Instant.now(),
                null,
                null
        ));

        UpdateItemRequest update = new UpdateItemRequest(
                "Hacked Title",
                "Hacked description text here.",
                null, null, null, null, null, null
        );

        mockMvc.perform(patch("/api/items/" + item.getId())
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/items/me should return only items reported by current authenticated user")
    void getMyItemsReturnsOnlyUserReportedItems() throws Exception {
        itemRepository.save(new Item(studentA, ItemType.LOST, "Item 1 by A", "Description 1", testCategory, testLocation, "Loc", Instant.now(), null, null));
        itemRepository.save(new Item(studentA, ItemType.FOUND, "Item 2 by A", "Description 2", testCategory, testLocation, "Loc", Instant.now(), null, null));
        itemRepository.save(new Item(studentB, ItemType.LOST, "Item 3 by B", "Description 3", testCategory, testLocation, "Loc", Instant.now(), null, null));

        mockMvc.perform(get("/api/items/me")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(2)))
                .andExpect(jsonPath("$.content[0].title", containsString("Item")));
    }

    @Test
    @DisplayName("Should upload valid image and reject unauthorized or invalid MIME uploads")
    void shouldHandleImageUploadsCorrectly() throws Exception {
        Item item = itemRepository.save(new Item(
                studentA,
                ItemType.LOST,
                "Backpack",
                "Black Puma backpack with red zipper.",
                testCategory,
                testLocation,
                "Bus Stop",
                Instant.now(),
                null,
                null
        ));

        MockMultipartFile validImage = new MockMultipartFile(
                "file",
                "backpack.jpg",
                "image/jpeg",
                "fake image content bytes".getBytes()
        );

        // Owner upload succeeds
        mockMvc.perform(multipart("/api/items/" + item.getId() + "/images")
                        .file(validImage)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.publicUrl", startsWith("/api/images/items/")))
                .andExpect(jsonPath("$.mimeType", is("image/jpeg")));

        // Non-owner upload is forbidden (403)
        mockMvc.perform(multipart("/api/items/" + item.getId() + "/images")
                        .file(validImage)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());

        // Invalid MIME upload is rejected (400)
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "evil payload".getBytes()
        );

        mockMvc.perform(multipart("/api/items/" + item.getId() + "/images")
                        .file(invalidFile)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
    }
}
