package com.campus.lostfound.dto.admin;

import com.campus.lostfound.entity.AuditAction;

import java.time.Instant;
import java.util.UUID;

public class AuditLogDto {

    private UUID id;
    private UUID actorUserId;
    private String actorName;
    private String actorEmail;
    private AuditAction action;
    private String entityType;
    private UUID entityId;
    private String metadata;
    private Instant createdAt;

    public AuditLogDto() {
    }

    public AuditLogDto(UUID id, UUID actorUserId, String actorName, String actorEmail,
                       AuditAction action, String entityType, UUID entityId,
                       String metadata, Instant createdAt) {
        this.id = id;
        this.actorUserId = actorUserId;
        this.actorName = actorName;
        this.actorEmail = actorEmail;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.metadata = metadata;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(UUID actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public AuditAction getAction() {
        return action;
    }

    public void setAction(AuditAction action) {
        this.action = action;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public UUID getEntityId() {
        return entityId;
    }

    public void setEntityId(UUID entityId) {
        this.entityId = entityId;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
