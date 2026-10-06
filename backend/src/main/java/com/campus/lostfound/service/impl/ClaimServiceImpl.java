package com.campus.lostfound.service.impl;

import com.campus.lostfound.dto.ClaimDetailDto;
import com.campus.lostfound.dto.ClaimSummaryDto;
import com.campus.lostfound.dto.CreateClaimRequest;
import com.campus.lostfound.dto.RejectClaimRequest;
import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.entity.*;
import com.campus.lostfound.exception.BadRequestException;
import com.campus.lostfound.exception.ConflictException;
import com.campus.lostfound.exception.ForbiddenException;
import com.campus.lostfound.exception.ResourceNotFoundException;
import com.campus.lostfound.repository.AuditLogRepository;
import com.campus.lostfound.repository.ClaimRepository;
import com.campus.lostfound.repository.ItemImageRepository;
import com.campus.lostfound.repository.ItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.ClaimService;
import com.campus.lostfound.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRepository claimRepository;
    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;

    public ClaimServiceImpl(ClaimRepository claimRepository,
                            ItemRepository itemRepository,
                            ItemImageRepository itemImageRepository,
                            UserRepository userRepository,
                            NotificationService notificationService,
                            AuditLogRepository auditLogRepository) {
        this.claimRepository = claimRepository;
        this.itemRepository = itemRepository;
        this.itemImageRepository = itemImageRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public ClaimDetailDto createClaim(UUID itemId, CreateClaimRequest request, String userEmail) {
        User claimant = findUserByEmail(userEmail);
        if (claimant.getStatus() == UserStatus.BLOCKED) {
            throw new ForbiddenException("Blocked accounts cannot submit claims");
        }

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        if (item.getType() != ItemType.FOUND) {
            throw new BadRequestException("Claims can only be submitted for FOUND items");
        }

        if (item.getStatus() != ItemStatus.OPEN) {
            throw new ConflictException("Claims can only be submitted for OPEN items. This item is " + item.getStatus());
        }

        if (item.getReporter().getId().equals(claimant.getId())) {
            throw new BadRequestException("You cannot submit a claim on an item you reported");
        }

        // Duplicate claim protection: at most one PENDING claim per (item, claimant)
        if (claimRepository.existsByItemIdAndClaimantIdAndStatus(itemId, claimant.getId(), ClaimStatus.PENDING)) {
            throw new ConflictException("You already have an active pending claim for this item");
        }

        Claim claim = new Claim(null, item, claimant, request.getAnswer().trim());
        claim.setStatus(ClaimStatus.PENDING);
        Claim savedClaim = claimRepository.save(claim);

        // Audit log (never including the secret verification answer)
        AuditLog auditLog = new AuditLog(
                claimant,
                AuditAction.CLAIM_SUBMITTED,
                "CLAIM",
                savedClaim.getId(),
                "{\"itemId\":\"" + item.getId() + "\",\"itemTitle\":\"" + item.getTitle() + "\"}"
        );
        auditLogRepository.save(auditLog);

        // Send notification to finder
        notificationService.createNotification(
                item.getReporter(),
                NotificationType.CLAIM_SUBMITTED,
                "New Claim Submitted",
                "A student submitted an ownership claim for your found item \"" + item.getTitle() + "\"."
        );

        return mapToDetailDto(savedClaim, claimant);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ClaimSummaryDto> getMyClaims(String userEmail, ClaimStatus status, int page, int size, String sortParam) {
        User claimant = findUserByEmail(userEmail);
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("createdAt,asc".equalsIgnoreCase(sortParam)) {
            sort = Sort.by(Sort.Direction.ASC, "createdAt");
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), sort);

        Page<Claim> claimPage;
        if (status != null) {
            claimPage = claimRepository.findByClaimantIdAndStatus(claimant.getId(), status, pageable);
        } else {
            claimPage = claimRepository.findByClaimantId(claimant.getId(), pageable);
        }

        List<ClaimSummaryDto> content = claimPage.getContent().stream()
                .map(this::mapToSummaryDto)
                .toList();

        return new PageResponse<>(
                content,
                claimPage.getNumber(),
                claimPage.getSize(),
                claimPage.getTotalElements(),
                claimPage.getTotalPages(),
                claimPage.isFirst(),
                claimPage.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ClaimDetailDto getClaimById(UUID claimId, String userEmail) {
        User caller = findUserByEmail(userEmail);
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        boolean isClaimant = claim.getClaimant().getId().equals(caller.getId());
        boolean isFinder = claim.getItem().getReporter().getId().equals(caller.getId());
        boolean isStaff = caller.getRole() == UserRole.SECURITY || caller.getRole() == UserRole.ADMIN;

        if (!isClaimant && !isFinder && !isStaff) {
            throw new ForbiddenException("You are not authorized to view this claim");
        }

        return mapToDetailDto(claim, caller);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ClaimDetailDto> getClaimsForReview(UUID itemId, ClaimStatus status, int page, int size, String userEmail) {
        User caller = findUserByEmail(userEmail);
        boolean isStaff = caller.getRole() == UserRole.SECURITY || caller.getRole() == UserRole.ADMIN;

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Claim> claimPage;

        if (itemId != null) {
            Item item = itemRepository.findById(itemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));
            boolean isFinder = item.getReporter().getId().equals(caller.getId());
            if (!isFinder && !isStaff) {
                throw new ForbiddenException("You are not authorized to review claims for this item");
            }
            claimPage = claimRepository.findByItemId(itemId, pageable);
        } else {
            if (isStaff) {
                if (status != null) {
                    claimPage = claimRepository.findByStatus(status, pageable);
                } else {
                    claimPage = claimRepository.findAll(pageable);
                }
            } else {
                if (status != null) {
                    claimPage = claimRepository.findByItemReporterIdAndStatus(caller.getId(), status, pageable);
                } else {
                    claimPage = claimRepository.findByItemReporterId(caller.getId(), pageable);
                }
            }
        }

        List<ClaimDetailDto> content = claimPage.getContent().stream()
                .map(c -> mapToDetailDto(c, caller))
                .toList();

        return new PageResponse<>(
                content,
                claimPage.getNumber(),
                claimPage.getSize(),
                claimPage.getTotalElements(),
                claimPage.getTotalPages(),
                claimPage.isFirst(),
                claimPage.isLast()
        );
    }

    /**
     * Approves a claim atomically.
     * Uses pessimistic write lock on the Item to ensure that concurrent approvals
     * on competing claims for the same item result in exactly ONE approval and RESOLVED state.
     */
    @Override
    public ClaimDetailDto approveClaim(UUID claimId, String userEmail) {
        User reviewer = findUserByEmail(userEmail);

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new ConflictException("Cannot approve a claim with status " + claim.getStatus() + ". Only PENDING claims can be approved.");
        }

        // Acquire exclusive pessimistic lock on the item
        Item item = itemRepository.findByIdWithPessimisticLock(claim.getItem().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated item not found"));

        // Verify reviewer authorization
        boolean isFinder = item.getReporter().getId().equals(reviewer.getId());
        boolean isStaff = reviewer.getRole() == UserRole.SECURITY || reviewer.getRole() == UserRole.ADMIN;

        if (!isFinder && !isStaff) {
            throw new ForbiddenException("You are not authorized to approve claims for this item");
        }

        if (claim.getClaimant().getId().equals(reviewer.getId())) {
            throw new BadRequestException("You cannot approve your own claim");
        }

        if (item.getStatus() != ItemStatus.OPEN) {
            throw new ConflictException("Item is already " + item.getStatus() + ". Only OPEN items can be resolved.");
        }

        // Atomic state transition
        Instant now = Instant.now();
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setDecidedAt(now);
        claimRepository.save(claim);

        item.setStatus(ItemStatus.RESOLVED);
        item.setResolvedAt(now);
        itemRepository.save(item);

        // Audit log
        AuditLog auditClaim = new AuditLog(
                reviewer,
                AuditAction.CLAIM_APPROVED,
                "CLAIM",
                claim.getId(),
                "{\"itemId\":\"" + item.getId() + "\",\"itemTitle\":\"" + item.getTitle() + "\",\"claimantId\":\"" + claim.getClaimant().getId() + "\"}"
        );
        auditLogRepository.save(auditClaim);

        AuditLog auditItem = new AuditLog(
                reviewer,
                AuditAction.ITEM_RESOLVED,
                "ITEM",
                item.getId(),
                "{\"claimId\":\"" + claim.getId() + "\",\"resolvedBy\":\"" + reviewer.getEmail() + "\"}"
        );
        auditLogRepository.save(auditItem);

        // Reject all competing pending claims on the same item and notify claimants
        List<Claim> competingClaims = claimRepository.findByItemIdAndStatus(item.getId(), ClaimStatus.PENDING);
        for (Claim otherClaim : competingClaims) {
            if (!otherClaim.getId().equals(claim.getId())) {
                otherClaim.setStatus(ClaimStatus.REJECTED);
                otherClaim.setDecidedAt(now);
                otherClaim.setReviewNote("Item was verified and resolved with another claimant.");
                claimRepository.save(otherClaim);

                // Audit competing rejection
                AuditLog auditComp = new AuditLog(
                        reviewer,
                        AuditAction.CLAIM_REJECTED,
                        "CLAIM",
                        otherClaim.getId(),
                        "{\"itemId\":\"" + item.getId() + "\",\"itemTitle\":\"" + item.getTitle() + "\",\"claimantId\":\"" + otherClaim.getClaimant().getId() + "\",\"reason\":\"COMPETING_CLAIM_RESOLVED\"}"
                );
                auditLogRepository.save(auditComp);

                // Notification to competing claimant
                notificationService.createNotification(
                        otherClaim.getClaimant(),
                        NotificationType.CLAIM_REJECTED,
                        "Claim Status Update",
                        "Your ownership claim for \"" + item.getTitle() + "\" was not approved because the item was verified and resolved with another claimant."
                );
            }
        }

        // Notification to approved claimant
        notificationService.createNotification(
                claim.getClaimant(),
                NotificationType.CLAIM_APPROVED,
                "Claim Approved!",
                "Your ownership claim for \"" + item.getTitle() + "\" has been approved. You can now coordinate recovery with campus security or the finder."
        );

        // If reviewer was staff and not the original finder, notify finder as well
        if (!isFinder) {
            notificationService.createNotification(
                    item.getReporter(),
                    NotificationType.ITEM_RESOLVED,
                    "Found Item Resolved",
                    "The item \"" + item.getTitle() + "\" you reported as found has been verified and marked as RESOLVED."
            );
        }

        return mapToDetailDto(claim, reviewer);
    }

    /**
     * Rejects a claim.
     * Item remains OPEN for other claimants.
     */
    @Override
    public ClaimDetailDto rejectClaim(UUID claimId, RejectClaimRequest request, String userEmail) {
        User reviewer = findUserByEmail(userEmail);

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new ConflictException("Cannot reject a claim with status " + claim.getStatus() + ". Only PENDING claims can be rejected.");
        }

        Item item = claim.getItem();

        boolean isFinder = item.getReporter().getId().equals(reviewer.getId());
        boolean isStaff = reviewer.getRole() == UserRole.SECURITY || reviewer.getRole() == UserRole.ADMIN;

        if (!isFinder && !isStaff) {
            throw new ForbiddenException("You are not authorized to reject claims for this item");
        }

        if (claim.getClaimant().getId().equals(reviewer.getId())) {
            throw new BadRequestException("You cannot reject your own claim");
        }

        Instant now = Instant.now();
        claim.setStatus(ClaimStatus.REJECTED);
        claim.setDecidedAt(now);
        if (request != null && request.getReviewNote() != null && !request.getReviewNote().isBlank()) {
            claim.setReviewNote(request.getReviewNote().trim());
        }
        Claim savedClaim = claimRepository.save(claim);

        // Audit log
        AuditLog auditLog = new AuditLog(
                reviewer,
                AuditAction.CLAIM_REJECTED,
                "CLAIM",
                claim.getId(),
                "{\"itemId\":\"" + item.getId() + "\",\"itemTitle\":\"" + item.getTitle() + "\",\"claimantId\":\"" + claim.getClaimant().getId() + "\"}"
        );
        auditLogRepository.save(auditLog);

        // Notification to claimant
        notificationService.createNotification(
                claim.getClaimant(),
                NotificationType.CLAIM_REJECTED,
                "Claim Status Update",
                "Your ownership claim for \"" + item.getTitle() + "\" was not approved." +
                        (savedClaim.getReviewNote() != null ? " Reason: " + savedClaim.getReviewNote() : "")
        );

        return mapToDetailDto(savedClaim, reviewer);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private ClaimSummaryDto mapToSummaryDto(Claim claim) {
        Item item = claim.getItem();
        String primaryImageUrl = null;
        List<ItemImage> images = itemImageRepository.findByItemIdOrderBySortOrderAscCreatedAtAsc(item.getId());
        if (!images.isEmpty()) {
            primaryImageUrl = images.get(0).getPublicUrl();
        }

        return new ClaimSummaryDto(
                claim.getId(),
                item.getId(),
                item.getTitle(),
                item.getType(),
                primaryImageUrl,
                claim.getStatus(),
                claim.getCreatedAt(),
                claim.getDecidedAt()
        );
    }

    private ClaimDetailDto mapToDetailDto(Claim claim, User caller) {
        Item item = claim.getItem();
        String primaryImageUrl = null;
        List<ItemImage> images = itemImageRepository.findByItemIdOrderBySortOrderAscCreatedAtAsc(item.getId());
        if (!images.isEmpty()) {
            primaryImageUrl = images.get(0).getPublicUrl();
        }

        boolean isClaimant = claim.getClaimant().getId().equals(caller.getId());
        boolean isFinder = item.getReporter().getId().equals(caller.getId());
        boolean isStaff = caller.getRole() == UserRole.SECURITY || caller.getRole() == UserRole.ADMIN;
        boolean canReview = (isFinder || isStaff) && !isClaimant;

        ClaimDetailDto dto = new ClaimDetailDto();
        dto.setId(claim.getId());
        dto.setItemId(item.getId());
        dto.setItemTitle(item.getTitle());
        dto.setItemType(item.getType());
        dto.setItemStatus(item.getStatus());
        dto.setItemLocation(item.getLocationZone() != null ? item.getLocationZone().getName() : "");
        dto.setItemCategory(item.getCategory() != null ? item.getCategory().getName() : "");
        dto.setPrimaryImageUrl(primaryImageUrl);
        dto.setClaimantId(claim.getClaimant().getId());
        dto.setClaimantName(claim.getClaimant().getName());
        dto.setClaimantEmail(isStaff || isFinder ? claim.getClaimant().getEmail() : null);

        // Verification answer is shown only to claimant or authorized reviewer/finder
        if (isClaimant || isFinder || isStaff) {
            dto.setAnswer(claim.getAnswer());
        }

        dto.setStatus(claim.getStatus());
        dto.setReviewNote(claim.getReviewNote());
        dto.setCreatedAt(claim.getCreatedAt());
        dto.setDecidedAt(claim.getDecidedAt());
        dto.setClaimant(isClaimant);
        dto.setCanReview(canReview);

        return dto;
    }
}
