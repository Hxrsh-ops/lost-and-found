package com.campus.lostfound.dto.item;

import com.campus.lostfound.dto.category.CategoryDto;
import com.campus.lostfound.dto.location.LocationZoneDto;
import com.campus.lostfound.entity.Item;
import com.campus.lostfound.entity.ItemStatus;
import com.campus.lostfound.entity.ItemType;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class ItemDetailDto {
    private UUID id;
    private ItemType type;
    private String title;
    private String description;
    private CategoryDto category;
    private LocationZoneDto location;
    private String locationDetail;
    private Instant occurredAt;
    private ItemStatus status;
    private boolean verificationRequired;
    private String verificationQuestion;
    private List<ItemImageDto> images;
    private UUID reporterId;
    private String reporterName;
    
    @JsonProperty("isOwner")
    private boolean isOwner;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant resolvedAt;

    public ItemDetailDto() {
    }

    public ItemDetailDto(UUID id, ItemType type, String title, String description,
                         CategoryDto category, LocationZoneDto location, String locationDetail,
                         Instant occurredAt, ItemStatus status, boolean verificationRequired,
                         String verificationQuestion, List<ItemImageDto> images,
                         UUID reporterId, String reporterName, boolean isOwner,
                         Instant createdAt, Instant updatedAt, Instant resolvedAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.category = category;
        this.location = location;
        this.locationDetail = locationDetail;
        this.occurredAt = occurredAt;
        this.status = status;
        this.verificationRequired = verificationRequired;
        this.verificationQuestion = verificationQuestion;
        this.images = images;
        this.reporterId = reporterId;
        this.reporterName = reporterName;
        this.isOwner = isOwner;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.resolvedAt = resolvedAt;
    }

    public static ItemDetailDto fromEntity(Item item, UUID currentUserId) {
        if (item == null) return null;

        List<ItemImageDto> imageDtos = (item.getImages() != null)
                ? item.getImages().stream().map(ItemImageDto::fromEntity).collect(Collectors.toList())
                : Collections.emptyList();

        boolean hasVerification = item.getType() == ItemType.FOUND && StringUtils.hasText(item.getVerificationQuestion());
        boolean owner = currentUserId != null && item.getReporter() != null && currentUserId.equals(item.getReporter().getId());

        return new ItemDetailDto(
                item.getId(),
                item.getType(),
                item.getTitle(),
                item.getDescription(),
                CategoryDto.fromEntity(item.getCategory()),
                LocationZoneDto.fromEntity(item.getLocationZone()),
                item.getLocationDetail(),
                item.getOccurredAt(),
                item.getStatus(),
                hasVerification,
                item.getVerificationQuestion(), // Question only; verificationAnswer is strictly absent
                imageDtos,
                item.getReporter() != null ? item.getReporter().getId() : null,
                item.getReporter() != null ? item.getReporter().getName() : null,
                owner,
                item.getCreatedAt(),
                item.getUpdatedAt(),
                item.getResolvedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ItemType getType() {
        return type;
    }

    public void setType(ItemType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public CategoryDto getCategory() {
        return category;
    }

    public void setCategory(CategoryDto category) {
        this.category = category;
    }

    public LocationZoneDto getLocation() {
        return location;
    }

    public void setLocation(LocationZoneDto location) {
        this.location = location;
    }

    public String getLocationDetail() {
        return locationDetail;
    }

    public void setLocationDetail(String locationDetail) {
        this.locationDetail = locationDetail;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(Instant occurredAt) {
        this.occurredAt = occurredAt;
    }

    public ItemStatus getStatus() {
        return status;
    }

    public void setStatus(ItemStatus status) {
        this.status = status;
    }

    public boolean isVerificationRequired() {
        return verificationRequired;
    }

    public void setVerificationRequired(boolean verificationRequired) {
        this.verificationRequired = verificationRequired;
    }

    public String getVerificationQuestion() {
        return verificationQuestion;
    }

    public void setVerificationQuestion(String verificationQuestion) {
        this.verificationQuestion = verificationQuestion;
    }

    public List<ItemImageDto> getImages() {
        return images;
    }

    public void setImages(List<ItemImageDto> images) {
        this.images = images;
    }

    public UUID getReporterId() {
        return reporterId;
    }

    public void setReporterId(UUID reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }

    @JsonProperty("isOwner")
    public boolean isOwner() {
        return isOwner;
    }

    public void setOwner(boolean owner) {
        isOwner = owner;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
