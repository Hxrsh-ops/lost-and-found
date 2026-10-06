package com.campus.lostfound.dto;

import com.campus.lostfound.entity.ClaimStatus;
import com.campus.lostfound.entity.ItemType;

import java.time.Instant;
import java.util.UUID;

public class ClaimSummaryDto {

    private UUID id;
    private UUID itemId;
    private String itemTitle;
    private ItemType itemType;
    private String primaryImageUrl;
    private ClaimStatus status;
    private Instant createdAt;
    private Instant decidedAt;

    public ClaimSummaryDto() {
    }

    public ClaimSummaryDto(UUID id, UUID itemId, String itemTitle, ItemType itemType,
                           String primaryImageUrl, ClaimStatus status, Instant createdAt, Instant decidedAt) {
        this.id = id;
        this.itemId = itemId;
        this.itemTitle = itemTitle;
        this.itemType = itemType;
        this.primaryImageUrl = primaryImageUrl;
        this.status = status;
        this.createdAt = createdAt;
        this.decidedAt = decidedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getItemId() {
        return itemId;
    }

    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }

    public String getItemTitle() {
        return itemTitle;
    }

    public void setItemTitle(String itemTitle) {
        this.itemTitle = itemTitle;
    }

    public ItemType getItemType() {
        return itemType;
    }

    public void setItemType(ItemType itemType) {
        this.itemType = itemType;
    }

    public String getPrimaryImageUrl() {
        return primaryImageUrl;
    }

    public void setPrimaryImageUrl(String primaryImageUrl) {
        this.primaryImageUrl = primaryImageUrl;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(Instant decidedAt) {
        this.decidedAt = decidedAt;
    }
}
