package com.campus.lostfound.service.impl;

import com.campus.lostfound.dto.location.LocationZoneDto;
import com.campus.lostfound.repository.LocationZoneRepository;
import com.campus.lostfound.service.LocationZoneService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LocationZoneServiceImpl implements LocationZoneService {

    private final LocationZoneRepository locationZoneRepository;

    public LocationZoneServiceImpl(LocationZoneRepository locationZoneRepository) {
        this.locationZoneRepository = locationZoneRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocationZoneDto> getActiveLocationZones() {
        return locationZoneRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(LocationZoneDto::fromEntity)
                .collect(Collectors.toList());
    }
}
