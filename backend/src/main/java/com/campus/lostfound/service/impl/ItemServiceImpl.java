package com.campus.lostfound.service.impl;

import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.dto.item.CreateItemRequest;
import com.campus.lostfound.dto.item.ItemDetailDto;
import com.campus.lostfound.dto.item.ItemImageDto;
import com.campus.lostfound.dto.item.ItemSummaryDto;
import com.campus.lostfound.dto.item.UpdateItemRequest;
import com.campus.lostfound.entity.AuditAction;
import com.campus.lostfound.entity.AuditLog;
import com.campus.lostfound.entity.Category;
import com.campus.lostfound.entity.Item;
import com.campus.lostfound.entity.ItemImage;
import com.campus.lostfound.entity.ItemStatus;
import com.campus.lostfound.entity.ItemType;
import com.campus.lostfound.entity.LocationZone;
import com.campus.lostfound.entity.User;
import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;
import com.campus.lostfound.exception.AccountBlockedException;
import com.campus.lostfound.exception.ApiException;
import com.campus.lostfound.exception.InvalidCredentialsException;
import com.campus.lostfound.exception.ResourceNotFoundException;
import com.campus.lostfound.repository.AuditLogRepository;
import com.campus.lostfound.repository.CategoryRepository;
import com.campus.lostfound.repository.ItemImageRepository;
import com.campus.lostfound.repository.ItemRepository;
import com.campus.lostfound.repository.LocationZoneRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.security.UserPrincipal;
import com.campus.lostfound.service.FileStorageService;
import com.campus.lostfound.service.ItemService;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ItemServiceImpl implements ItemService {

    private static final Logger log = LoggerFactory.getLogger(ItemServiceImpl.class);
    private static final int MAX_IMAGES_PER_ITEM = 5;

    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final CategoryRepository categoryRepository;
    private final LocationZoneRepository locationZoneRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final FileStorageService fileStorageService;

    public ItemServiceImpl(ItemRepository itemRepository,
                           ItemImageRepository itemImageRepository,
                           CategoryRepository categoryRepository,
                           LocationZoneRepository locationZoneRepository,
                           UserRepository userRepository,
                           AuditLogRepository auditLogRepository,
                           FileStorageService fileStorageService) {
        this.itemRepository = itemRepository;
        this.itemImageRepository = itemImageRepository;
        this.categoryRepository = categoryRepository;
        this.locationZoneRepository = locationZoneRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional
    public ItemDetailDto createItem(CreateItemRequest request, UserPrincipal principal) {
        if (principal == null) {
            throw new InvalidCredentialsException();
        }

        User reporter = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        if (reporter.getStatus() == UserStatus.BLOCKED) {
            log.warn("Blocked user {} attempted to create an item", reporter.getEmail());
            throw new AccountBlockedException();
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        LocationZone locationZone = locationZoneRepository.findById(request.getLocationZoneId())
                .orElseThrow(() -> new ResourceNotFoundException("LocationZone", "id", request.getLocationZoneId()));

        Instant occurredAt = request.getOccurredAt() != null ? request.getOccurredAt() : Instant.now();

        String verificationQuestion = null;
        String verificationAnswer = null;

        if (request.getType() == ItemType.FOUND) {
            if (StringUtils.hasText(request.getVerificationQuestion())) {
                verificationQuestion = request.getVerificationQuestion().trim();
            }
            if (StringUtils.hasText(request.getVerificationAnswer())) {
                verificationAnswer = request.getVerificationAnswer().trim();
            }
        }

        Item item = new Item(
                reporter,
                request.getType(),
                request.getTitle().trim(),
                request.getDescription().trim(),
                category,
                locationZone,
                StringUtils.hasText(request.getLocationDetail()) ? request.getLocationDetail().trim() : null,
                occurredAt,
                verificationQuestion,
                verificationAnswer
        );

        Item savedItem = itemRepository.save(item);
        log.info("Created new item ID {} of type {} by user {}", savedItem.getId(), savedItem.getType(), reporter.getId());

        // Safe audit log without secret answer
        AuditLog auditLog = new AuditLog(
                reporter,
                AuditAction.ITEM_CREATED,
                "ITEM",
                savedItem.getId(),
                "{\"title\":\"" + savedItem.getTitle() + "\",\"type\":\"" + savedItem.getType() + "\"}"
        );
        auditLogRepository.save(auditLog);

        return ItemDetailDto.fromEntity(savedItem, principal.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public ItemDetailDto getItemById(UUID itemId, UserPrincipal principal) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));

        UUID currentUserId = principal != null ? principal.getId() : null;
        return ItemDetailDto.fromEntity(item, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ItemSummaryDto> getItems(String search, ItemType type, UUID categoryId,
                                                 UUID locationZoneId, ItemStatus status,
                                                 Instant from, Instant to, String sortStr,
                                                 int page, int size) {
        int sanitizedPage = Math.max(0, page);
        int sanitizedSize = Math.min(50, Math.max(1, size));

        Sort sort = parseSort(sortStr);
        Pageable pageable = PageRequest.of(sanitizedPage, sanitizedSize, sort);

        Specification<Item> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Status filter: default to OPEN for public browse if not specified
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            } else {
                predicates.add(cb.equal(root.get("status"), ItemStatus.OPEN));
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

            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }

            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            // Keyword search against public fields only (Title, Description, LocationDetail)
            // NEVER searching verification_answer!
            if (StringUtils.hasText(search)) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), term);
                Predicate descLike = cb.like(cb.lower(root.get("description")), term);
                Predicate locLike = cb.like(cb.lower(root.get("locationDetail")), term);
                predicates.add(cb.or(titleLike, descLike, locLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Item> itemPage = itemRepository.findAll(spec, pageable);
        List<ItemSummaryDto> dtos = itemPage.getContent().stream()
                .map(ItemSummaryDto::fromEntity)
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
    public PageResponse<ItemSummaryDto> getMyItems(UserPrincipal principal, ItemType type,
                                                   ItemStatus status, String sortStr,
                                                   int page, int size) {
        if (principal == null) {
            throw new InvalidCredentialsException();
        }

        int sanitizedPage = Math.max(0, page);
        int sanitizedSize = Math.min(50, Math.max(1, size));

        Sort sort = parseSort(sortStr);
        Pageable pageable = PageRequest.of(sanitizedPage, sanitizedSize, sort);

        Specification<Item> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("reporter").get("id"), principal.getId()));

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Item> itemPage = itemRepository.findAll(spec, pageable);
        List<ItemSummaryDto> dtos = itemPage.getContent().stream()
                .map(ItemSummaryDto::fromEntity)
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
    @Transactional
    public ItemDetailDto updateItem(UUID itemId, UpdateItemRequest request, UserPrincipal principal) {
        if (principal == null) {
            throw new InvalidCredentialsException();
        }

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));

        boolean isOwner = item.getReporter().getId().equals(principal.getId());
        boolean isAdmin = principal.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            log.warn("Unauthorized attempt to edit item {} by user {}", itemId, principal.getId());
            throw new ApiException("You do not have permission to modify this item", HttpStatus.FORBIDDEN) {};
        }

        if (principal.getStatus() == UserStatus.BLOCKED) {
            throw new AccountBlockedException();
        }

        if (item.getStatus() == ItemStatus.ARCHIVED && !isAdmin) {
            throw new ApiException("Archived items cannot be modified", HttpStatus.BAD_REQUEST) {};
        }

        if (StringUtils.hasText(request.getTitle())) {
            item.setTitle(request.getTitle().trim());
        }

        if (StringUtils.hasText(request.getDescription())) {
            item.setDescription(request.getDescription().trim());
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            item.setCategory(category);
        }

        if (request.getLocationZoneId() != null) {
            LocationZone zone = locationZoneRepository.findById(request.getLocationZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("LocationZone", "id", request.getLocationZoneId()));
            item.setLocationZone(zone);
        }

        if (request.getLocationDetail() != null) {
            item.setLocationDetail(request.getLocationDetail().trim());
        }

        if (request.getOccurredAt() != null) {
            item.setOccurredAt(request.getOccurredAt());
        }

        if (item.getType() == ItemType.FOUND) {
            if (request.getVerificationQuestion() != null) {
                item.setVerificationQuestion(request.getVerificationQuestion().trim());
            }
            if (request.getVerificationAnswer() != null) {
                item.setVerificationAnswer(request.getVerificationAnswer().trim());
            }
        }

        Item updatedItem = itemRepository.save(item);
        log.info("Updated item ID {} by user {}", updatedItem.getId(), principal.getId());

        AuditLog auditLog = new AuditLog(
                userRepository.getReferenceById(principal.getId()),
                AuditAction.ITEM_UPDATED,
                "ITEM",
                updatedItem.getId(),
                "{\"title\":\"" + updatedItem.getTitle() + "\"}"
        );
        auditLogRepository.save(auditLog);

        return ItemDetailDto.fromEntity(updatedItem, principal.getId());
    }

    @Override
    @Transactional
    public ItemImageDto uploadItemImage(UUID itemId, MultipartFile file, UserPrincipal principal) {
        if (principal == null) {
            throw new InvalidCredentialsException();
        }

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));

        boolean isOwner = item.getReporter().getId().equals(principal.getId());
        boolean isAdmin = principal.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            log.warn("Unauthorized image upload attempt for item {} by user {}", itemId, principal.getId());
            throw new ApiException("You do not have permission to upload images to this item", HttpStatus.FORBIDDEN) {};
        }

        if (principal.getStatus() == UserStatus.BLOCKED) {
            throw new AccountBlockedException();
        }

        List<ItemImage> currentImages = itemImageRepository.findByItemIdOrderBySortOrderAsc(itemId);
        if (currentImages.size() >= MAX_IMAGES_PER_ITEM) {
            throw new ApiException("Maximum of " + MAX_IMAGES_PER_ITEM + " images per item allowed", HttpStatus.BAD_REQUEST) {};
        }

        FileStorageService.StoredFile stored = fileStorageService.store(file, "items");
        int nextOrder = currentImages.size();

        ItemImage image = new ItemImage(
                item,
                stored.storageKey(),
                stored.publicUrl(),
                stored.mimeType(),
                stored.fileSize(),
                nextOrder
        );

        ItemImage saved = itemImageRepository.save(image);
        log.info("Uploaded image {} for item {}", saved.getId(), itemId);

        return ItemImageDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteItemImage(UUID itemId, UUID imageId, UserPrincipal principal) {
        if (principal == null) {
            throw new InvalidCredentialsException();
        }

        ItemImage image = itemImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("ItemImage", "id", imageId));

        if (!image.getItem().getId().equals(itemId)) {
            throw new ApiException("Image does not belong to specified item", HttpStatus.BAD_REQUEST) {};
        }

        boolean isOwner = image.getItem().getReporter().getId().equals(principal.getId());
        boolean isAdmin = principal.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            log.warn("Unauthorized image delete attempt for image {} by user {}", imageId, principal.getId());
            throw new ApiException("You do not have permission to delete this image", HttpStatus.FORBIDDEN) {};
        }

        if (principal.getStatus() == UserStatus.BLOCKED) {
            throw new AccountBlockedException();
        }

        fileStorageService.delete(image.getStorageKey());
        itemImageRepository.delete(image);
        log.info("Deleted image {} for item {}", imageId, itemId);
    }

    private Sort parseSort(String sortStr) {
        if (!StringUtils.hasText(sortStr)) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sortStr.trim().toLowerCase()) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "occurred_latest" -> Sort.by(Sort.Direction.DESC, "occurredAt");
            case "occurred_oldest" -> Sort.by(Sort.Direction.ASC, "occurredAt");
            case "title_asc" -> Sort.by(Sort.Direction.ASC, "title");
            case "title_desc" -> Sort.by(Sort.Direction.DESC, "title");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }
}
