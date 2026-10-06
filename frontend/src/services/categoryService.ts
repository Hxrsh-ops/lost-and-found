import { apiClient } from './apiClient';
import type { Category } from '../types';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories');
  },
};
