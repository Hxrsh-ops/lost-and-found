package com.campus.lostfound.dto.admin;

import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;

import java.time.Instant;
import java.util.UUID;

public class AdminUserDto {

    private UUID id;
    private String name;
    private String email;
    private UserRole role;
    private UserStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public AdminUserDto() {
    }

    public AdminUserDto(UUID id, String name, String email, UserRole role, UserStatus status, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
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
}
