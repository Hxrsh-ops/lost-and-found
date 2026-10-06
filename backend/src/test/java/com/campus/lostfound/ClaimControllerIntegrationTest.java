package com.campus.lostfound;

import com.campus.lostfound.dto.CreateClaimRequest;
import com.campus.lostfound.dto.RejectClaimRequest;
import com.campus.lostfound.entity.*;
import com.campus.lostfound.repository.*;
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

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ClaimControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationZoneRepository locationZoneRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User finder;
    private User claimant;
    private User otherStudent;
    private User blockedUser;
    private User securityUser;
    private Category testCategory;
    private LocationZone testLocation;
    private Item foundItem;
    private Item lostItem;

    private String finderToken;
    private String claimantToken;
    private String otherStudentToken;
    private String blockedToken;
    private String securityToken;

    @BeforeEach
    void setUp() throws Exception {
        claimRepository.deleteAll();
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        itemRepository.deleteAll();
        categoryRepository.deleteAll();
        locationZoneRepository.deleteAll();
        userRepository.deleteAll();

        // Create categories & zones
        testCategory = categoryRepository.save(new Category(null, "Electronics", "Devices", true));
        testLocation = locationZoneRepository.save(new LocationZone(null, "Central Library", "Main library", true));

        // Create users
        finder = userRepository.save(new User(null, "Finder Student", "finder@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.STUDENT, UserStatus.ACTIVE));
        claimant = userRepository.save(new User(null, "Claimant Student", "claimant@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.STUDENT, UserStatus.ACTIVE));
        otherStudent = userRepository.save(new User(null, "Other Student", "other@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.STUDENT, UserStatus.ACTIVE));
        blockedUser = userRepository.save(new User(null, "Blocked Student", "blocked@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.STUDENT, UserStatus.BLOCKED));
        securityUser = userRepository.save(new User(null, "Campus Security", "security@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.SECURITY, UserStatus.ACTIVE));

        // Create Found and Lost items
        foundItem = new Item();
        foundItem.setReporter(finder);
        foundItem.setType(ItemType.FOUND);
        foundItem.setTitle("Silver MacBook Air");
        foundItem.setDescription("Found on 2nd floor library desk");
        foundItem.setCategory(testCategory);
        foundItem.setLocationZone(testLocation);
        foundItem.setStatus(ItemStatus.OPEN);
        foundItem.setVerificationQuestion("What sticker is on the lid?");
        foundItem.setVerificationAnswer("NASA astronaut sticker");
        foundItem = itemRepository.save(foundItem);

        lostItem = new Item();
        lostItem.setReporter(claimant);
        lostItem.setType(ItemType.LOST);
        lostItem.setTitle("Lost Black Wallet");
        lostItem.setDescription("Lost near canteen");
        lostItem.setCategory(testCategory);
        lostItem.setLocationZone(testLocation);
        lostItem.setStatus(ItemStatus.OPEN);
        lostItem = itemRepository.save(lostItem);

        // Fetch JWT tokens
        finderToken = obtainJwt("finder@srm.edu", "Password123!");
        claimantToken = obtainJwt("claimant@srm.edu", "Password123!");
        otherStudentToken = obtainJwt("other@srm.edu", "Password123!");
        securityToken = obtainJwt("security@srm.edu", "Password123!");
    }

    private String obtainJwt(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    @Test
    @DisplayName("Eligible student can submit a claim for an OPEN FOUND item")
    void testSubmitClaimSuccess() throws Exception {
        CreateClaimRequest req = new CreateClaimRequest("NASA astronaut sticker");

        mockMvc.perform(post("/api/items/" + foundItem.getId() + "/claims")
                        .header("Authorization", "Bearer " + claimantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.itemId").value(foundItem.getId().toString()))
                .andExpect(jsonPath("$.itemTitle").value("Silver MacBook Air"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.claimantName").value("Claimant Student"))
                .andExpect(jsonPath("$.answer").value("NASA astronaut sticker"))
                .andExpect(jsonPath("$.isClaimant").value(true));

        // Verify notification sent to finder
        assertEquals(1, notificationRepository.countByUserIdAndReadFalse(finder.getId()));

        // Verify audit log entry
        assertTrue(auditLogRepository.findAll().stream().anyMatch(a -> "CLAIM_SUBMITTED".equals(a.getAction().name())));
    }

    @Test
    @DisplayName("Cannot submit claim for a LOST item")
    void testSubmitClaimForLostItemFails() throws Exception {
        CreateClaimRequest req = new CreateClaimRequest("It is mine");

        mockMvc.perform(post("/api/items/" + lostItem.getId() + "/claims")
                        .header("Authorization", "Bearer " + otherStudentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Claims can only be submitted for FOUND items")));
    }

    @Test
    @DisplayName("Cannot submit claim for a RESOLVED item")
    void testSubmitClaimForResolvedItemFails() throws Exception {
        foundItem.setStatus(ItemStatus.RESOLVED);
        itemRepository.save(foundItem);

        CreateClaimRequest req = new CreateClaimRequest("NASA sticker");

        mockMvc.perform(post("/api/items/" + foundItem.getId() + "/claims")
                        .header("Authorization", "Bearer " + claimantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Claims can only be submitted for OPEN items")));
    }

    @Test
    @DisplayName("Finder cannot claim their own found item")
    void testFinderCannotClaimOwnItem() throws Exception {
        CreateClaimRequest req = new CreateClaimRequest("I found it and it's mine");

        mockMvc.perform(post("/api/items/" + foundItem.getId() + "/claims")
                        .header("Authorization", "Bearer " + finderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("You cannot submit a claim on an item you reported")));
    }

    @Test
    @DisplayName("Unauthenticated user cannot submit a claim")
    void testUnauthenticatedCannotClaim() throws Exception {
        CreateClaimRequest req = new CreateClaimRequest("NASA sticker");

        mockMvc.perform(post("/api/items/" + foundItem.getId() + "/claims")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Duplicate claim protection: Claimant cannot submit two PENDING claims for same item")
    void testDuplicateClaimProtection() throws Exception {
        CreateClaimRequest req = new CreateClaimRequest("NASA astronaut sticker");

        // First claim
        mockMvc.perform(post("/api/items/" + foundItem.getId() + "/claims")
                        .header("Authorization", "Bearer " + claimantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Second duplicate claim attempt
        mockMvc.perform(post("/api/items/" + foundItem.getId() + "/claims")
                        .header("Authorization", "Bearer " + claimantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("You already have an active pending claim")));
    }

    @Test
    @DisplayName("Claimant can view their own claims via GET /api/claims/me")
    void testGetMyClaims() throws Exception {
        Claim claim = claimRepository.save(new Claim(null, foundItem, claimant, "NASA sticker"));

        mockMvc.perform(get("/api/claims/me")
                        .header("Authorization", "Bearer " + claimantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(claim.getId().toString()))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("Unrelated student cannot access another user's claim details")
    void testUnrelatedStudentCannotAccessClaim() throws Exception {
        Claim claim = claimRepository.save(new Claim(null, foundItem, claimant, "NASA sticker"));

        mockMvc.perform(get("/api/claims/" + claim.getId())
                        .header("Authorization", "Bearer " + otherStudentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Finder can view claim details with submitted answer")
    void testFinderCanViewClaim() throws Exception {
        Claim claim = claimRepository.save(new Claim(null, foundItem, claimant, "NASA sticker"));

        mockMvc.perform(get("/api/claims/" + claim.getId())
                        .header("Authorization", "Bearer " + finderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(claim.getId().toString()))
                .andExpect(jsonPath("$.answer").value("NASA sticker"))
                .andExpect(jsonPath("$.canReview").value(true));
    }

    @Test
    @DisplayName("Finder can APPROVE a pending claim: claim becomes APPROVED, item becomes RESOLVED atomically")
    void testApproveClaimSuccess() throws Exception {
        Claim claim = claimRepository.save(new Claim(null, foundItem, claimant, "NASA sticker"));

        mockMvc.perform(post("/api/claims/" + claim.getId() + "/approve")
                        .header("Authorization", "Bearer " + finderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.itemStatus").value("RESOLVED"));

        // Verify in DB
        Claim updatedClaim = claimRepository.findById(claim.getId()).orElseThrow();
        assertEquals(ClaimStatus.APPROVED, updatedClaim.getStatus());
        assertNotNull(updatedClaim.getDecidedAt());

        Item updatedItem = itemRepository.findById(foundItem.getId()).orElseThrow();
        assertEquals(ItemStatus.RESOLVED, updatedItem.getStatus());
        assertNotNull(updatedItem.getResolvedAt());

        // Verify notification sent to claimant
        assertEquals(1, notificationRepository.countByUserIdAndReadFalse(claimant.getId()));

        // Verify audit logs
        assertTrue(auditLogRepository.findAll().stream().anyMatch(a -> AuditAction.CLAIM_APPROVED.equals(a.getAction())));
        assertTrue(auditLogRepository.findAll().stream().anyMatch(a -> AuditAction.ITEM_RESOLVED.equals(a.getAction())));
    }

    @Test
    @DisplayName("Student who is NOT the finder cannot approve a claim")
    void testUnauthorizedStudentCannotApprove() throws Exception {
        Claim claim = claimRepository.save(new Claim(null, foundItem, claimant, "NASA sticker"));

        mockMvc.perform(post("/api/claims/" + claim.getId() + "/approve")
                        .header("Authorization", "Bearer " + otherStudentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Finder can REJECT a pending claim: claim becomes REJECTED, item remains OPEN")
    void testRejectClaimSuccess() throws Exception {
        Claim claim = claimRepository.save(new Claim(null, foundItem, claimant, "Wrong sticker"));
        RejectClaimRequest rejectReq = new RejectClaimRequest("Sticker color does not match");

        mockMvc.perform(post("/api/claims/" + claim.getId() + "/reject")
                        .header("Authorization", "Bearer " + finderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.reviewNote").value("Sticker color does not match"))
                .andExpect(jsonPath("$.itemStatus").value("OPEN"));

        // Verify in DB
        Claim updatedClaim = claimRepository.findById(claim.getId()).orElseThrow();
        assertEquals(ClaimStatus.REJECTED, updatedClaim.getStatus());

        Item updatedItem = itemRepository.findById(foundItem.getId()).orElseThrow();
        assertEquals(ItemStatus.OPEN, updatedItem.getStatus());

        // Verify notification sent to claimant
        assertEquals(1, notificationRepository.countByUserIdAndReadFalse(claimant.getId()));
    }

    @Test
    @DisplayName("Cannot approve an already APPROVED or REJECTED claim")
    void testInvalidStateTransitions() throws Exception {
        Claim claim = claimRepository.save(new Claim(null, foundItem, claimant, "NASA sticker"));
        claim.setStatus(ClaimStatus.APPROVED);
        claimRepository.save(claim);

        mockMvc.perform(post("/api/claims/" + claim.getId() + "/approve")
                        .header("Authorization", "Bearer " + finderToken))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/claims/" + claim.getId() + "/reject")
                        .header("Authorization", "Bearer " + finderToken))
                .andExpect(status().isConflict());
    }
}
