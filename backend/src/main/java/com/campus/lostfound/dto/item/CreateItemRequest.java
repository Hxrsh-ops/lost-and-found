package com.campus.lostfound.dto.item;

import com.campus.lostfound.entity.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public class CreateItemRequest {

    @NotNull(message = "Item type (LOST or FOUND) is required")
    private ItemType type;

    @NotBlank(message = "Item title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private UUID categoryId;

    @NotNull(message = "Location zone is required")
    private UUID locationZoneId;

    @Size(max = 255, message = "Location detail cannot exceed 255 characters")
    private String locationDetail;

    private Instant occurredAt;

    @Size(max = 500, message = "Verification question cannot exceed 500 characters")
    private String verificationQuestion;

    @Size(max = 500, message = "Verification answer cannot exceed 500 characters")
    private String verificationAnswer;

    public CreateItemRequest() {
    }

    public CreateItemRequest(ItemType type, String title, String description, UUID categoryId,
                             UUID locationZoneId, String locationDetail, Instant occurredAt,
                             String verificationQuestion, String verificationAnswer) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.categoryId = categoryId;
        this.locationZoneId = locationZoneId;
        this.locationDetail = locationDetail;
        this.occurredAt = occurredAt;
        this.verificationQuestion = verificationQuestion;
        this.verificationAnswer = verificationAnswer;
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

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public UUID getLocationZoneId() {
        return locationZoneId;
    }

    public void setLocationZoneId(UUID locationZoneId) {
        this.locationZoneId = locationZoneId;
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

    public String getVerificationQuestion() {
        return verificationQuestion;
    }

    public void setVerificationQuestion(String verificationQuestion) {
        this.verificationQuestion = verificationQuestion;
    }

    public String getVerificationAnswer() {
        return verificationAnswer;
    }

    public void setVerificationAnswer(String verificationAnswer) {
        this.verificationAnswer = verificationAnswer;
    }
}
