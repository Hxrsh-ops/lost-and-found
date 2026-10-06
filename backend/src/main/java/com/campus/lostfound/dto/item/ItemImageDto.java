package com.campus.lostfound.dto.item;

import com.campus.lostfound.entity.ItemImage;

import java.time.Instant;
import java.util.UUID;

public class ItemImageDto {
    private UUID id;
    private String publicUrl;
    private String mimeType;
    private Long fileSize;
    private int sortOrder;
    private Instant createdAt;

    public ItemImageDto() {
    }

    public ItemImageDto(UUID id, String publicUrl, String mimeType, Long fileSize, int sortOrder, Instant createdAt) {
        this.id = id;
        this.publicUrl = publicUrl;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
    }

    public static ItemImageDto fromEntity(ItemImage image) {
        if (image == null) return null;
        return new ItemImageDto(
                image.getId(),
                image.getPublicUrl(),
                image.getMimeType(),
                image.getFileSize(),
                image.getSortOrder(),
                image.getCreatedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPublicUrl() {
        return publicUrl;
    }

    public void setPublicUrl(String publicUrl) {
        this.publicUrl = publicUrl;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
