package com.campus.lostfound.repository;

import com.campus.lostfound.entity.LocationZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocationZoneRepository extends JpaRepository<LocationZone, UUID> {

    Optional<LocationZone> findByName(String name);

    List<LocationZone> findByActiveTrueOrderByNameAsc();

    boolean existsByName(String name);
}
