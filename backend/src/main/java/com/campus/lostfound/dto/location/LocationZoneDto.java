package com.campus.lostfound.dto.location;

import com.campus.lostfound.entity.LocationZone;

import java.util.UUID;

public class LocationZoneDto {
    private UUID id;
    private String name;
    private String description;

    public LocationZoneDto() {
    }

    public LocationZoneDto(UUID id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public static LocationZoneDto fromEntity(LocationZone zone) {
        if (zone == null) return null;
        return new LocationZoneDto(
                zone.getId(),
                zone.getName(),
                zone.getDescription()
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
