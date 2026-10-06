package com.campus.lostfound.dto.category;

import com.campus.lostfound.entity.Category;

import java.util.UUID;

public class CategoryDto {
    private UUID id;
    private String name;
    private String description;

    public CategoryDto() {
    }

    public CategoryDto(UUID id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public static CategoryDto fromEntity(Category category) {
        if (category == null) return null;
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDescription()
        );
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
