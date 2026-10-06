package com.campus.lostfound.service;

import com.campus.lostfound.dto.ClaimDetailDto;
import com.campus.lostfound.dto.admin.AdminUserDto;
import com.campus.lostfound.dto.admin.AuditLogDto;
import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.dto.item.ItemDetailDto;
import com.campus.lostfound.dto.item.ItemSummaryDto;
import com.campus.lostfound.entity.*;

import java.time.Instant;
import java.util.UUID;

public interface AdminService {

    PageResponse<AdminUserDto> getUsers(String search, UserRole role, UserStatus status, int page, int size, String sortParam);

    AdminUserDto getUserById(UUID userId);

    AdminUserDto updateUserStatus(UUID targetUserId, UserStatus newStatus, String adminEmail);

    AdminUserDto updateUserRole(UUID targetUserId, UserRole newRole, String adminEmail);

    PageResponse<ItemSummaryDto> getAdminItems(String search, ItemType type, UUID categoryId, UUID locationZoneId,
                                              ItemStatus status, Instant from, Instant to, int page, int size, String sortParam);

    ItemDetailDto getAdminItemById(UUID itemId, String adminEmail);

    ItemDetailDto archiveItem(UUID itemId, String adminEmail);

    PageResponse<ClaimDetailDto> getAdminClaims(ClaimStatus status, int page, int size, String adminEmail);

    ClaimDetailDto getAdminClaimById(UUID claimId, String adminEmail);

    PageResponse<AuditLogDto> getAuditLogs(UUID actorUserId, AuditAction action, String entityType, UUID entityId,
                                          Instant from, Instant to, int page, int size, String sortParam);
}
