package com.campus.lostfound.controller;

import com.campus.lostfound.dto.ClaimDetailDto;
import com.campus.lostfound.dto.admin.AdminUserDto;
import com.campus.lostfound.dto.admin.AuditLogDto;
import com.campus.lostfound.dto.admin.UpdateUserRoleRequest;
import com.campus.lostfound.dto.admin.UpdateUserStatusRequest;
import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.dto.item.ItemDetailDto;
import com.campus.lostfound.dto.item.ItemSummaryDto;
import com.campus.lostfound.entity.*;
import com.campus.lostfound.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ==========================================
    // USER GOVERNANCE
    // ==========================================

    @GetMapping("/users")
    public ResponseEntity<PageResponse<AdminUserDto>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        PageResponse<AdminUserDto> response = adminService.getUsers(search, role, status, page, size, sort);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserDto> getUserById(@PathVariable UUID userId) {
        AdminUserDto dto = adminService.getUserById(userId);
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<AdminUserDto> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AdminUserDto dto = adminService.updateUserStatus(userId, request.getStatus(), userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<AdminUserDto> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AdminUserDto dto = adminService.updateUserRole(userId, request.getRole(), userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    // ==========================================
    // ITEM GOVERNANCE
    // ==========================================

    @GetMapping("/items")
    public ResponseEntity<PageResponse<ItemSummaryDto>> getAdminItems(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID locationZoneId,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        PageResponse<ItemSummaryDto> response = adminService.getAdminItems(
                search, type, categoryId, locationZoneId, status, from, to, page, size, sort
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/items/{itemId}")
    public ResponseEntity<ItemDetailDto> getAdminItemById(
            @PathVariable UUID itemId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ItemDetailDto dto = adminService.getAdminItemById(itemId, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/items/{itemId}/archive")
    public ResponseEntity<ItemDetailDto> archiveItem(
            @PathVariable UUID itemId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ItemDetailDto dto = adminService.archiveItem(itemId, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    // ==========================================
    // CLAIM GOVERNANCE
    // ==========================================

    @GetMapping("/claims")
    public ResponseEntity<PageResponse<ClaimDetailDto>> getAdminClaims(
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PageResponse<ClaimDetailDto> response = adminService.getAdminClaims(status, page, size, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/claims/{claimId}")
    public ResponseEntity<ClaimDetailDto> getAdminClaimById(
            @PathVariable UUID claimId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ClaimDetailDto dto = adminService.getAdminClaimById(claimId, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    // ==========================================
    // AUDIT LOGS
    // ==========================================

    @GetMapping("/audit-logs")
    public ResponseEntity<PageResponse<AuditLogDto>> getAuditLogs(
            @RequestParam(required = false) UUID actorUserId,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        PageResponse<AuditLogDto> response = adminService.getAuditLogs(
                actorUserId, action, entityType, entityId, from, to, page, size, sort
        );
        return ResponseEntity.ok(response);
    }
}
