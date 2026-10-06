package com.campus.lostfound.service;

import com.campus.lostfound.dto.ClaimDetailDto;
import com.campus.lostfound.dto.ClaimSummaryDto;
import com.campus.lostfound.dto.CreateClaimRequest;
import com.campus.lostfound.dto.RejectClaimRequest;
import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.entity.ClaimStatus;

import java.util.UUID;

public interface ClaimService {

    ClaimDetailDto createClaim(UUID itemId, CreateClaimRequest request, String userEmail);

    PageResponse<ClaimSummaryDto> getMyClaims(String userEmail, ClaimStatus status, int page, int size, String sort);

    ClaimDetailDto getClaimById(UUID claimId, String userEmail);

    PageResponse<ClaimDetailDto> getClaimsForReview(UUID itemId, ClaimStatus status, int page, int size, String userEmail);

    ClaimDetailDto approveClaim(UUID claimId, String userEmail);

    ClaimDetailDto rejectClaim(UUID claimId, RejectClaimRequest request, String userEmail);
}
