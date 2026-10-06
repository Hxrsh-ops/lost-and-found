import { apiClient } from './apiClient';
import type {
  CreateItemPayload,
  ItemDetail,
  ItemImage,
  ItemStatus,
  ItemSummary,
  ItemType,
  PaginatedResponse,
  UpdateItemPayload,
} from '../types';

export interface GetItemsParams {
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

export const itemService = {
  async getItems(params?: GetItemsParams): Promise<PaginatedResponse<ItemSummary>> {
    return apiClient.get<PaginatedResponse<ItemSummary>>(
      '/items',
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getMyItems(params?: {
    type?: ItemType;
    status?: ItemStatus;
    sort?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<ItemSummary>> {
    return apiClient.get<PaginatedResponse<ItemSummary>>(
      '/items/me',
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getItemById(itemId: string): Promise<ItemDetail> {
    return apiClient.get<ItemDetail>(`/items/${itemId}`);
  },

  async createItem(payload: CreateItemPayload): Promise<ItemDetail> {
    return apiClient.post<ItemDetail>('/items', payload);
  },

  async updateItem(itemId: string, payload: UpdateItemPayload): Promise<ItemDetail> {
    return apiClient.patch<ItemDetail>(`/items/${itemId}`, payload);
  },

  async uploadImage(itemId: string, file: File): Promise<ItemImage> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<ItemImage>(`/items/${itemId}/images`, formData);
  },

  async deleteImage(itemId: string, imageId: string): Promise<void> {
    return apiClient.delete<void>(`/items/${itemId}/images/${imageId}`);
  },
};
