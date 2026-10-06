import { apiClient } from './apiClient';
import type {
  AdminUser,
  AuditAction,
  AuditLog,
  ClaimDetail,
  ClaimStatus,
  ItemDetail,
  ItemStatus,
  ItemSummary,
  ItemType,
  PaginatedResponse,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
  UserRole,
  UserStatus,
} from '../types';

export interface GetAdminUsersParams {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sort?: string;
  page?: number;
  size?: number;
}

export interface GetAdminItemsParams {
  search?: string;
  type?: ItemType;
  categoryId?: string;
  locationZoneId?: string;
  status?: ItemStatus;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
  size?: number;
}

export interface GetAdminAuditLogsParams {
  actorUserId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
  size?: number;
}

export const adminService = {
  // Users
  async getUsers(params?: GetAdminUsersParams): Promise<PaginatedResponse<AdminUser>> {
    return apiClient.get<PaginatedResponse<AdminUser>>(
      '/admin/users',
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getUserById(userId: string): Promise<AdminUser> {
    return apiClient.get<AdminUser>(`/admin/users/${userId}`);
  },

  async updateUserStatus(userId: string, payload: UpdateUserStatusPayload): Promise<AdminUser> {
    return apiClient.patch<AdminUser>(`/admin/users/${userId}/status`, payload);
  },

  async updateUserRole(userId: string, payload: UpdateUserRolePayload): Promise<AdminUser> {
    return apiClient.patch<AdminUser>(`/admin/users/${userId}/role`, payload);
  },

  // Items
  async getAdminItems(params?: GetAdminItemsParams): Promise<PaginatedResponse<ItemSummary>> {
    return apiClient.get<PaginatedResponse<ItemSummary>>(
      '/admin/items',
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getAdminItemById(itemId: string): Promise<ItemDetail> {
    return apiClient.get<ItemDetail>(`/admin/items/${itemId}`);
  },

  async archiveItem(itemId: string): Promise<ItemDetail> {
    return apiClient.post<ItemDetail>(`/admin/items/${itemId}/archive`, {});
  },

  // Claims
  async getAdminClaims(params?: {
    status?: ClaimStatus;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<ClaimDetail>> {
    return apiClient.get<PaginatedResponse<ClaimDetail>>(
      '/admin/claims',
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getAdminClaimById(claimId: string): Promise<ClaimDetail> {
    return apiClient.get<ClaimDetail>(`/admin/claims/${claimId}`);
  },

  // Audit Logs
  async getAuditLogs(params?: GetAdminAuditLogsParams): Promise<PaginatedResponse<AuditLog>> {
    return apiClient.get<PaginatedResponse<AuditLog>>(
      '/admin/audit-logs',
      params as Record<string, string | number | boolean | undefined>
    );
  },
};
