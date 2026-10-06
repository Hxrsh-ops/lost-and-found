import { apiClient } from './apiClient';
import type { AuthResponse, User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    if (data.token) {
      apiClient.setToken(data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    if (data.token) {
      apiClient.setToken(data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const user = await apiClient.get<User>('/auth/me');
    localStorage.setItem('auth_user', JSON.stringify(user));
    return user;
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem('auth_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },

  logout(): void {
    apiClient.setToken(null);
    localStorage.removeItem('auth_user');
  },
};
