package com.campus.lostfound;

import com.campus.lostfound.dto.ClaimDetailDto;
import com.campus.lostfound.entity.*;
import com.campus.lostfound.repository.*;
import com.campus.lostfound.service.ClaimService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class ClaimConcurrencyIntegrationTest {

    @Autowired
    private ClaimService claimService;

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
    private AuditLogRepository auditLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User finder;
    private User claimantA;
    private User claimantB;
    private Item foundItem;
    private Claim claimA;
    private Claim claimB;

    @BeforeEach
    void setUp() {
        claimRepository.deleteAll();
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        itemRepository.deleteAll();
        categoryRepository.deleteAll();
        locationZoneRepository.deleteAll();
        userRepository.deleteAll();

        Category cat = categoryRepository.save(new Category(null, "Laptops", "Laptop devices", true));
        LocationZone loc = locationZoneRepository.save(new LocationZone(null, "Tech Park", "TP Building", true));

        finder = userRepository.save(new User(null, "Finder User", "finder_conc@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.STUDENT, UserStatus.ACTIVE));
        claimantA = userRepository.save(new User(null, "Claimant A", "claimant_a@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.STUDENT, UserStatus.ACTIVE));
        claimantB = userRepository.save(new User(null, "Claimant B", "claimant_b@srm.edu",
                passwordEncoder.encode("Password123!"), UserRole.STUDENT, UserStatus.ACTIVE));

        foundItem = new Item();
        foundItem.setReporter(finder);
        foundItem.setType(ItemType.FOUND);
        foundItem.setTitle("Dell XPS 15");
        foundItem.setDescription("Found in Lab 1");
        foundItem.setCategory(cat);
        foundItem.setLocationZone(loc);
        foundItem.setStatus(ItemStatus.OPEN);
        foundItem.setVerificationQuestion("What is the asset tag number?");
        foundItem.setVerificationAnswer("SRM-9942");
        foundItem = itemRepository.save(foundItem);

        claimA = claimRepository.save(new Claim(null, foundItem, claimantA, "SRM-9942 tag"));
        claimB = claimRepository.save(new Claim(null, foundItem, claimantB, "Tag is SRM-9942"));
    }

    @Test
    @DisplayName("Mandatory Concurrency Test: Competing approvals against the same item resolve the item exactly once")
    void testConcurrentApprovalsResolutionIntegrity() throws Exception {
        int numberOfThreads = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        AtomicReference<Exception> caughtException = new AtomicReference<>();

        // Thread 1: attempts to approve Claim A
        executorService.submit(() -> {
            readyLatch.countDown();
            try {
                startLatch.await();
                ClaimDetailDto res = claimService.approveClaim(claimA.getId(), finder.getEmail());
                if (res != null && res.getStatus() == ClaimStatus.APPROVED) {
                    successCount.incrementAndGet();
                }
            } catch (Exception ex) {
                failureCount.incrementAndGet();
                caughtException.set(ex);
            } finally {
                doneLatch.countDown();
            }
        });

        // Thread 2: attempts to approve Claim B
        executorService.submit(() -> {
            readyLatch.countDown();
            try {
                startLatch.await();
                ClaimDetailDto res = claimService.approveClaim(claimB.getId(), finder.getEmail());
                if (res != null && res.getStatus() == ClaimStatus.APPROVED) {
                    successCount.incrementAndGet();
                }
            } catch (Exception ex) {
                failureCount.incrementAndGet();
                caughtException.set(ex);
            } finally {
                doneLatch.countDown();
            }
        });

        // Wait for both threads to be ready, then trigger them simultaneously
        assertTrue(readyLatch.await(5, TimeUnit.SECONDS));
        startLatch.countDown();
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS));
        executorService.shutdown();

        // Assert that EXACTLY one approval succeeded and EXACTLY one failed safely
        assertEquals(1, successCount.get(), "Exactly one approval must succeed");
        assertEquals(1, failureCount.get(), "Exactly one approval must fail due to lock/conflict");
        assertNotNull(caughtException.get(), "Failure must be backed by an exception");

        // Verify final DB State
        Item finalItem = itemRepository.findById(foundItem.getId()).orElseThrow();
        assertEquals(ItemStatus.RESOLVED, finalItem.getStatus(), "Item status must be RESOLVED");
        assertNotNull(finalItem.getResolvedAt(), "Item resolvedAt must be set");

        Claim finalClaimA = claimRepository.findById(claimA.getId()).orElseThrow();
        Claim finalClaimB = claimRepository.findById(claimB.getId()).orElseThrow();

        // Exactly one claim is APPROVED, the other is still PENDING
        boolean claimAApproved = finalClaimA.getStatus() == ClaimStatus.APPROVED;
        boolean claimBApproved = finalClaimB.getStatus() == ClaimStatus.APPROVED;
        assertTrue(claimAApproved ^ claimBApproved, "Exactly one claim must be APPROVED in the database");

        // Verify audit log has exactly one ITEM_RESOLVED record
        long resolvedAuditCount = auditLogRepository.findAll().stream()
                .filter(a -> AuditAction.ITEM_RESOLVED.equals(a.getAction()) && foundItem.getId().equals(a.getEntityId()))
                .count();
        assertEquals(1, resolvedAuditCount, "Audit log must contain exactly 1 ITEM_RESOLVED entry");
    }
}
