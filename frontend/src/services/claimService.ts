import { apiClient } from './apiClient';
import type {
  ClaimDetail,
  ClaimStatus,
  ClaimSummary,
  CreateClaimPayload,
  PaginatedResponse,
  RejectClaimPayload,
} from '../types';

export interface GetClaimsParams {
  status?: ClaimStatus;
  sort?: string;
  page?: number;
  size?: number;
}

export const claimService = {
  async submitClaim(itemId: string, payload: CreateClaimPayload): Promise<ClaimDetail> {
    return apiClient.post<ClaimDetail>(`/items/${itemId}/claims`, payload);
  },

  async getMyClaims(params?: GetClaimsParams): Promise<PaginatedResponse<ClaimSummary>> {
    return apiClient.get<PaginatedResponse<ClaimSummary>>(
      '/claims/me',
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getClaimsForReview(params?: GetClaimsParams): Promise<PaginatedResponse<ClaimDetail>> {
    return apiClient.get<PaginatedResponse<ClaimDetail>>(
      '/claims',
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getClaimById(claimId: string): Promise<ClaimDetail> {
    return apiClient.get<ClaimDetail>(`/claims/${claimId}`);
  },

  async approveClaim(claimId: string): Promise<ClaimDetail> {
    return apiClient.post<ClaimDetail>(`/claims/${claimId}/approve`, {});
  },

  async rejectClaim(claimId: string, payload: RejectClaimPayload): Promise<ClaimDetail> {
    return apiClient.post<ClaimDetail>(`/claims/${claimId}/reject`, payload);
  },
};
