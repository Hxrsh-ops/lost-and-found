import { apiClient } from './apiClient';
import type { LocationZone } from '../types';

export const locationService = {
  async getLocationZones(): Promise<LocationZone[]> {
    return apiClient.get<LocationZone[]>('/location-zones');
  },
};
