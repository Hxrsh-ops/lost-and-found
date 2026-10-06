package com.campus.lostfound.service.impl;

import com.campus.lostfound.dto.ClaimDetailDto;
import com.campus.lostfound.dto.admin.AdminUserDto;
import com.campus.lostfound.dto.admin.AuditLogDto;
import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.dto.item.ItemDetailDto;
import com.campus.lostfound.dto.item.ItemImageDto;
import com.campus.lostfound.dto.item.ItemSummaryDto;
import com.campus.lostfound.entity.*;
import com.campus.lostfound.exception.BadRequestException;
import com.campus.lostfound.exception.ResourceNotFoundException;
import com.campus.lostfound.repository.*;
import com.campus.lostfound.service.AdminService;
import com.campus.lostfound.service.ArchivalService;
import com.campus.lostfound.service.NotificationService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final ClaimRepository claimRepository;
    private final AuditLogRepository auditLogRepository;
    private final ArchivalService archivalService;
    private final NotificationService notificationService;

    public AdminServiceImpl(UserRepository userRepository,
                            ItemRepository itemRepository,
                            ItemImageRepository itemImageRepository,
                            ClaimRepository claimRepository,
                            AuditLogRepository auditLogRepository,
                            ArchivalService archivalService,
                            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.itemImageRepository = itemImageRepository;
        this.claimRepository = claimRepository;
        this.auditLogRepository = auditLogRepository;
        this.archivalService = archivalService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserDto> getUsers(String search, UserRole role, UserStatus status, int page, int size, String sortParam) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("name,asc".equalsIgnoreCase(sortParam)) {
            sort = Sort.by(Sort.Direction.ASC, "name");
        } else if ("createdAt,asc".equalsIgnoreCase(sortParam)) {
            sort = Sort.by(Sort.Direction.ASC, "createdAt");
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), sort);

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), term),
                        cb.like(cb.lower(root.get("email")), term)
                ));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> userPage = userRepository.findAll(spec, pageable);
        List<AdminUserDto> dtos = userPage.getContent().stream()
                .map(this::mapToAdminUserDto)
                .toList();

        return new PageResponse<>(
                dtos,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.isFirst(),
                userPage.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDto getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToAdminUserDto(user);
    }

    @Override
    public AdminUserDto updateUserStatus(UUID targetUserId, UserStatus newStatus, String adminEmail) {
        User admin = userRepository.findByEmailIgnoreCase(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        // Self-protection: Admin cannot block their own account
        if (admin.getId().equals(targetUserId) && newStatus == UserStatus.BLOCKED) {
            throw new BadRequestException("Administrators cannot block their own account");
        }

        if (targetUser.getStatus() != newStatus) {
            UserStatus previousStatus = targetUser.getStatus();
            targetUser.setStatus(newStatus);
            User saved = userRepository.save(targetUser);

            AuditAction action = (newStatus == UserStatus.BLOCKED) ? AuditAction.USER_BLOCKED : AuditAction.USER_UNBLOCKED;
            AuditLog audit = new AuditLog(
                    admin,
                    action,
                    "USER",
                    targetUserId,
                    "{\"previousStatus\":\"" + previousStatus + "\",\"newStatus\":\"" + newStatus + "\",\"targetEmail\":\"" + targetUser.getEmail() + "\"}"
            );
            auditLogRepository.save(audit);

            return mapToAdminUserDto(saved);
        }

        return mapToAdminUserDto(targetUser);
    }

    @Override
    public AdminUserDto updateUserRole(UUID targetUserId, UserRole newRole, String adminEmail) {
        User admin = userRepository.findByEmailIgnoreCase(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        // Self-protection: Admin cannot demote their own role
        if (admin.getId().equals(targetUserId) && newRole != UserRole.ADMIN) {
            throw new BadRequestException("Administrators cannot remove their own administrative role");
        }

        if (targetUser.getRole() != newRole) {
            UserRole previousRole = targetUser.getRole();
            targetUser.setRole(newRole);
            User saved = userRepository.save(targetUser);

            AuditLog audit = new AuditLog(
                    admin,
                    AuditAction.ROLE_CHANGED,
                    "USER",
                    targetUserId,
                    "{\"previousRole\":\"" + previousRole + "\",\"newRole\":\"" + newRole + "\",\"targetEmail\":\"" + targetUser.getEmail() + "\"}"
            );
            auditLogRepository.save(audit);

            notificationService.createNotification(
                    targetUser,
                    NotificationType.ADMIN_ACTION,
                    "Account Role Updated",
                    "Your campus account role has been updated to " + newRole + "."
            );

            return mapToAdminUserDto(saved);
        }

        return mapToAdminUserDto(targetUser);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ItemSummaryDto> getAdminItems(String search, ItemType type, UUID categoryId, UUID locationZoneId,
                                                      ItemStatus status, Instant from, Instant to, int page, int size, String sortParam) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("createdAt,asc".equalsIgnoreCase(sortParam)) {
            sort = Sort.by(Sort.Direction.ASC, "createdAt");
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), sort);

        Specification<Item> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), term),
                        cb.like(cb.lower(root.get("description")), term)
                ));
            }

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (locationZoneId != null) {
                predicates.add(cb.equal(root.get("locationZone").get("id"), locationZoneId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }

            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Item> itemPage = itemRepository.findAll(spec, pageable);
        List<ItemSummaryDto> dtos = itemPage.getContent().stream()
                .map(this::mapToItemSummaryDto)
                .toList();

        return new PageResponse<>(
                dtos,
                itemPage.getNumber(),
                itemPage.getSize(),
                itemPage.getTotalElements(),
                itemPage.getTotalPages(),
                itemPage.isFirst(),
                itemPage.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ItemDetailDto getAdminItemById(UUID itemId, String adminEmail) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        List<ItemImage> images = itemImageRepository.findByItemIdOrderBySortOrderAscCreatedAtAsc(item.getId());
        List<ItemImageDto> imageDtos = images.stream()
                .map(img -> new ItemImageDto(
                        img.getId(),
                        img.getPublicUrl(),
                        img.getMimeType(),
                        img.getFileSize(),
                        img.getSortOrder(),
                        img.getCreatedAt()
                ))
                .toList();

        ItemDetailDto dto = new ItemDetailDto();
        dto.setId(item.getId());
        dto.setType(item.getType());
        dto.setTitle(item.getTitle());
        dto.setDescription(item.getDescription());
        if (item.getCategory() != null) {
            dto.setCategory(com.campus.lostfound.dto.category.CategoryDto.fromEntity(item.getCategory()));
        }
        if (item.getLocationZone() != null) {
            dto.setLocation(com.campus.lostfound.dto.location.LocationZoneDto.fromEntity(item.getLocationZone()));
        }
        dto.setLocationDetail(item.getLocationDetail());
        dto.setOccurredAt(item.getOccurredAt());
        dto.setStatus(item.getStatus());
        dto.setVerificationRequired(item.getVerificationQuestion() != null && !item.getVerificationQuestion().isBlank());
        dto.setVerificationQuestion(item.getVerificationQuestion());
        dto.setImages(imageDtos);
        dto.setReporterId(item.getReporter().getId());
        dto.setReporterName(item.getReporter().getName());
        dto.setOwner(false);
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        dto.setResolvedAt(item.getResolvedAt());

        return dto;
    }

    @Override
    public ItemDetailDto archiveItem(UUID itemId, String adminEmail) {
        archivalService.manuallyArchiveItem(itemId, adminEmail);
        return getAdminItemById(itemId, adminEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ClaimDetailDto> getAdminClaims(ClaimStatus status, int page, int size, String adminEmail) {
        User admin = userRepository.findByEmailIgnoreCase(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Claim> claimPage;
        if (status != null) {
            claimPage = claimRepository.findByStatus(status, pageable);
        } else {
            claimPage = claimRepository.findAll(pageable);
        }

        List<ClaimDetailDto> content = claimPage.getContent().stream()
                .map(c -> mapToClaimDetailDto(c, admin))
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
    public ClaimDetailDto getAdminClaimById(UUID claimId, String adminEmail) {
        User admin = userRepository.findByEmailIgnoreCase(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        return mapToClaimDetailDto(claim, admin);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogDto> getAuditLogs(UUID actorUserId, AuditAction action, String entityType, UUID entityId,
                                                 Instant from, Instant to, int page, int size, String sortParam) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("createdAt,asc".equalsIgnoreCase(sortParam)) {
            sort = Sort.by(Sort.Direction.ASC, "createdAt");
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), sort);

        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (actorUserId != null) {
                predicates.add(cb.equal(root.get("actor").get("id"), actorUserId));
            }

            if (action != null) {
                predicates.add(cb.equal(root.get("action"), action));
            }

            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("entityType")), entityType.trim().toLowerCase()));
            }

            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }

            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }

            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuditLog> auditPage = auditLogRepository.findAll(spec, pageable);
        List<AuditLogDto> content = auditPage.getContent().stream()
                .map(this::mapToAuditLogDto)
                .toList();

        return new PageResponse<>(
                content,
                auditPage.getNumber(),
                auditPage.getSize(),
                auditPage.getTotalElements(),
                auditPage.getTotalPages(),
                auditPage.isFirst(),
                auditPage.isLast()
        );
    }

    private AdminUserDto mapToAdminUserDto(User user) {
        return new AdminUserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private ItemSummaryDto mapToItemSummaryDto(Item item) {
        String primaryImageUrl = null;
        List<ItemImage> images = itemImageRepository.findByItemIdOrderBySortOrderAscCreatedAtAsc(item.getId());
        if (!images.isEmpty()) {
            primaryImageUrl = images.get(0).getPublicUrl();
        }

        return new ItemSummaryDto(
                item.getId(),
                item.getType(),
                item.getTitle(),
                item.getDescription(),
                com.campus.lostfound.dto.category.CategoryDto.fromEntity(item.getCategory()),
                com.campus.lostfound.dto.location.LocationZoneDto.fromEntity(item.getLocationZone()),
                item.getLocationDetail(),
                item.getOccurredAt(),
                item.getStatus(),
                primaryImageUrl,
                item.getVerificationQuestion() != null && !item.getVerificationQuestion().isBlank(),
                images.size(),
                item.getCreatedAt()
        );
    }

    private ClaimDetailDto mapToClaimDetailDto(Claim claim, User caller) {
        Item item = claim.getItem();
        String primaryImageUrl = null;
        List<ItemImage> images = itemImageRepository.findByItemIdOrderBySortOrderAscCreatedAtAsc(item.getId());
        if (!images.isEmpty()) {
            primaryImageUrl = images.get(0).getPublicUrl();
        }

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
        dto.setClaimantEmail(claim.getClaimant().getEmail());
        dto.setAnswer(claim.getAnswer());
        dto.setStatus(claim.getStatus());
        dto.setReviewNote(claim.getReviewNote());
        dto.setCreatedAt(claim.getCreatedAt());
        dto.setDecidedAt(claim.getDecidedAt());
        dto.setClaimant(false);
        dto.setCanReview(true);

        return dto;
    }

    private AuditLogDto mapToAuditLogDto(AuditLog audit) {
        UUID actorUserId = audit.getActorUser() != null ? audit.getActorUser().getId() : null;
        String actorName = audit.getActorUser() != null ? audit.getActorUser().getName() : "SYSTEM";
        String actorEmail = audit.getActorUser() != null ? audit.getActorUser().getEmail() : "system@campus.internal";

        return new AuditLogDto(
                audit.getId(),
                actorUserId,
                actorName,
                actorEmail,
                audit.getAction(),
                audit.getEntityType(),
                audit.getEntityId(),
                audit.getMetadata(),
                audit.getCreatedAt()
        );
    }
}
