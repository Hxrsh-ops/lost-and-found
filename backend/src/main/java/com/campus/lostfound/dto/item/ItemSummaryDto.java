package com.campus.lostfound.dto.item;

import com.campus.lostfound.dto.category.CategoryDto;
import com.campus.lostfound.dto.location.LocationZoneDto;
import com.campus.lostfound.entity.Item;
import com.campus.lostfound.entity.ItemStatus;
import com.campus.lostfound.entity.ItemType;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.UUID;

public class ItemSummaryDto {
    private UUID id;
    private ItemType type;
    private String title;
    private String description;
    private CategoryDto category;
    private LocationZoneDto location;
    private String locationDetail;
    private Instant occurredAt;
    private ItemStatus status;
    private String primaryImageUrl;
    private boolean verificationRequired;
    private int imageCount;
    private Instant createdAt;

    public ItemSummaryDto() {
    }

    public ItemSummaryDto(UUID id, ItemType type, String title, String description, CategoryDto category,
                          LocationZoneDto location, String locationDetail, Instant occurredAt,
                          ItemStatus status, String primaryImageUrl, boolean verificationRequired,
                          int imageCount, Instant createdAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.category = category;
        this.location = location;
        this.locationDetail = locationDetail;
        this.occurredAt = occurredAt;
        this.status = status;
        this.primaryImageUrl = primaryImageUrl;
        this.verificationRequired = verificationRequired;
        this.imageCount = imageCount;
        this.createdAt = createdAt;
    }

    public static ItemSummaryDto fromEntity(Item item) {
        if (item == null) return null;

        String primaryImg = (item.getImages() != null && !item.getImages().isEmpty())
                ? item.getImages().get(0).getPublicUrl()
                : null;

        int imgCount = (item.getImages() != null) ? item.getImages().size() : 0;
        boolean hasVerification = item.getType() == ItemType.FOUND && StringUtils.hasText(item.getVerificationQuestion());

        return new ItemSummaryDto(
                item.getId(),
                item.getType(),
                item.getTitle(),
                item.getDescription(),
                CategoryDto.fromEntity(item.getCategory()),
                LocationZoneDto.fromEntity(item.getLocationZone()),
                item.getLocationDetail(),
                item.getOccurredAt(),
                item.getStatus(),
                primaryImg,
                hasVerification,
                imgCount,
                item.getCreatedAt()
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

    public String getPrimaryImageUrl() {
        return primaryImageUrl;
    }

    public void setPrimaryImageUrl(String primaryImageUrl) {
        this.primaryImageUrl = primaryImageUrl;
    }

    public boolean isVerificationRequired() {
        return verificationRequired;
    }

    public void setVerificationRequired(boolean verificationRequired) {
        this.verificationRequired = verificationRequired;
    }

    public int getImageCount() {
        return imageCount;
    }

    public void setImageCount(int imageCount) {
        this.imageCount = imageCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
