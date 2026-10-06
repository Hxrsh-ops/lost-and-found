package com.campus.lostfound.repository;

import com.campus.lostfound.entity.Claim;
import com.campus.lostfound.entity.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, UUID>, JpaSpecificationExecutor<Claim> {

    List<Claim> findByItemId(UUID itemId);

    List<Claim> findByItemIdAndStatus(UUID itemId, ClaimStatus status);

    Page<Claim> findByItemId(UUID itemId, Pageable pageable);

    Page<Claim> findByClaimantId(UUID claimantId, Pageable pageable);

    Page<Claim> findByClaimantIdAndStatus(UUID claimantId, ClaimStatus status, Pageable pageable);

    Page<Claim> findByItemReporterId(UUID reporterId, Pageable pageable);

    Page<Claim> findByItemReporterIdAndStatus(UUID reporterId, ClaimStatus status, Pageable pageable);

    Page<Claim> findByStatus(ClaimStatus status, Pageable pageable);

    Optional<Claim> findByItemIdAndClaimantIdAndStatus(UUID itemId, UUID claimantId, ClaimStatus status);

    boolean existsByItemIdAndClaimantIdAndStatus(UUID itemId, UUID claimantId, ClaimStatus status);

    long countByItemIdAndStatus(UUID itemId, ClaimStatus status);
}
