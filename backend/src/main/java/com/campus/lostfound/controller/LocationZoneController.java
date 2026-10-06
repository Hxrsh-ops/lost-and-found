package com.campus.lostfound.controller;

import com.campus.lostfound.dto.location.LocationZoneDto;
import com.campus.lostfound.service.LocationZoneService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/location-zones")
public class LocationZoneController {

    private final LocationZoneService locationZoneService;

    public LocationZoneController(LocationZoneService locationZoneService) {
        this.locationZoneService = locationZoneService;
    }

    @GetMapping
    public ResponseEntity<List<LocationZoneDto>> getActiveLocationZones() {
        return ResponseEntity.ok(locationZoneService.getActiveLocationZones());
    }
}
