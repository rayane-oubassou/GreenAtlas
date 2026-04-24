import api from './api';
import { User } from '../types';

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password });
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const { data } = await api.get<{ success: boolean; user: User }>('/auth/me');
    return data;
  },
};
