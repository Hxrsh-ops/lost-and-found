package com.campus.lostfound.controller;

import com.campus.lostfound.dto.ClaimDetailDto;
import com.campus.lostfound.dto.ClaimSummaryDto;
import com.campus.lostfound.dto.CreateClaimRequest;
import com.campus.lostfound.dto.RejectClaimRequest;
import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.entity.ClaimStatus;
import com.campus.lostfound.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping("/items/{itemId}/claims")
    public ResponseEntity<ClaimDetailDto> createClaim(
            @PathVariable UUID itemId,
            @Valid @RequestBody CreateClaimRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClaimDetailDto created = claimService.createClaim(itemId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/claims/me")
    public ResponseEntity<PageResponse<ClaimSummaryDto>> getMyClaims(
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(claimService.getMyClaims(userDetails.getUsername(), status, page, size, sort));
    }

    @GetMapping("/claims/{claimId}")
    public ResponseEntity<ClaimDetailDto> getClaimById(
            @PathVariable UUID claimId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(claimService.getClaimById(claimId, userDetails.getUsername()));
    }

    @GetMapping("/claims")
    public ResponseEntity<PageResponse<ClaimDetailDto>> getClaimsForReview(
            @RequestParam(required = false) UUID itemId,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(claimService.getClaimsForReview(itemId, status, page, size, userDetails.getUsername()));
    }

    @GetMapping("/items/{itemId}/claims")
    public ResponseEntity<PageResponse<ClaimDetailDto>> getClaimsForItem(
            @PathVariable UUID itemId,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(claimService.getClaimsForReview(itemId, status, page, size, userDetails.getUsername()));
    }

    @PostMapping("/claims/{claimId}/approve")
    public ResponseEntity<ClaimDetailDto> approveClaim(
            @PathVariable UUID claimId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(claimService.approveClaim(claimId, userDetails.getUsername()));
    }

    @PostMapping("/claims/{claimId}/reject")
    public ResponseEntity<ClaimDetailDto> rejectClaim(
            @PathVariable UUID claimId,
            @RequestBody(required = false) RejectClaimRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(claimService.rejectClaim(claimId, request, userDetails.getUsername()));
    }
}
