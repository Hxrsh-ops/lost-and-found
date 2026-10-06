package com.campus.lostfound.service;

import com.campus.lostfound.dto.location.LocationZoneDto;

import java.util.List;

public interface LocationZoneService {
    List<LocationZoneDto> getActiveLocationZones();
}
