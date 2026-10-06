/**
 * Domain types for Lost & Found Hub
 * Strictly aligned with 08_DATA_API_SPEC.md
 */

export type UserRole = 'STUDENT' | 'SECURITY' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export type ItemType = 'LOST' | 'FOUND';
export type ItemStatus = 'OPEN' | 'RESOLVED' | 'ARCHIVED';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface LocationZone {
  id: string;
  name: string;
  description?: string;
}

export interface ItemImage {
  id: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  createdAt: string;
}

export interface ItemSummary {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: Category;
  location: LocationZone;
  locationDetail?: string;
  occurredAt?: string;
  status: ItemStatus;
  primaryImageUrl?: string;
  verificationRequired: boolean;
  imageCount: number;
  createdAt: string;
}

export interface ItemDetail {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: Category;
  location: LocationZone;
  locationDetail?: string;
  occurredAt?: string;
  status: ItemStatus;
  verificationRequired: boolean;
  verificationQuestion?: string;
  images: ItemImage[];
  reporterId?: string;
  reporterName?: string;
  isOwner: boolean;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export interface CreateItemPayload {
  type: ItemType;
  title: string;
  description: string;
  categoryId: string;
  locationZoneId: string;
  locationDetail?: string;
  occurredAt?: string;
  verificationQuestion?: string;
  verificationAnswer?: string;
}

export interface UpdateItemPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  locationZoneId?: string;
  locationDetail?: string;
  occurredAt?: string;
  verificationQuestion?: string;
  verificationAnswer?: string;
}

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ClaimSummary {
  id: string;
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  primaryImageUrl?: string;
  status: ClaimStatus;
  createdAt: string;
  decidedAt?: string;
}

export interface ClaimDetail {
  id: string;
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  itemStatus: ItemStatus;
  itemLocation?: string;
  itemCategory?: string;
  primaryImageUrl?: string;
  claimantId: string;
  claimantName: string;
  claimantEmail?: string;
  answer?: string;
  status: ClaimStatus;
  reviewNote?: string;
  createdAt: string;
  decidedAt?: string;
  isClaimant: boolean;
  canReview: boolean;
}

export interface CreateClaimPayload {
  answer: string;
}

export interface RejectClaimPayload {
  reviewNote: string;
}

export type NotificationType =
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'ITEM_RESOLVED'
  | 'ADMIN_ACTION';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string>;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export type AuditAction =
  | 'USER_REGISTERED'
  | 'LOGIN_FAILURE'
  | 'ITEM_CREATED'
  | 'ITEM_UPDATED'
  | 'ITEM_ARCHIVED'
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'ITEM_RESOLVED'
  | 'USER_BLOCKED'
  | 'USER_UNBLOCKED'
  | 'ROLE_CHANGED'
  | 'ADMIN_ACTION';

export interface AuditLog {
  id: string;
  actorUserId?: string;
  actorName: string;
  actorEmail: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: string;
  createdAt: string;
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
}

export interface UpdateUserRolePayload {
  role: UserRole;
}
