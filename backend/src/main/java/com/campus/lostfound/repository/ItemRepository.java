package com.campus.lostfound.repository;

import com.campus.lostfound.entity.Item;
import com.campus.lostfound.entity.ItemStatus;
import com.campus.lostfound.entity.ItemType;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID>, JpaSpecificationExecutor<Item> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Item i WHERE i.id = :id")
    Optional<Item> findByIdWithPessimisticLock(@Param("id") UUID id);

    Page<Item> findByStatusAndType(ItemStatus status, ItemType type, Pageable pageable);

    Page<Item> findByReporterId(UUID reporterId, Pageable pageable);

    Page<Item> findByReporterIdAndStatus(UUID reporterId, ItemStatus status, Pageable pageable);

    List<Item> findByStatusAndCreatedAtBefore(ItemStatus status, Instant threshold);
}
