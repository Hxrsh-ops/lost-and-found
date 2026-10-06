package com.campus.lostfound.dto;

import com.campus.lostfound.entity.NotificationType;

import java.time.Instant;
import java.util.UUID;

public class NotificationDto {

    private UUID id;
    private NotificationType type;
    private String title;
    private String message;
    private boolean read;
    private Instant createdAt;
    private Instant readAt;

    public NotificationDto() {
    }

    public NotificationDto(UUID id, NotificationType type, String title, String message,
                           boolean read, Instant createdAt, Instant readAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.read = read;
        this.createdAt = createdAt;
        this.readAt = readAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }
}
